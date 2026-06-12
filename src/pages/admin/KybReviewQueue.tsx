import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileText, CheckCircle2, XCircle, Clock, Download, Shield } from 'lucide-react';

type KybRow = {
  id: string;
  merchant_id: string | null;
  user_id: string;
  doc_type: string;
  file_name: string;
  file_path: string;
  status: string;
  review_notes: string | null;
  created_at: string;
};

function useKybDocs(status: string) {
  return useQuery({
    queryKey: ['kyb-docs-admin', status],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('kyb_documents')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as KybRow[];
    },
  });
}

function ReviewCard({ row, onChanged }: { row: KybRow; onChanged: () => void }) {
  const [notes, setNotes] = useState(row.review_notes || '');
  const [busy, setBusy] = useState(false);

  const download = async () => {
    const { data, error } = await supabase.storage
      .from('kyb-documents')
      .createSignedUrl(row.file_path, 60);
    if (error || !data) return toast.error('Could not generate link');
    window.open(data.signedUrl, '_blank');
  };

  const decide = async (status: 'approved' | 'rejected') => {
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from('kyb_documents')
        .update({
          status,
          review_notes: notes || null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', row.id);
      if (error) throw error;

      // Notify merchant via edge function (handles email lookup + send)
      try {
        await supabase.functions.invoke('kyb-notify', {
          body: { kybDocumentId: row.id, status, notes },
        });
      } catch (notifyErr) {
        console.warn('KYB notify failed', notifyErr);
      }

      toast.success(`Document ${status}`);
      onChanged();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> {row.file_name}
            </CardTitle>
            <CardDescription className="mt-1">
              <span className="capitalize">{row.doc_type.replace(/_/g, ' ')}</span>
              {' · '}Merchant {row.merchant_id?.slice(0, 8) || '—'}
              {' · '}{new Date(row.created_at).toLocaleString()}
            </CardDescription>
          </div>
          <Badge variant={row.status === 'approved' ? 'default' : row.status === 'rejected' ? 'destructive' : 'secondary'}>
            {row.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button variant="outline" size="sm" onClick={download} className="gap-2">
          <Download className="h-4 w-4" /> Open document
        </Button>
        <Textarea
          placeholder="Review notes (required for rejection)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={() => decide('approved')} disabled={busy} className="gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> Approve
          </Button>
          <Button size="sm" variant="destructive" onClick={() => decide('rejected')} disabled={busy || !notes} className="gap-1.5">
            <XCircle className="h-4 w-4" /> Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Queue({ status }: { status: string }) {
  const { data, isLoading, refetch } = useKybDocs(status);
  const qc = useQueryClient();
  if (isLoading) return <div className="text-sm text-muted-foreground py-8 text-center">Loading…</div>;
  if (!data?.length) return (
    <div className="text-sm text-muted-foreground py-12 text-center border border-dashed rounded-lg">
      No {status} documents
    </div>
  );
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {data.map(row => (
        <ReviewCard key={row.id} row={row} onChanged={() => {
          refetch();
          qc.invalidateQueries({ queryKey: ['kyb-docs-admin'] });
        }} />
      ))}
    </div>
  );
}

export default function KybReviewQueue() {
  return (
    <AppLayout>
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2"><Shield className="h-5 w-5 text-primary" /></div>
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">KYB Review Queue</h1>
          <p className="text-sm text-muted-foreground">Review and approve merchant verification documents</p>
        </div>
      </div>
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending"><Clock className="h-4 w-4 mr-1.5" />Pending</TabsTrigger>
          <TabsTrigger value="approved"><CheckCircle2 className="h-4 w-4 mr-1.5" />Approved</TabsTrigger>
          <TabsTrigger value="rejected"><XCircle className="h-4 w-4 mr-1.5" />Rejected</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-4"><Queue status="pending" /></TabsContent>
        <TabsContent value="approved" className="mt-4"><Queue status="approved" /></TabsContent>
        <TabsContent value="rejected" className="mt-4"><Queue status="rejected" /></TabsContent>
      </Tabs>
    </AppLayout>
  );
}
