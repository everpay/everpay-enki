import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff, Lock, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { encryptFields } from '@/lib/vgs-encrypt';

const GATEWAY_FIELDS: Record<string, { label: string; fields: { key: string; label: string; type: string; required: boolean }[] }> = {
  stripe: { label: 'Stripe', fields: [{ key: 'api_key', label: 'Secret Key', type: 'password', required: true }, { key: 'publishable_key', label: 'Publishable Key', type: 'text', required: false }] },
  braintree: { label: 'Braintree', fields: [{ key: 'merchant_id', label: 'Merchant ID', type: 'text', required: true }, { key: 'public_key', label: 'Public Key', type: 'text', required: true }, { key: 'private_key', label: 'Private Key', type: 'password', required: true }] },
  authorize_net: { label: 'Authorize.Net', fields: [{ key: 'login', label: 'API Login ID', type: 'text', required: true }, { key: 'password', label: 'Transaction Key', type: 'password', required: true }] },
  cybersource: { label: 'CyberSource', fields: [{ key: 'login', label: 'Merchant ID', type: 'text', required: true }, { key: 'password', label: 'Transaction Security Key', type: 'password', required: true }] },
  paypal: { label: 'PayPal', fields: [{ key: 'login', label: 'API Username', type: 'text', required: true }, { key: 'password', label: 'API Password', type: 'password', required: true }, { key: 'signature', label: 'Signature', type: 'password', required: true }] },
  worldpay: { label: 'Worldpay', fields: [{ key: 'login', label: 'Installation ID', type: 'text', required: true }, { key: 'password', label: 'Payment Response Password', type: 'password', required: true }] },
  adyen: { label: 'Adyen', fields: [{ key: 'login', label: 'Merchant Account', type: 'text', required: true }, { key: 'password', label: 'API Key', type: 'password', required: true }] },
  checkout_com: { label: 'Checkout.com', fields: [{ key: 'secret_key', label: 'Secret Key', type: 'password', required: true }, { key: 'public_key', label: 'Public Key', type: 'text', required: false }] },
  moneris: { label: 'Moneris', fields: [{ key: 'login', label: 'Store ID', type: 'text', required: true }, { key: 'password', label: 'API Token', type: 'password', required: true }] },
  nmi: { label: 'NMI', fields: [{ key: 'login', label: 'Username', type: 'text', required: true }, { key: 'password', label: 'Password', type: 'password', required: true }] },
  shieldhub: { label: 'ShieldHub', fields: [{ key: 'client_id', label: 'Client ID', type: 'text', required: true }, { key: 'api_secret', label: 'API Secret', type: 'password', required: true }] },
  mondo: { label: 'Mondo', fields: [{ key: 'account_id', label: 'Account ID', type: 'text', required: true }, { key: 'gateway_secret_key', label: 'Gateway Secret Key', type: 'password', required: true }, { key: 'openbanking_api_key', label: 'Open Banking API Key', type: 'password', required: false }] },
  paygate10: { label: 'Paygate10', fields: [{ key: 'api_key', label: 'API Key', type: 'password', required: true }, { key: 'merchant_id', label: 'Merchant ID', type: 'text', required: true }] },
  ofa: { label: 'OFA Pay', fields: [{ key: 'api_key', label: 'API Key', type: 'password', required: true }, { key: 'merchant_id', label: 'Merchant ID', type: 'text', required: true }] },
  moneto: { label: 'Moneto', fields: [{ key: 'api_key', label: 'API Key', type: 'password', required: true }, { key: 'wallet_id', label: 'Wallet ID', type: 'text', required: true }] },
  dcbank: { label: 'DC Bank', fields: [{ key: 'api_key', label: 'API Key', type: 'password', required: true }, { key: 'merchant_number', label: 'Merchant Number', type: 'text', required: true }] },
  makapay: { label: 'MakaPay', fields: [{ key: 'api_key', label: 'API Key', type: 'password', required: true }, { key: 'api_secret', label: 'API Secret', type: 'password', required: true }] },
  lipad: { label: 'Lipad.io', fields: [{ key: 'api_key', label: 'API Key', type: 'password', required: true }, { key: 'merchant_id', label: 'Merchant ID', type: 'text', required: true }] },
  payok: { label: 'PayOK', fields: [{ key: 'api_key', label: 'API Key', type: 'password', required: true }, { key: 'rsa_public_key', label: 'RSA Public Key', type: 'password', required: true }] },
  matrix: { label: 'Matrix Pay', fields: [{ key: 'public_key', label: 'Public Key', type: 'text', required: true }, { key: 'private_key', label: 'Private Key', type: 'password', required: true }] },
  prometeo: { label: 'Prometeo', fields: [{ key: 'api_key', label: 'API Key', type: 'password', required: true }] },
  chargeflow: { label: 'Chargeflow', fields: [{ key: 'api_key', label: 'API Key', type: 'password', required: true }] },
  tapix: { label: 'Tapix', fields: [{ key: 'token', label: 'API Token', type: 'password', required: true }] },
  shopify: { label: 'Shopify', fields: [{ key: 'api_key', label: 'API Key', type: 'text', required: true }, { key: 'api_secret', label: 'API Secret', type: 'password', required: true }, { key: 'shop_domain', label: 'Shop Domain', type: 'text', required: true }] },
  bigcommerce: { label: 'BigCommerce', fields: [{ key: 'store_hash', label: 'Store Hash', type: 'text', required: true }, { key: 'access_token', label: 'Access Token', type: 'password', required: true }] },
  _default: { label: 'Gateway', fields: [{ key: 'login', label: 'Login / Merchant ID', type: 'text', required: true }, { key: 'password', label: 'Password / API Key', type: 'password', required: true }, { key: 'signature', label: 'Signature / Secret (optional)', type: 'password', required: false }] },
};

function getFieldsForGateway(name: string) {
  const key = name.toLowerCase().replace(/[\s.'-]+/g, '_').replace(/_+/g, '_');
  return GATEWAY_FIELDS[key] || GATEWAY_FIELDS._default;
}

interface IntegrationConfigureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integrationId: string;
  integrationName: string;
  merchantId: string | undefined;
  isConnected: boolean;
}

export function IntegrationConfigureModal({
  open,
  onOpenChange,
  integrationId,
  integrationName,
  merchantId,
  isConnected,
}: IntegrationConfigureModalProps) {
  const queryClient = useQueryClient();
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [label, setLabel] = useState('');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const gatewayFields = getFieldsForGateway(integrationName);

  const saveCredential = useMutation({
    mutationFn: async () => {
      if (!merchantId) throw new Error('Merchant account required. Complete onboarding first.');
      const encryptedCredentials = await encryptFields(credentials, 'gateway_credentials');
      const { error } = await supabase.from('gateway_credentials').insert({
        merchant_id: merchantId,
        gateway_name: integrationId,
        gateway_type: 'active_merchant',
        credentials: encryptedCredentials,
        environment,
        label: label || integrationName,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateway-credentials'] });
      toast.success(`${integrationName} credentials saved & encrypted`);
      onOpenChange(false);
      resetForm();
    },
    onError: (e: any) => toast.error(e.message || 'Failed to save credentials'),
  });

  const [testResult, setTestResult] = useState<{ passed: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const testConnection = async () => {
    if (!merchantId) return;
    setIsTesting(true);
    try {
      const { data: creds } = await supabase
        .from('gateway_credentials')
        .select('id')
        .eq('merchant_id', merchantId)
        .eq('gateway_name', integrationId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (!creds) {
        setTestResult({ passed: false, message: 'No saved credentials found. Save credentials first.' });
        return;
      }
      const { data, error } = await supabase.functions.invoke('gateway-test-harness', {
        body: { gateway_credential_id: creds.id },
      });
      if (error) throw error;
      setTestResult({ passed: data.test_passed, message: data.message || data.error });
    } catch (e: any) {
      setTestResult({ passed: false, message: e.message });
    } finally {
      setIsTesting(false);
    }
  };

  function resetForm() {
    setCredentials({});
    setLabel('');
    setEnvironment('sandbox');
    setTestResult(null);
  }

  const hasRequiredFields = gatewayFields.fields.filter(f => f.required).every(f => credentials[f.key]);

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isConnected ? 'Configure' : 'Connect'} {integrationName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Environment */}
          <div className="space-y-2">
            <Label>Environment</Label>
            <Select value={environment} onValueChange={(v: 'sandbox' | 'production') => setEnvironment(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox / Test</SelectItem>
                <SelectItem value="production">Production / Live</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Label */}
          <div className="space-y-2">
            <Label>Label (optional)</Label>
            <Input
              placeholder={`e.g. "${integrationName} Primary"`}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          {/* Credential fields */}
          {gatewayFields.fields.map(field => (
            <div key={field.key} className="space-y-2">
              <Label>
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <div className="relative">
                <Input
                  type={field.type === 'password' && !showSecrets[field.key] ? 'password' : 'text'}
                  placeholder={field.label}
                  value={credentials[field.key] || ''}
                  onChange={(e) => setCredentials(prev => ({ ...prev, [field.key]: e.target.value }))}
                />
                {field.type === 'password' && (
                  <button
                    type="button"
                    onClick={() => setShowSecrets(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showSecrets[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/10 p-3">
            <Lock className="h-4 w-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">
              Credentials are tokenized via VGS vault before storage. Raw keys never touch our database.
            </p>
          </div>

          {/* Test connection result */}
          {testResult && (
            <div className={`flex items-center gap-2 rounded-lg p-3 text-sm ${testResult.passed ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-destructive/10 text-destructive'}`}>
              {testResult.passed ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {testResult.message}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          {isConnected && (
            <Button variant="outline" onClick={testConnection} disabled={isTesting}>
              {isTesting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Test Connection
            </Button>
          )}
          <Button
            onClick={() => saveCredential.mutate()}
            disabled={!hasRequiredFields || saveCredential.isPending}
          >
            {saveCredential.isPending ? 'Saving...' : isConnected ? 'Update Credentials' : 'Connect'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
