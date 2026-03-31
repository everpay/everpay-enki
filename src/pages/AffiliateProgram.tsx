import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';
import {
  Link2, Copy, Users, DollarSign, TrendingUp, MousePointerClick,
  Plus, Trash2, ExternalLink, Handshake, BarChart3, UserPlus
} from 'lucide-react';

function generateCode() {
  return 'EP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function AffiliateProgram() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newLabel, setNewLabel] = useState('');

  const { data: links = [], isLoading: linksLoading } = useQuery({
    queryKey: ['affiliate-links', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('affiliate_links')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return (data as any[]) || [];
    },
    enabled: !!user,
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ['affiliate-referrals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('affiliate_referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });
      return (data as any[]) || [];
    },
    enabled: !!user,
  });

  const createLink = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const code = generateCode();
      const { error } = await supabase.from('affiliate_links').insert({
        user_id: user.id,
        code,
        label: newLabel || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-links'] });
      setNewLabel('');
      toast.success('Affiliate link created');
    },
    onError: () => toast.error('Failed to create link'),
  });

  const deleteLink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('affiliate_links').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-links'] });
      toast.success('Link deleted');
    },
  });

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/signup?ref=${code}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const totalClicks = links.reduce((sum: number, l: any) => sum + (l.clicks || 0), 0);
  const totalSignups = links.reduce((sum: number, l: any) => sum + (l.signups || 0), 0);
  const totalEarnings = referrals.reduce((sum: number, r: any) => sum + Number(r.commission_amount || 0), 0);
  const pendingEarnings = referrals.filter((r: any) => r.status === 'pending' || r.status === 'approved')
    .reduce((sum: number, r: any) => sum + Number(r.commission_amount || 0), 0);

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Handshake className="h-6 w-6 text-primary" />
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Affiliate Program</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Refer merchants to Everpay and earn 10% commission on every new client you bring on board.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: MousePointerClick, label: 'Total Clicks', value: totalClicks, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { icon: UserPlus, label: 'Total Signups', value: totalSignups, color: 'text-primary', bg: 'bg-primary/10' },
          { icon: DollarSign, label: 'Total Earnings', value: formatCurrency(totalEarnings, 'USD'), color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { icon: TrendingUp, label: 'Pending Payout', value: formatCurrency(pendingEarnings, 'USD'), color: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* How it works */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Link2, title: 'Unique Link', desc: 'Generate your personal referral URL to share with potential merchants.' },
              { icon: BarChart3, title: 'Live Dashboard', desc: 'Track clicks, conversions, and signups in real time from this dashboard.' },
              { icon: DollarSign, title: 'Commission', desc: 'Earn 10% commission on every referred merchant\'s transaction volume.' },
            ].map((step) => (
              <div key={step.title} className="rounded-lg border border-border p-4">
                <step.icon className="h-5 w-5 text-primary mb-2" />
                <p className="font-semibold text-sm text-foreground">{step.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Link */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Your Affiliate Links</CardTitle>
          <CardDescription>Create and manage your referral links</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 mb-4">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Link Label (optional)</Label>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Twitter campaign"
                className="h-9"
              />
            </div>
            <Button
              onClick={() => createLink.mutate()}
              disabled={createLink.isPending}
              size="sm"
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Generate Link
            </Button>
          </div>

          {links.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Link2 className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">No affiliate links yet</p>
              <p className="text-xs text-muted-foreground mt-1">Create your first link above to start earning</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-center">Clicks</TableHead>
                    <TableHead className="text-center">Signups</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((link: any) => (
                    <TableRow key={link.id}>
                      <TableCell className="font-medium text-foreground">
                        {link.label || '—'}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{link.code}</code>
                      </TableCell>
                      <TableCell className="text-center">{link.clicks}</TableCell>
                      <TableCell className="text-center">{link.signups}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyLink(link.code)}>
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy link</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => deleteLink.mutate(link.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referrals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Referral History</CardTitle>
          <CardDescription>Track the status of merchants you've referred</CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Users className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">No referrals yet</p>
              <p className="text-xs text-muted-foreground mt-1">Share your affiliate link to start earning commissions</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((ref: any) => (
                    <TableRow key={ref.id}>
                      <TableCell className="font-medium text-foreground">{ref.referred_email || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          ref.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          ref.status === 'approved' ? 'bg-primary/10 text-primary border-primary/20' :
                          'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }>
                          {ref.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(Number(ref.commission_amount || 0), 'USD')}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(ref.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
