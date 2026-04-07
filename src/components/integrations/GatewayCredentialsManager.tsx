import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { encryptFields } from '@/lib/vgs-encrypt';
import { Key, Plus, Trash2, Eye, EyeOff, Settings2, Shield, Lock, Zap, Loader2, CheckCircle2, XCircle } from 'lucide-react';

// Active Merchant gateway credential field definitions
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
  // Generic fallback for any Active Merchant gateway
  _default: { label: 'Generic Gateway', fields: [{ key: 'login', label: 'Login / Merchant ID', type: 'text', required: true }, { key: 'password', label: 'Password / API Key', type: 'password', required: true }, { key: 'signature', label: 'Signature / Secret (optional)', type: 'password', required: false }] },
};

const ALL_GATEWAYS = [
  'Adyen', 'Authorize.Net', 'Authorize.Net CIM', 'Axcess MS', 'Balanced', 'Bambora Asia-Pacific',
  'Bank Frick', 'Banwire', 'Barclays ePDQ', 'Be2Bill', 'Beanstream', 'BluePay', 'Borgun',
  'Braintree', 'BridgePay', 'Cardknox', 'CardSave', 'CardStream', 'Cashnet', 'Cecabank',
  'Cenpos', 'CAMS', 'Checkout.com', 'Clearhaus', 'Commercegate', 'Conekta', 'CyberSource',
  'DIBS', 'DataCash', 'Efsnet', 'Elavon', 'ePay', 'EVO Canada', 'eWAY', 'eWAY Rapid',
  'E-xact', 'Ezic', 'Fat Zebra', 'Federated Canada', 'Finansbank WebPOS', 'Flo2Cash',
  '1stPayGateway.Net', 'FirstData Global Gateway e4', 'FirstGiving', 'Garanti Sanal POS',
  'Global Transport', 'HDFC', 'Heartland', 'iATS Payments', 'Inspire Commerce', 'InstaPay',
  'IPP', 'Iridium', 'iTransact', 'JetPay', 'Komoju', 'LinkPoint', 'Litle & Co.',
  'maxiPago!', 'Merchant e-Solutions', 'Merchant One', 'MerchantWARE', 'MerchantWarrior',
  'Mercury', 'Metrics Global', 'MiGS', 'Modern Payments', 'MONEI', 'Moneris', 'MoneyMovers',
  'NAB Transact', 'NELiX TransaX', 'NetRegistry', 'BBS Netaxept', 'NETbilling', 'NETPAY Gateway',
  'NMI', 'Ogone', 'Omise', 'Openpay', 'Optimal Payments', 'Orbital Paymentech', 'Pagar.me',
  'PagoFacil', 'PayConex', 'PayGate PayXML', 'PayHub', 'PayJunction', 'PaySecure',
  'Paybox Direct', 'Payeezy', 'Payex', 'Windcave', 'PAYMILL', 'PayPal Express Checkout',
  'PayPal Payflow Pro', 'PayPal Payments Pro', 'Payscout', 'Paystation', 'Pay Way',
  'PayU India', 'Pin Payments', "Plug'n Pay", 'Psigate', 'PSL Payment Solutions',
  'QuickBooks Merchant Services', 'QuickBooks Payments', 'Quantum Gateway', 'QuickPay',
  'Qvalent', 'Raven', 'Realex', 'Redsys', 'S5', 'SagePay', 'Sage Payment Solutions',
  'Sallie Mae', 'SecureNet', 'SecurePay', 'SecurePayTech', 'SecurionPay', 'SkipJack',
  'SoEasyPay', 'Spreedly', 'Stripe', 'Swipe', 'TNS', 'Transact Pro', 'TransFirst',
  'Transnational', 'Trexle', 'TrustCommerce', 'USA ePay', 'Vanco', 'Verifi', 'ViaKLIX',
  'WebPay', 'WePay', 'Wirecard', 'Worldpay Global', 'Worldpay Online', 'Worldpay US',
];

function getFieldsForGateway(name: string) {
  const key = name.toLowerCase().replace(/[\s.'-]+/g, '_').replace(/_+/g, '_');
  return GATEWAY_FIELDS[key] || GATEWAY_FIELDS._default;
}

interface GatewayCredentialsManagerProps {
  merchantId: string | undefined;
}

export function GatewayCredentialsManager({ merchantId }: GatewayCredentialsManagerProps) {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState('');
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [label, setLabel] = useState('');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [gatewaySearch, setGatewaySearch] = useState('');

  const { data: savedCredentials = [], isLoading } = useQuery({
    queryKey: ['gateway-credentials', merchantId],
    queryFn: async () => {
      if (!merchantId) return [];
      const { data, error } = await supabase
        .from('gateway_credentials')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!merchantId,
  });

  const addCredential = useMutation({
    mutationFn: async () => {
      if (!merchantId || !selectedGateway) throw new Error('Missing data');
      // Encrypt all credential values via VGS before storing
      const encryptedCredentials = await encryptFields(credentials, 'gateway_credentials');
      const { error } = await supabase.from('gateway_credentials').insert({
        merchant_id: merchantId,
        gateway_name: selectedGateway,
        gateway_type: 'active_merchant',
        credentials: encryptedCredentials,
        environment,
        label: label || selectedGateway,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateway-credentials'] });
      toast.success('Gateway credentials encrypted & saved via VGS');
      setIsAddOpen(false);
      resetForm();
    },
    onError: (e: any) => toast.error(e.message || 'Failed to save'),
  });

  const deleteCredential = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gateway_credentials').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateway-credentials'] });
      toast.success('Gateway removed');
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('gateway_credentials').update({ is_active: active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gateway-credentials'] }),
  });

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { passed: boolean; message: string } | null>>({});

  const testCredential = useMutation({
    mutationFn: async (id: string) => {
      setTestingId(id);
      const { data, error } = await supabase.functions.invoke('gateway-test-harness', {
        body: { gateway_credential_id: id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, id) => {
      setTestResults(prev => ({ ...prev, [id]: { passed: data.test_passed, message: data.message } }));
      if (data.test_passed) {
        toast.success(data.message);
      } else {
        toast.error(data.error || data.message || 'Test failed');
      }
      setTestingId(null);
    },
    onError: (e: any, id) => {
      setTestResults(prev => ({ ...prev, [id]: { passed: false, message: e.message } }));
      toast.error(e.message || 'Connection test failed');
      setTestingId(null);
    },
  });

  function resetForm() {
    setSelectedGateway('');
    setCredentials({});
    setLabel('');
    setEnvironment('sandbox');
    setGatewaySearch('');
  }

  const filteredGateways = ALL_GATEWAYS.filter(g =>
    g.toLowerCase().includes(gatewaySearch.toLowerCase())
  );

  const gatewayFields = selectedGateway ? getFieldsForGateway(selectedGateway) : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Gateway Credentials
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Connect your external payment gateways by adding API credentials.
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(o) => { setIsAddOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Add Gateway
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Connect Payment Gateway</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {/* Gateway search & select */}
              <div className="space-y-2">
                <Label>Payment Gateway</Label>
                <Input
                  placeholder="Search 130+ gateways..."
                  value={gatewaySearch}
                  onChange={(e) => setGatewaySearch(e.target.value)}
                  className="mb-2"
                />
                {!selectedGateway ? (
                  <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                    {filteredGateways.map(g => (
                      <button
                        key={g}
                        onClick={() => { setSelectedGateway(g); setGatewaySearch(''); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                      >
                        {g}
                      </button>
                    ))}
                    {filteredGateways.length === 0 && (
                      <p className="px-3 py-4 text-sm text-muted-foreground text-center">No gateways found</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
                    <span className="font-medium text-sm">{selectedGateway}</span>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedGateway('')}>Change</Button>
                  </div>
                )}
              </div>

              {selectedGateway && gatewayFields && (
                <>
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
                      placeholder={`e.g. "${selectedGateway} Primary"`}
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
                      Credentials are tokenized via VGS (Very Good Security) vault before storage. Raw keys never touch our database.
                    </p>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={() => addCredential.mutate()}
                disabled={!selectedGateway || addCredential.isPending || gatewayFields?.fields.filter(f => f.required).some(f => !credentials[f.key])}
              >
                {addCredential.isPending ? 'Saving...' : 'Save Credentials'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Loading...</p>
        ) : savedCredentials.length === 0 ? (
          <div className="text-center py-8">
            <Key className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No gateways connected</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Add your first gateway credentials to start processing or migrating data.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedCredentials.map((cred: any) => (
              <div key={cred.id} className="flex items-center justify-between border rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Key className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{cred.label || cred.gateway_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-[10px] px-1.5">{cred.gateway_name}</Badge>
                      <Badge variant={cred.environment === 'production' ? 'default' : 'outline'} className="text-[10px] px-1.5">
                        {cred.environment}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    disabled={testingId === cred.id}
                    onClick={() => testCredential.mutate(cred.id)}
                  >
                    {testingId === cred.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : testResults[cred.id]?.passed === true ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : testResults[cred.id]?.passed === false ? (
                      <XCircle className="h-3.5 w-3.5 text-destructive" />
                    ) : (
                      <Zap className="h-3.5 w-3.5" />
                    )}
                    {testingId === cred.id ? 'Testing...' : 'Test'}
                  </Button>
                  <Switch
                    checked={cred.is_active}
                    onCheckedChange={(active) => toggleActive.mutate({ id: cred.id, active })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => deleteCredential.mutate(cred.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
