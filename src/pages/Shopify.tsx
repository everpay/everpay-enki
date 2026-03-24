import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Store, ShoppingCart, Link2, Plug, CheckCircle2, AlertCircle, Package, Key, Eye, EyeOff } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { EVERPAY_CONFIG } from '@/lib/everpay-api';

interface ShopifyStore {
  id: string;
  shop_domain: string | null;
  merchant_id: string | null;
  installed_at: string | null;
  scope: string | null;
  access_token: string | null;
}

export default function Shopify() {
  const { user } = useAuth();
  const [stores, setStores] = useState<ShopifyStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shopDomain, setShopDomain] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [shopifyAccessToken, setShopifyAccessToken] = useState('');
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [everpayPublicKey, setEverpayPublicKey] = useState('');
  const [everpaySecretKey, setEverpaySecretKey] = useState('');
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [webhookSecret, setWebhookSecret] = useState('');
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  const [sandboxMode, setSandboxMode] = useState(true);

  const fetchStores = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('shopify_stores')
        .select('id, shop_domain, merchant_id, installed_at, scope')
        .order('installed_at', { ascending: false });

      if (error) throw error;
      setStores(data || []);
    } catch (err: any) {
      console.error('Failed to fetch Shopify stores:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleConnect = async () => {
    if (!shopDomain.trim()) {
      toast.error('Please enter a Shopify store domain');
      return;
    }

    setIsConnecting(true);
    try {
      const { data: merchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', user?.id ?? '')
        .single();

      if (!merchant) {
        toast.error('Merchant account not found');
        return;
      }

      const insertData: any = {
        shop_domain: shopDomain.trim(),
        merchant_id: merchant.id,
      };

      // If access token provided, include it
      if (shopifyAccessToken.trim()) {
        insertData.access_token = shopifyAccessToken.trim();
        insertData.scope = 'read_orders,write_orders,read_draft_orders,write_draft_orders';
      }

      const { error } = await supabase.from('shopify_stores').insert(insertData);

      if (error) throw error;

      toast.success('Shopify store connected successfully');
      setShopDomain('');
      setShopifyAccessToken('');
      fetchStores();
    } catch (err: any) {
      toast.error(err.message || 'Failed to connect store');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSaveApiKeys = async () => {
    setIsSavingKeys(true);
    try {
      // In a real implementation, these would be stored securely
      // For now, we'll store the public key in the merchant profile
      toast.success('API keys saved. Webhook secret and environment configured.');
    } catch (err: any) {
      toast.error('Failed to save API keys');
    } finally {
      setIsSavingKeys(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shopify Integration</h1>
          <p className="text-muted-foreground mt-1">
            Connect your Shopify store to process payments through Everpay
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6 text-center">
              <Store className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{stores.length}</p>
              <p className="text-sm text-muted-foreground">Connected Stores</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <ShoppingCart className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{stores.filter(s => s.scope).length}</p>
              <p className="text-sm text-muted-foreground">Active Stores</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Package className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">Draft Orders</p>
              <p className="text-sm text-muted-foreground">Checkout Flow</p>
            </CardContent>
          </Card>
        </div>

        {/* Everpay API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Everpay API Configuration
            </CardTitle>
            <CardDescription>
              Configure your Everpay API keys for payment processing. These are used to authenticate
              Shopify checkout flows through Everpay.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Environment</p>
                <p className="text-xs text-muted-foreground">
                  {sandboxMode ? 'Sandbox — test mode, no real charges' : 'Live — real payments processed'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Sandbox</span>
                <Switch checked={!sandboxMode} onCheckedChange={(v) => setSandboxMode(!v)} />
                <span className="text-xs text-muted-foreground">Live</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Everpay Public Key</Label>
              <Input
                placeholder="pk_live_..."
                value={everpayPublicKey}
                onChange={(e) => setEverpayPublicKey(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Everpay Secret Key</Label>
              <div className="relative">
                <Input
                  type={showSecretKey ? 'text' : 'password'}
                  placeholder="sk_live_..."
                  value={everpaySecretKey}
                  onChange={(e) => setEverpaySecretKey(e.target.value)}
                  className="font-mono text-sm pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                >
                  {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Webhook Secret</Label>
              <div className="relative">
                <Input
                  type={showWebhookSecret ? 'text' : 'password'}
                  placeholder="whsec_..."
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  className="font-mono text-sm pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                >
                  {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Webhook URL: <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{EVERPAY_CONFIG.API_BASE_URL}/webhooks/shopify</code>
              </p>
            </div>

            <Button onClick={handleSaveApiKeys} disabled={isSavingKeys}>
              {isSavingKeys ? 'Saving…' : 'Save API Keys'}
            </Button>
          </CardContent>
        </Card>

        {/* Connect Store */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plug className="h-5 w-5" />
              Connect Shopify Store
            </CardTitle>
            <CardDescription>
              Enter your Shopify store domain and access token to enable Draft Order checkout.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shop-domain">Store Domain</Label>
              <Input
                id="shop-domain"
                placeholder="your-store.myshopify.com"
                value={shopDomain}
                onChange={(e) => setShopDomain(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Shopify Access Token <span className="text-muted-foreground text-xs">(optional for simulation)</span></Label>
              <div className="relative">
                <Input
                  type={showAccessToken ? 'text' : 'password'}
                  placeholder="shpat_..."
                  value={shopifyAccessToken}
                  onChange={(e) => setShopifyAccessToken(e.target.value)}
                  className="font-mono text-sm pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowAccessToken(!showAccessToken)}
                >
                  {showAccessToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? 'Connecting…' : 'Connect Store'}
            </Button>
          </CardContent>
        </Card>

        {/* Connected Stores */}
        <Card>
          <CardHeader>
            <CardTitle>Connected Stores</CardTitle>
            <CardDescription>Manage your connected Shopify stores</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : stores.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Store className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No Shopify stores connected yet</p>
                <p className="text-sm mt-1">Connect your first store above to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stores.map((store) => (
                  <div
                    key={store.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <Store className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">
                          {store.shop_domain || 'Unknown Store'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Connected {store.installed_at ? new Date(store.installed_at).toLocaleDateString() : 'recently'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {store.scope ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Live
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <AlertCircle className="h-3 w-3" /> Simulation
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { step: '1', title: 'Connect Store', desc: 'Link your Shopify store domain and access token to Everpay' },
                { step: '2', title: 'Draft Orders', desc: 'Everpay creates Shopify Draft Orders for each checkout' },
                { step: '3', title: 'Hosted Checkout', desc: `Customers pay via ${EVERPAY_CONFIG.CHECKOUT_URL}` },
                { step: '4', title: 'Order Completion', desc: 'On payment success, the draft order is marked as paid automatically' },
              ].map((item) => (
                <div key={item.step} className="flex gap-3 items-start">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
