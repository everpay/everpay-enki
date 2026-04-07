import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowDownToLine, Upload, Globe, FileSpreadsheet, AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';

const SUPPORTED_GATEWAYS = [
  'Stripe', 'Braintree', 'PayPal', 'Authorize.Net', 'Adyen', 'Checkout.com', 'Worldpay',
  'CyberSource', 'Moneris', 'Spreedly', 'Square', 'eWAY', 'Pin Payments', 'NMI',
  'Windcave', 'Heartland', 'Payeezy', 'SagePay', 'Realex', 'SecurePay',
  'Other (CSV upload only)',
];

const DATA_TYPES = [
  { key: 'customers', label: 'Customers & Profiles', description: 'Customer records, emails, billing addresses' },
  { key: 'cards', label: 'Saved Cards / Tokens', description: 'Tokenized card data and payment methods' },
  { key: 'transactions', label: 'Transaction History', description: 'Past payments, refunds, and chargebacks' },
  { key: 'subscriptions', label: 'Subscriptions & Plans', description: 'Active subscriptions and billing plans' },
];

const CSV_TEMPLATES: Record<string, string[]> = {
  customers: ['email', 'first_name', 'last_name', 'phone', 'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country'],
  cards: ['customer_email', 'card_brand', 'last4', 'exp_month', 'exp_year', 'token', 'is_default'],
  transactions: ['transaction_id', 'amount', 'currency', 'status', 'customer_email', 'card_last4', 'created_at', 'description', 'refund_amount'],
  subscriptions: ['customer_email', 'plan_name', 'amount', 'currency', 'interval', 'status', 'current_period_start', 'current_period_end', 'cancel_at'],
};

interface GatewayMigrationToolProps {
  merchantId: string | undefined;
}

export function GatewayMigrationTool({ merchantId }: GatewayMigrationToolProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [sourceGateway, setSourceGateway] = useState('');
  const [importMethod, setImportMethod] = useState<'csv' | 'api'>('csv');
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([]);
  const [files, setFiles] = useState<Record<string, File>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['migration-jobs', merchantId],
    queryFn: async () => {
      if (!merchantId) return [];
      const { data, error } = await supabase
        .from('migration_jobs')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!merchantId,
  });

  const startMigration = useMutation({
    mutationFn: async () => {
      if (!merchantId || !sourceGateway || selectedDataTypes.length === 0) throw new Error('Missing data');

      // For CSV: validate files exist for each selected type
      if (importMethod === 'csv') {
        const missing = selectedDataTypes.filter(t => !files[t]);
        if (missing.length > 0) throw new Error(`Please upload CSV files for: ${missing.join(', ')}`);
      }

      const { error } = await supabase.from('migration_jobs').insert({
        merchant_id: merchantId,
        source_gateway: sourceGateway,
        import_method: importMethod,
        data_types: selectedDataTypes,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['migration-jobs'] });
      toast.success('Migration job created. Processing will begin shortly.');
      setIsOpen(false);
      resetForm();
    },
    onError: (e: any) => toast.error(e.message || 'Failed to start migration'),
  });

  function resetForm() {
    setSourceGateway('');
    setImportMethod('csv');
    setSelectedDataTypes([]);
    setFiles({});
  }

  function downloadTemplate(type: string) {
    const headers = CSV_TEMPLATES[type];
    if (!headers) return;
    const csv = headers.join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `everpay_import_${type}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleDataType(key: string) {
    setSelectedDataTypes(prev =>
      prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]
    );
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'processing': return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'partial': return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <ArrowDownToLine className="h-5 w-5 text-primary" />
            Data Migration
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Import customers, cards, transactions, and subscriptions from your previous gateway.
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Upload className="h-4 w-4" /> Start Migration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Migrate Gateway Data</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 mt-2">
              {/* Source gateway */}
              <div className="space-y-2">
                <Label>Source Gateway</Label>
                <Select value={sourceGateway} onValueChange={setSourceGateway}>
                  <SelectTrigger><SelectValue placeholder="Select your current gateway" /></SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_GATEWAYS.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Import method */}
              <div className="space-y-2">
                <Label>Import Method</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setImportMethod('csv')}
                    className={`rounded-xl border p-4 text-left transition-all ${importMethod === 'csv' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                  >
                    <FileSpreadsheet className={`h-5 w-5 mb-2 ${importMethod === 'csv' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className="font-medium text-sm">CSV Upload</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Upload exported data files</p>
                  </button>
                  <button
                    onClick={() => setImportMethod('api')}
                    className={`rounded-xl border p-4 text-left transition-all ${importMethod === 'api' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                  >
                    <Globe className={`h-5 w-5 mb-2 ${importMethod === 'api' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className="font-medium text-sm">API Transfer</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Connect directly via API</p>
                  </button>
                </div>
              </div>

              {/* Data types */}
              <div className="space-y-3">
                <Label>Data to Import</Label>
                {DATA_TYPES.map(dt => (
                  <div key={dt.key} className="space-y-2">
                    <div className="flex items-start gap-3 p-3 border rounded-xl hover:bg-muted/30 transition-colors">
                      <Checkbox
                        checked={selectedDataTypes.includes(dt.key)}
                        onCheckedChange={() => toggleDataType(dt.key)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{dt.label}</p>
                        <p className="text-xs text-muted-foreground">{dt.description}</p>
                      </div>
                    </div>

                    {/* CSV file upload for selected types */}
                    {importMethod === 'csv' && selectedDataTypes.includes(dt.key) && (
                      <div className="ml-9 space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept=".csv"
                            ref={(el) => { fileRefs.current[dt.key] = el; }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setFiles(prev => ({ ...prev, [dt.key]: file }));
                            }}
                            className="text-xs"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 text-xs gap-1"
                            onClick={() => downloadTemplate(dt.key)}
                          >
                            <ArrowDownToLine className="h-3 w-3" /> Template
                          </Button>
                        </div>
                        {files[dt.key] && (
                          <p className="text-xs text-green-600">✓ {files[dt.key].name}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {importMethod === 'api' && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    <strong>Note:</strong> API transfer requires gateway credentials to be configured in the Gateway Credentials section above. Everpay will connect to your source gateway to pull data automatically.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={() => startMigration.mutate()}
                disabled={!sourceGateway || selectedDataTypes.length === 0 || startMigration.isPending}
              >
                {startMigration.isPending ? 'Starting...' : 'Start Migration'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Loading...</p>
        ) : jobs.length === 0 ? (
          <div className="text-center py-8">
            <ArrowDownToLine className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No migrations yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Start a migration to import data from your previous payment gateway.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job: any) => (
              <div key={job.id} className="border rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {statusIcon(job.status)}
                    <span className="font-medium text-sm">{job.source_gateway}</span>
                    <Badge variant="outline" className="text-[10px]">{job.import_method.toUpperCase()}</Badge>
                  </div>
                  <Badge
                    variant={job.status === 'completed' ? 'default' : job.status === 'failed' ? 'destructive' : 'secondary'}
                    className="text-[10px]"
                  >
                    {job.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(job.data_types || []).map((t: string) => (
                    <Badge key={t} variant="secondary" className="text-[10px] px-1.5">{t}</Badge>
                  ))}
                </div>
                {job.status === 'processing' && (
                  <Progress value={job.progress_pct || 0} className="h-1.5" />
                )}
                {job.total_records > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {job.imported_records || 0} / {job.total_records} records imported
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  {new Date(job.created_at).toLocaleDateString()} {new Date(job.created_at).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
