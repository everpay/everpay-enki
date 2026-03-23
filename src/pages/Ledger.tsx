import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/format';
import { BookOpen, ArrowDownLeft, ArrowUpRight, Scale, Download, Search, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(142 76% 36%)', 'hsl(0 84% 60%)', 'hsl(48 96% 53%)'];

export default function Ledger() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['ledger-entries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ledger_entries')
        .select('*, accounts(currency, merchant_id)')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: ledgerAccounts = [] } = useQuery({
    queryKey: ['ledger-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ledger_accounts')
        .select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    let result = entries;
    if (typeFilter !== 'all') result = result.filter(e => e.entry_type === typeFilter);
    if (currencyFilter !== 'all') result = result.filter(e => e.currency === currencyFilter);
    if (searchTerm) result = result.filter(e =>
      e.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return result;
  }, [entries, typeFilter, currencyFilter, searchTerm]);

  const currencies = useMemo(() => [...new Set(entries.map(e => e.currency))], [entries]);

  const totalDebits = filtered.filter(e => e.entry_type === 'debit').reduce((s, e) => s + Number(e.amount), 0);
  const totalCredits = filtered.filter(e => e.entry_type === 'credit').reduce((s, e) => s + Number(e.amount), 0);
  const netBalance = totalCredits - totalDebits;

  // Chart data: group by currency
  const currencyBreakdown = useMemo(() => {
    const map: Record<string, { currency: string; debits: number; credits: number }> = {};
    filtered.forEach(e => {
      if (!map[e.currency]) map[e.currency] = { currency: e.currency, debits: 0, credits: 0 };
      if (e.entry_type === 'debit') map[e.currency].debits += Number(e.amount);
      else map[e.currency].credits += Number(e.amount);
    });
    return Object.values(map);
  }, [filtered]);

  const accountTypeData = useMemo(() => {
    const map: Record<string, number> = {};
    ledgerAccounts.forEach(a => {
      map[a.account_type] = (map[a.account_type] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [ledgerAccounts]);

  const hasActiveFilters = typeFilter !== 'all' || currencyFilter !== 'all' || searchTerm !== '';

  const exportCSV = () => {
    const headers = ['ID', 'Transaction ID', 'Type', 'Amount', 'Currency', 'Account ID', 'Created At'];
    const rows = filtered.map(e => [e.id, e.transaction_id, e.entry_type, e.amount, e.currency, e.account_id, e.created_at]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Double-Entry Ledger
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Immutable financial records with dual-entry accounting</p>
          </div>
          <Button onClick={exportCSV} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowDownLeft className="h-4 w-4 text-green-500" /> Total Credits
              </div>
              <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalCredits, 'USD')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowUpRight className="h-4 w-4 text-red-500" /> Total Debits
              </div>
              <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalDebits, 'USD')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Scale className="h-4 w-4 text-primary" /> Net Balance
              </div>
              <p className={`text-2xl font-bold mt-1 ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(netBalance), 'USD')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4 text-primary" /> Total Entries
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">{filtered.length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="entries" className="space-y-4">
          <TabsList>
            <TabsTrigger value="entries">Journal Entries</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="charts">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="entries" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by transaction ID..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="debit">Debit</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
              <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                <SelectTrigger className="w-[120px]"><SelectValue placeholder="Currency" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={() => { setTypeFilter('all'); setCurrencyFilter('all'); setSearchTerm(''); }}>
                  <X className="h-4 w-4 mr-1" /> Clear
                </Button>
              )}
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Entry ID</TableHead>
                      <TableHead>Transaction</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead>Currency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading entries...</TableCell></TableRow>
                    ) : filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No ledger entries found</TableCell></TableRow>
                    ) : (
                      filtered.slice(0, 100).map(entry => (
                        <TableRow key={entry.id}>
                          <TableCell className="text-sm">{format(new Date(entry.created_at), 'MMM dd, HH:mm')}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{entry.id.slice(0, 8)}...</TableCell>
                          <TableCell className="font-mono text-xs">{entry.transaction_id.slice(0, 8)}...</TableCell>
                          <TableCell className="font-mono text-xs">{entry.account_id.slice(0, 8)}...</TableCell>
                          <TableCell>
                            <Badge variant={entry.entry_type === 'credit' ? 'default' : 'destructive'} className="text-xs">
                              {entry.entry_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {entry.entry_type === 'debit' ? formatCurrency(Number(entry.amount), entry.currency as any) : '—'}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {entry.entry_type === 'credit' ? formatCurrency(Number(entry.amount), entry.currency as any) : '—'}
                          </TableCell>
                          <TableCell><Badge variant="outline">{entry.currency}</Badge></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounts" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Ledger Accounts</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Merchant</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerAccounts.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No ledger accounts configured</TableCell></TableRow>
                    ) : (
                      ledgerAccounts.map(account => (
                        <TableRow key={account.id}>
                          <TableCell className="font-mono text-xs">{account.id.slice(0, 12)}...</TableCell>
                          <TableCell><Badge variant="secondary">{account.account_type}</Badge></TableCell>
                          <TableCell><Badge variant="outline">{account.currency}</Badge></TableCell>
                          <TableCell className="font-mono text-xs">{account.merchant_id?.slice(0, 8) || '—'}...</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{account.created_at ? format(new Date(account.created_at), 'MMM dd, yyyy') : '—'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="charts" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle>Debits vs Credits by Currency</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={currencyBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="currency" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                      <Legend />
                      <Bar dataKey="credits" fill="hsl(142 76% 36%)" name="Credits" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="debits" fill="hsl(0 84% 60%)" name="Debits" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Account Types</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={accountTypeData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {accountTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
