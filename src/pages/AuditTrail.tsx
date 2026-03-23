import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Download, Search, Shield, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function AuditTrail() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const actions = useMemo(() => [...new Set(logs.map(l => l.action))], [logs]);

  const filtered = useMemo(() => {
    let result = logs;
    if (actionFilter !== 'all') result = result.filter(l => l.action === actionFilter);
    if (searchTerm) result = result.filter(l =>
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.entity_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.entity_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return result;
  }, [logs, actionFilter, searchTerm]);

  const exportCSV = () => {
    const headers = ['Timestamp', 'Action', 'Entity Type', 'Entity ID', 'User ID', 'Metadata'];
    const rows = filtered.map(l => [
      l.created_at, l.action, l.entity_type || '', l.entity_id || '', l.user_id, JSON.stringify(l.metadata || {})
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const actionColor = (action: string) => {
    if (action.includes('create') || action.includes('insert')) return 'default';
    if (action.includes('update') || action.includes('modify')) return 'secondary';
    if (action.includes('delete') || action.includes('remove')) return 'destructive';
    return 'outline';
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Audit Trail
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Compliance-grade activity logging for regulatory reporting</p>
          </div>
          <Button onClick={exportCSV} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Export Report
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground flex items-center gap-2"><FileText className="h-4 w-4" /> Total Events</div>
              <p className="text-2xl font-bold text-foreground mt-1">{logs.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground flex items-center gap-2"><Shield className="h-4 w-4" /> Unique Actions</div>
              <p className="text-2xl font-bold text-foreground mt-1">{actions.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" /> Last Activity</div>
              <p className="text-lg font-semibold text-foreground mt-1">
                {logs.length > 0 ? format(new Date(logs[0].created_at), 'MMM dd, HH:mm:ss') : '—'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search actions, entities..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Action" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>Metadata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading audit logs...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No audit events found</TableCell></TableRow>
                ) : (
                  filtered.slice(0, 100).map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm whitespace-nowrap">{format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}</TableCell>
                      <TableCell><Badge variant={actionColor(log.action)}>{log.action}</Badge></TableCell>
                      <TableCell className="text-sm">{log.entity_type || '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{log.entity_id ? `${log.entity_id.slice(0, 12)}...` : '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {log.metadata ? JSON.stringify(log.metadata).slice(0, 60) : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
