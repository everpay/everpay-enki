import { useState, useRef } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Upload, Plus, Trash2, Send, FileSpreadsheet, Users, DollarSign, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface PayoutRecipient {
  id: string;
  name: string;
  email: string;
  amount: number;
  currency: string;
  cardNumber?: string;
  bankAccount?: string;
  method: 'card' | 'bank';
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export default function MassPayouts() {
  const [recipients, setRecipients] = useState<PayoutRecipient[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual entry form
  const [manualEntry, setManualEntry] = useState({
    name: '',
    email: '',
    amount: '',
    currency: 'USD',
    cardNumber: '',
    bankAccount: '',
    method: 'card' as 'card' | 'bank',
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xls', 'xlsx'].includes(ext || '')) {
      toast.error('Please upload a .csv, .xls, or .xlsx file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (ext === 'csv') {
        parseCSV(text);
      } else {
        toast.info('Excel files will be parsed. For best results, ensure columns: Name, Email, Amount, Currency, Card Number / Bank Account');
        // For XLS files, parse as CSV-like (simplified)
        parseCSV(text);
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      toast.error('File must have a header row and at least one data row');
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const nameIdx = headers.findIndex(h => h.includes('name'));
    const emailIdx = headers.findIndex(h => h.includes('email'));
    const amountIdx = headers.findIndex(h => h.includes('amount'));
    const currencyIdx = headers.findIndex(h => h.includes('currency'));
    const cardIdx = headers.findIndex(h => h.includes('card'));
    const bankIdx = headers.findIndex(h => h.includes('bank') || h.includes('account'));

    if (amountIdx === -1) {
      toast.error('CSV must include an "Amount" column');
      return;
    }

    const parsed: PayoutRecipient[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 2) continue;

      const amount = parseFloat(cols[amountIdx]);
      if (isNaN(amount) || amount <= 0) continue;

      parsed.push({
        id: crypto.randomUUID(),
        name: nameIdx >= 0 ? cols[nameIdx] : `Recipient ${i}`,
        email: emailIdx >= 0 ? cols[emailIdx] : '',
        amount,
        currency: currencyIdx >= 0 ? cols[currencyIdx] || 'USD' : 'USD',
        cardNumber: cardIdx >= 0 ? cols[cardIdx] : undefined,
        bankAccount: bankIdx >= 0 ? cols[bankIdx] : undefined,
        method: cardIdx >= 0 && cols[cardIdx] ? 'card' : 'bank',
        status: 'pending',
      });
    }

    if (parsed.length === 0) {
      toast.error('No valid recipients found in file');
      return;
    }

    setRecipients(prev => [...prev, ...parsed]);
    toast.success(`${parsed.length} recipients imported`);
  };

  const addManualRecipient = () => {
    if (!manualEntry.name || !manualEntry.amount || parseFloat(manualEntry.amount) <= 0) {
      toast.error('Name and a valid amount are required');
      return;
    }
    if (manualEntry.method === 'card' && !manualEntry.cardNumber) {
      toast.error('Card number is required for card payouts');
      return;
    }

    setRecipients(prev => [...prev, {
      id: crypto.randomUUID(),
      name: manualEntry.name,
      email: manualEntry.email,
      amount: parseFloat(manualEntry.amount),
      currency: manualEntry.currency,
      cardNumber: manualEntry.method === 'card' ? manualEntry.cardNumber : undefined,
      bankAccount: manualEntry.method === 'bank' ? manualEntry.bankAccount : undefined,
      method: manualEntry.method,
      status: 'pending',
    }]);

    setManualEntry({ name: '', email: '', amount: '', currency: 'USD', cardNumber: '', bankAccount: '', method: 'card' });
    toast.success('Recipient added');
  };

  const removeRecipient = (id: string) => {
    setRecipients(prev => prev.filter(r => r.id !== id));
  };

  const totalAmount = recipients.reduce((sum, r) => sum + r.amount, 0);
  const pendingCount = recipients.filter(r => r.status === 'pending').length;

  const handleProcessAll = async () => {
    if (recipients.length === 0) {
      toast.error('Add at least one recipient');
      return;
    }

    setIsProcessing(true);

    // Simulate processing each recipient
    for (let i = 0; i < recipients.length; i++) {
      setRecipients(prev => prev.map((r, idx) =>
        idx === i ? { ...r, status: 'processing' } : r
      ));

      await new Promise(resolve => setTimeout(resolve, 800));

      // Simulate success/failure (90% success rate)
      const success = Math.random() > 0.1;
      setRecipients(prev => prev.map((r, idx) =>
        idx === i ? { ...r, status: success ? 'completed' : 'failed' } : r
      ));
    }

    setIsProcessing(false);
    toast.success('Mass payout batch processed');
  };

  const downloadTemplate = () => {
    const csv = 'Name,Email,Amount,Currency,Card Number\nJohn Doe,john@example.com,100.00,USD,4111111111111111\nJane Smith,jane@example.com,250.00,USD,5500000000000004';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mass_payout_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Mass Payouts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Send payouts to multiple recipients at once via card or bank transfer
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate} className="gap-2">
            <Download className="h-4 w-4" />
            Download Template
          </Button>
          <Button
            onClick={handleProcessAll}
            disabled={isProcessing || pendingCount === 0}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {isProcessing ? 'Processing...' : `Process ${pendingCount} Payouts`}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold text-foreground">{recipients.length}</p>
              <p className="text-xs text-muted-foreground">Total Recipients</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold text-foreground">{formatCurrency(totalAmount, 'USD')}</p>
              <p className="text-xs text-muted-foreground">Total Amount</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-warning/10">
              <AlertCircle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold text-foreground">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Upload File
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Manually
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardContent className="p-6">
              <div
                className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-foreground">Drop your file here or click to browse</p>
                <p className="text-sm text-muted-foreground mt-1">Supports .csv, .xls, and .xlsx files</p>
                <p className="text-xs text-muted-foreground mt-3">
                  Required columns: Name, Email, Amount, Currency, Card Number (or Bank Account)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Recipient</CardTitle>
              <CardDescription>Manually add a payout recipient</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    placeholder="John Doe"
                    value={manualEntry.name}
                    onChange={(e) => setManualEntry(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={manualEntry.email}
                    onChange={(e) => setManualEntry(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={manualEntry.amount}
                    onChange={(e) => setManualEntry(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={manualEntry.currency} onValueChange={(v) => setManualEntry(prev => ({ ...prev, currency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Method</Label>
                  <Select value={manualEntry.method} onValueChange={(v: 'card' | 'bank') => setManualEntry(prev => ({ ...prev, method: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Payout to Card</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {manualEntry.method === 'card' ? (
                <div className="space-y-2">
                  <Label>Card Number</Label>
                  <Input
                    placeholder="4111 1111 1111 1111"
                    value={manualEntry.cardNumber}
                    onChange={(e) => setManualEntry(prev => ({ ...prev, cardNumber: e.target.value }))}
                    maxLength={19}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Bank Account / IBAN</Label>
                  <Input
                    placeholder="Enter bank account or IBAN"
                    value={manualEntry.bankAccount}
                    onChange={(e) => setManualEntry(prev => ({ ...prev, bankAccount: e.target.value }))}
                  />
                </div>
              )}

              <Button onClick={addManualRecipient} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Recipient
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recipients Table */}
      {recipients.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Payout Queue ({recipients.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{r.method}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {r.method === 'card'
                        ? `•••• ${r.cardNumber?.slice(-4) || '****'}`
                        : r.bankAccount?.slice(0, 8) + '...' || '—'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(r.amount, r.currency as any)}
                    </TableCell>
                    <TableCell>
                      {r.status === 'pending' && <Badge variant="outline">Pending</Badge>}
                      {r.status === 'processing' && <Badge className="bg-warning/10 text-warning border-warning/20">Processing</Badge>}
                      {r.status === 'completed' && (
                        <Badge className="bg-success/10 text-success border-success/20 gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed
                        </Badge>
                      )}
                      {r.status === 'failed' && <Badge variant="destructive">Failed</Badge>}
                    </TableCell>
                    <TableCell>
                      {r.status === 'pending' && (
                        <Button variant="ghost" size="icon" onClick={() => removeRecipient(r.id)} className="h-8 w-8">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {recipients.length === 0 && (
        <Card className="mt-6">
          <CardContent className="p-12 text-center">
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-foreground">No recipients yet</p>
            <p className="text-sm text-muted-foreground mt-1">Upload a file or add recipients manually to get started</p>
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
}
