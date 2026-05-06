import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  FileText, CheckCircle2, XCircle, Clock, Shield, Eye, Download, Bell, Loader2,
} from 'lucide-react';
import {
  extSelect, decideKybDocuments, getKybSignedUrl,
} from '@/hooks/useExternalData';
import { createClient } from '@supabase/supabase-js';
import { supabase as localSupabase } from '@/integrations/supabase/client';
import { useAccessControl } from '@/hooks/useAccessControl';
import Unauthorized from '@/components/admin/Unauthorized';

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
  reviewed_at?: string | null;
  reviewed_by?: string | null;
};

const LOCAL_SUPABASE_URL = 'https://schxpniiwnxzscbcnynt.supabase.co';
const LOCAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjaHhwbmlpd254enNjYmNueW50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjkzMjYsImV4cCI6MjA5MTI0NTMyNn0.AuNS8fpvPVZDazKkP9lpD4ddfW0CUt-jB012lNrrnlI';
const realtimeClient = createClient(LOCAL_SUPABASE_URL, LOCAL_SUPABASE_ANON_KEY);

function useKybDocs(status: string) {
  return useQuery({
    queryKey: ['admin-kyb-docs', status],
    queryFn: async () => {
      const rows = await extSelect('kyb_documents', {
        filters: { status },
        order: { column: 'created_at', ascending: false },
        limit: 200,
      });
      return (rows || []) as KybRow[];
    },
  });
}

function ReviewCard({
  row, selected, onToggleSelect, onChanged, onOpenDetails,
}: {
  row: KybRow;
  selected: boolean;
  onToggleSelect: () => void;
  onChanged: () => void;
  onOpenDetails: (row: KybRow) => void;
}) {
  const [notes, setNotes] = useState(row.review_notes || '');
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);

  const decide = async (status: 'approved' | 'rejected') => {
    setBusy(status === 'approved' ? 'approve' : 'reject');
    try {
      const res = await decideKybDocuments([{ id: row.id, status, notes }]);
      const r = res[0];
      if (!r?.ok) throw new Error(r?.error || 'Failed');
      toast.success(`Document ${status}`);
      onChanged();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className={selected ? 'ring-2 ring-primary' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {row.status === 'pending' && (
              <Checkbox checked={selected} onCheckedChange={onToggleSelect} className="mt-1" />
            )}
            <div className="min-w-0">
              <CardTitle className="text-base flex items-center gap-2 truncate">
                <FileText className="h-4 w-4 shrink-0" /> {row.file_name}
              </CardTitle>
              <CardDescription className="mt-1">
                <span className="capitalize">{row.doc_type?.replace(/_/g, ' ')}</span>
                {' · '}Merchant {row.merchant_id?.slice(0, 8) || '—'}
                {' · '}{new Date(row.created_at).toLocaleString()}
              </CardDescription>
            </div>
          </div>
          <Badge variant={row.status === 'approved' ? 'default' : row.status === 'rejected' ? 'destructive' : 'secondary'}>
            {row.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="Review notes (required for rejection)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          disabled={row.status !== 'pending'}
        />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => onOpenDetails(row)} className="gap-1.5">
            <Eye className="h-4 w-4" /> Details
          </Button>
          {row.status === 'pending' && (
            <>
              <Button size="sm" onClick={() => decide('approved')} disabled={!!busy} className="gap-1.5">
                {busy === 'approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={() => decide('rejected')} disabled={!!busy || !notes} className="gap-1.5">
                {busy === 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Reject
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DetailsModal({
  row, open, onClose,
}: { row: KybRow | null; open: boolean; onClose: () => void }) {
  const [signed, setSigned] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const merchant = useQuery({
    queryKey: ['kyb-doc-merchant', row?.merchant_id],
    enabled: !!row?.merchant_id,
    queryFn: async () => {
      const r = await extSelect('merchants', { filters: { id: row!.merchant_id }, limit: 1 });
      return (r?.[0] || null) as any;
    },
  });
  const profile = useQuery({
    queryKey: ['kyb-doc-profile', row?.user_id],
    enabled: !!row?.user_id,
    queryFn: async () => {
      const r = await extSelect('profiles', { filters: { user_id: row!.user_id }, limit: 1 });
      return (r?.[0] || null) as any;
    },
  });

  useEffect(() => {
    if (!row || !open) { setSigned(null); return; }
    let cancelled = false;
    setLoading(true);
    getKybSignedUrl(row.file_path, 300)
      .then((url) => { if (!cancelled) setSigned(url); })
      .catch((e) => { if (!cancelled) toast.error(e?.message || 'Could not generate preview link'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [row, open]);

  if (!row) return null;
  const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(row.file_name);
  const isPdf = /\.pdf$/i.test(row.file_name);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> {row.file_name}
          </DialogTitle>
          <DialogDescription className="capitalize">
            {row.doc_type?.replace(/_/g, ' ')} · {new Date(row.created_at).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2 text-sm">
          <div className="space-y-1">
            <div className="font-medium text-muted-foreground">Merchant</div>
            <div>{merchant.data?.name || row.merchant_id || '—'}</div>
            <div className="text-xs text-muted-foreground font-mono">{row.merchant_id || '—'}</div>
          </div>
          <div className="space-y-1">
            <div className="font-medium text-muted-foreground">Submitted by</div>
            <div>{profile.data?.display_name || profile.data?.email || row.user_id}</div>
            <div className="text-xs text-muted-foreground font-mono">{row.user_id}</div>
          </div>
          <div className="space-y-1">
            <div className="font-medium text-muted-foreground">Status</div>
            <Badge variant={row.status === 'approved' ? 'default' : row.status === 'rejected' ? 'destructive' : 'secondary'}>
              {row.status}
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="font-medium text-muted-foreground">Reviewed</div>
            <div>{row.reviewed_at ? new Date(row.reviewed_at).toLocaleString() : '—'}</div>
          </div>
          {row.review_notes && (
            <div className="md:col-span-2 space-y-1">
              <div className="font-medium text-muted-foreground">Review notes</div>
              <div className="text-sm">{row.review_notes}</div>
            </div>
          )}
        </div>

        <div className="rounded-md border bg-muted/30 p-3">
          {loading && <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Generating secure preview…</div>}
          {!loading && signed && isImage && (
            <img src={signed} alt={row.file_name} className="max-h-[400px] mx-auto rounded" />
          )}
          {!loading && signed && isPdf && (
            <iframe src={signed} title={row.file_name} className="w-full h-[400px] rounded" />
          )}
          {!loading && signed && !isImage && !isPdf && (
            <div className="text-sm text-muted-foreground">Preview not available for this file type. Use Download below.</div>
          )}
          {!loading && !signed && (
            <div className="text-sm text-muted-foreground">Could not generate preview. Try Download.</div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button asChild disabled={!signed} className="gap-1.5">
            {signed
              ? <a href={signed} target="_blank" rel="noopener noreferrer" download><Download className="h-4 w-4" /> Download</a>
              : <span><Download className="h-4 w-4" /> Download</span>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BulkConfirm({
  open, onClose, action, rows, onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  action: 'approved' | 'rejected' | null;
  rows: KybRow[];
  onConfirm: (notesById: Record<string, string>) => Promise<void>;
}) {
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) {
      const init: Record<string, string> = {};
      for (const r of rows) init[r.id] = r.review_notes || '';
      setNotesById(init);
    }
  }, [open, rows]);

  const requireNotes = action === 'rejected';
  const missingNotes = requireNotes && rows.some((r) => !(notesById[r.id] || '').trim());

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && !busy && onClose()}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Bulk {action === 'approved' ? 'approve' : 'reject'} {rows.length} document{rows.length === 1 ? '' : 's'}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action is logged in the audit trail with your reviewer ID and timestamp. {requireNotes && 'Notes are required for rejections.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="max-h-[320px] overflow-y-auto space-y-3 py-2">
          {rows.map((r) => (
            <div key={r.id} className="space-y-1.5 border-b pb-3 last:border-0">
              <div className="text-sm font-medium truncate">{r.file_name}</div>
              <div className="text-xs text-muted-foreground capitalize">
                {r.doc_type?.replace(/_/g, ' ')} · Merchant {r.merchant_id?.slice(0, 8) || '—'}
              </div>
              <Textarea
                rows={2}
                placeholder={requireNotes ? 'Reason for rejection (required)' : 'Optional notes'}
                value={notesById[r.id] || ''}
                onChange={(e) => setNotesById((s) => ({ ...s, [r.id]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy || missingNotes || !action}
            onClick={async (e) => {
              e.preventDefault();
              setBusy(true);
              try { await onConfirm(notesById); } finally { setBusy(false); }
            }}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            Confirm {action === 'approved' ? 'approval' : 'rejection'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function Queue({ status }: { status: string }) {
  const { data, isLoading, refetch } = useKybDocs(status);
  const qc = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailsRow, setDetailsRow] = useState<KybRow | null>(null);
  const [bulkAction, setBulkAction] = useState<'approved' | 'rejected' | null>(null);

  useEffect(() => { setSelectedIds(new Set()); }, [status, data?.length]);

  const selectedRows = useMemo(
    () => (data || []).filter((r) => selectedIds.has(r.id)),
    [data, selectedIds],
  );

  const refreshAll = () => {
    refetch();
    qc.invalidateQueries({ queryKey: ['admin-kyb-docs'] });
    qc.invalidateQueries({ queryKey: ['kyb-unread-count'] });
    setSelectedIds(new Set());
  };

  const runBulk = async (notesById: Record<string, string>) => {
    if (!bulkAction) return;
    const decisions = selectedRows.map((r) => ({
      id: r.id, status: bulkAction, notes: notesById[r.id] || '',
    }));
    try {
      const results = await decideKybDocuments(decisions);
      const ok = results.filter((r) => r.ok).length;
      const fail = results.length - ok;
      if (ok) toast.success(`${ok} document${ok === 1 ? '' : 's'} ${bulkAction}`);
      if (fail) toast.error(`${fail} document${fail === 1 ? '' : 's'} failed`);
      setBulkAction(null);
      refreshAll();
    } catch (e: any) {
      toast.error(e?.message || 'Bulk action failed');
    }
  };

  if (isLoading) return <div className="text-sm text-muted-foreground py-8 text-center">Loading…</div>;
  if (!data?.length) {
    return (
      <div className="text-sm text-muted-foreground py-12 text-center border border-dashed rounded-lg">
        No {status} documents
      </div>
    );
  }

  const allSelected = status === 'pending' && selectedIds.size === data.length;

  return (
    <>
      {status === 'pending' && (
        <div className="flex items-center justify-between gap-2 mb-3 p-3 bg-muted/40 rounded-lg border">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={allSelected}
              onCheckedChange={(v) => setSelectedIds(v ? new Set(data.map((r) => r.id)) : new Set())}
            />
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
          </label>
          <div className="flex gap-2">
            <Button size="sm" disabled={!selectedIds.size} onClick={() => setBulkAction('approved')} className="gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Bulk approve
            </Button>
            <Button size="sm" variant="destructive" disabled={!selectedIds.size} onClick={() => setBulkAction('rejected')} className="gap-1.5">
              <XCircle className="h-4 w-4" /> Bulk reject
            </Button>
          </div>
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {data.map((row) => (
          <ReviewCard
            key={row.id}
            row={row}
            selected={selectedIds.has(row.id)}
            onToggleSelect={() => {
              setSelectedIds((s) => {
                const n = new Set(s);
                n.has(row.id) ? n.delete(row.id) : n.add(row.id);
                return n;
              });
            }}
            onOpenDetails={setDetailsRow}
            onChanged={refreshAll}
          />
        ))}
      </div>
      <DetailsModal row={detailsRow} open={!!detailsRow} onClose={() => setDetailsRow(null)} />
      <BulkConfirm
        open={!!bulkAction}
        action={bulkAction}
        rows={selectedRows}
        onClose={() => setBulkAction(null)}
        onConfirm={runBulk}
      />
    </>
  );
}

export default function AdminKybReviewQueue() {
  const { isAdmin, isSuperAdmin, isLoading: roleLoading } = useAccessControl();
  const qc = useQueryClient();

  // Realtime: pop a toast and invalidate queries when a new KYB notification arrives.
  useEffect(() => {
    if (!isAdmin && !isSuperAdmin) return;
    const channel = realtimeClient
      .channel('kyb-review-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'kyb_review_notifications' },
        (payload: any) => {
          const r = payload.new || {};
          toast.message('New KYB document submitted', {
            description: `${r.doc_type || 'document'} · ${r.file_name || ''}`,
            icon: <Bell className="h-4 w-4" />,
          });
          qc.invalidateQueries({ queryKey: ['admin-kyb-docs'] });
          qc.invalidateQueries({ queryKey: ['kyb-unread-count'] });
        },
      )
      .subscribe();
    return () => { realtimeClient.removeChannel(channel); };
  }, [isAdmin, isSuperAdmin, qc]);

  const unreadCount = useQuery({
    queryKey: ['kyb-unread-count'],
    enabled: isAdmin || isSuperAdmin,
    queryFn: async () => {
      const { count } = await realtimeClient
        .from('kyb_review_notifications')
        .select('id', { count: 'exact', head: true })
        .is('read_at', null);
      return count || 0;
    },
    refetchInterval: 60_000,
  });

  if (roleLoading) return <AppLayout><div className="p-6">Loading…</div></AppLayout>;
  if (!isAdmin && !isSuperAdmin) return <Unauthorized />;

  return (
    <AppLayout>
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2"><Shield className="h-5 w-5 text-primary" /></div>
        <div className="flex-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight">KYB Review Queue</h1>
          <p className="text-sm text-muted-foreground">
            Review and approve merchant verification documents submitted after onboarding.
          </p>
        </div>
        {!!unreadCount.data && (
          <Badge variant="secondary" className="gap-1.5">
            <Bell className="h-3.5 w-3.5" /> {unreadCount.data} new
          </Badge>
        )}
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