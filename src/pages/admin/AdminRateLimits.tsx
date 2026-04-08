import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Gauge, Plus, Save, RefreshCw } from 'lucide-react';

const AdminRateLimits = () => {
  const queryClient = useQueryClient();
  const [selectedMerchant, setSelectedMerchant] = useState<string>('all');

  const { data: merchants = [] } = useQuery({
    queryKey: ['admin-merchants-rl'],
    queryFn: async () => {
      const { data, error } = await supabase.from('merchants').select('id, name');
      if (error) throw error;
      return data as Array<{ id: string; name: string }>;
    },
  });

  const { data: limits = [], isLoading } = useQuery({
    queryKey: ['admin-rate-limits', selectedMerchant],
    queryFn: async () => {
      let q = supabase.from('merchant_endpoint_rate_limits').select('*');
      if (selectedMerchant !== 'all') q = q.eq('merchant_id', selectedMerchant);
      const { data, error } = await q.order('merchant_id');
      if (error) throw error;
      return data as any[];
    },
  });

  const merchantMap = new Map(merchants.map(m => [m.id, m.name]));

  const [editState, setEditState] = useState<Record<string, { rpm: string; burst: string }>>({});

  const updateMutation = useMutation({
    mutationFn: async ({ id, rpm, burst }: { id: string; rpm: number; burst: number }) => {
      const { error } = await supabase
        .from('merchant_endpoint_rate_limits')
        .update({ requests_per_minute: rpm, burst_limit: burst })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rate-limits'] });
      toast.success('Rate limit updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const createMutation = useMutation({
    mutationFn: async ({ merchant_id, endpoint_type }: { merchant_id: string; endpoint_type: string }) => {
      const { error } = await supabase
        .from('merchant_endpoint_rate_limits')
        .insert({ merchant_id, endpoint_type, requests_per_minute: 120, burst_limit: 30 });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rate-limits'] });
      toast.success('Rate limit created');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Rate Limits Configuration</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage per-merchant, per-endpoint rate limits.
          </p>
        </div>
        <Select value={selectedMerchant} onValueChange={setSelectedMerchant}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filter by merchant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Merchants</SelectItem>
            {merchants.map(m => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Gauge className="h-4 w-4" /> Endpoint Rate Limits
          </CardTitle>
          {selectedMerchant !== 'all' && (
            <div className="flex gap-2">
              {['payments', 'payouts', 'api'].map(ep => (
                <Button
                  key={ep}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => createMutation.mutate({ merchant_id: selectedMerchant, endpoint_type: ep })}
                >
                  <Plus className="h-3 w-3 mr-1" /> {ep}
                </Button>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : limits.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {selectedMerchant === 'all'
                ? 'No custom rate limits configured. Default of 120 rpm applies.'
                : 'No rate limits for this merchant. Click buttons above to create.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Requests/Min</TableHead>
                  <TableHead>Burst Limit</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {limits.map((l) => {
                  const es = editState[l.id];
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">
                        {merchantMap.get(l.merchant_id) || l.merchant_id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="capitalize">{l.endpoint_type}</TableCell>
                      <TableCell>
                        <Input
                          className="w-24 h-7 text-xs"
                          type="number"
                          defaultValue={l.requests_per_minute}
                          onChange={e => setEditState(prev => ({
                            ...prev,
                            [l.id]: { ...prev[l.id], rpm: e.target.value, burst: prev[l.id]?.burst ?? String(l.burst_limit) }
                          }))}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="w-24 h-7 text-xs"
                          type="number"
                          defaultValue={l.burst_limit}
                          onChange={e => setEditState(prev => ({
                            ...prev,
                            [l.id]: { rpm: prev[l.id]?.rpm ?? String(l.requests_per_minute), burst: e.target.value }
                          }))}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          disabled={!es}
                          onClick={() => {
                            if (es) {
                              updateMutation.mutate({
                                id: l.id,
                                rpm: parseInt(es.rpm),
                                burst: parseInt(es.burst),
                              });
                              setEditState(prev => {
                                const next = { ...prev };
                                delete next[l.id];
                                return next;
                              });
                            }
                          }}
                        >
                          <Save className="h-3 w-3 mr-1" /> Save
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default AdminRateLimits;
