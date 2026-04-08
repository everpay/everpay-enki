import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { RiskScoreGauge } from '@/components/RiskScoreGauge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, Lock, Unlock, RefreshCw } from 'lucide-react';

const AdminRiskEngine = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMultiplier, setEditMultiplier] = useState('');

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['admin-risk-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merchant_risk_profiles')
        .select('*')
        .order('risk_score', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: merchants = [] } = useQuery({
    queryKey: ['admin-merchants-for-risk'],
    queryFn: async () => {
      const { data, error } = await supabase.from('merchants').select('id, name');
      if (error) throw error;
      return data as Array<{ id: string; name: string }>;
    },
  });

  const merchantMap = new Map(merchants.map(m => [m.id, m.name]));

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase
        .from('merchant_risk_profiles')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-risk-profiles'] });
      toast.success('Risk profile updated');
      setEditingId(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const avgRisk = profiles.length > 0
    ? profiles.reduce((s, p) => s + Number(p.risk_score), 0) / profiles.length
    : 0;
  const lockedCount = profiles.filter(p => p.locked).length;
  const highRisk = profiles.filter(p => Number(p.risk_score) > 50).length;

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Risk & Adaptive Engine</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage merchant risk scores, adaptive multipliers, and rate limit locks.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="py-4 text-center">
          <p className="text-xs text-muted-foreground">Total Profiles</p>
          <p className="text-2xl font-bold text-foreground">{profiles.length}</p>
        </CardContent></Card>
        <Card><CardContent className="py-4 text-center">
          <p className="text-xs text-muted-foreground">Avg Risk Score</p>
          <p className="text-2xl font-bold text-foreground">{avgRisk.toFixed(1)}</p>
        </CardContent></Card>
        <Card><CardContent className="py-4 text-center">
          <p className="text-xs text-muted-foreground">High Risk</p>
          <p className="text-2xl font-bold text-destructive">{highRisk}</p>
        </CardContent></Card>
        <Card><CardContent className="py-4 text-center">
          <p className="text-xs text-muted-foreground">Locked</p>
          <p className="text-2xl font-bold text-yellow-500">{lockedCount}</p>
        </CardContent></Card>
      </div>

      {/* Profiles Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" /> Merchant Risk Profiles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : profiles.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No risk profiles found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Multiplier</TableHead>
                  <TableHead>Success %</TableHead>
                  <TableHead>CB Rate</TableHead>
                  <TableHead>Fraud</TableHead>
                  <TableHead>Locked</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{merchantMap.get(p.merchant_id) || p.merchant_id.slice(0, 8)}</TableCell>
                    <TableCell>
                      <Badge variant={Number(p.risk_score) > 50 ? 'destructive' : 'default'}>
                        {Number(p.risk_score).toFixed(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {editingId === p.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editMultiplier}
                            onChange={e => setEditMultiplier(e.target.value)}
                            className="w-20 h-7 text-xs"
                            type="number"
                            step="0.001"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => updateMutation.mutate({
                              id: p.id,
                              updates: { adaptive_multiplier: parseFloat(editMultiplier) }
                            })}
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        <span
                          className="cursor-pointer hover:underline font-mono"
                          onClick={() => {
                            setEditingId(p.id);
                            setEditMultiplier(String(p.adaptive_multiplier));
                          }}
                        >
                          ×{Number(p.adaptive_multiplier).toFixed(3)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{Number(p.success_rate).toFixed(1)}%</TableCell>
                    <TableCell>{Number(p.chargeback_rate).toFixed(2)}%</TableCell>
                    <TableCell>{Number(p.fraud_score).toFixed(1)}</TableCell>
                    <TableCell>
                      <Switch
                        checked={p.locked}
                        onCheckedChange={(checked) =>
                          updateMutation.mutate({ id: p.id, updates: { locked: checked } })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          setEditingId(p.id);
                          setEditMultiplier(String(p.adaptive_multiplier));
                        }}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default AdminRiskEngine;
