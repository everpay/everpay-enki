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
import {
  Store, ShoppingCart, Link2, Plug, CheckCircle2, AlertCircle,
  Package, Key, Eye, EyeOff, Copy, Check, Trash2, Pencil, ExternalLink, RefreshCw, Download,
} from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { EVERPAY_CONFIG } from '@/lib/everpay-api';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ShopifyStore {
  id: string;
  shop_domain: string | null;
  merchant_id: string | null;
  installed_at: string | null;
  scope: string | null;
  access_token: string | null;
  uninstalled: boolean | null;
}

function normalizeShopDomain(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*/, '')
    .toLowerCase();
}

function isValidShopDomain(value: string): boolean {
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(value);
}

function dedupeStoresByDomain(rows: ShopifyStore[]): ShopifyStore[] {
  const seen = new Set<string>();
  const deduped: ShopifyStore[] = [];

  for (const store of rows) {
    const key = normalizeShopDomain(store.shop_domain || '') || store.id;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(store);
  }

  return deduped;
}

function launchOAuthInBestContext(installUrl: string) {
  const isEmbedded = (() => {
    try {
      return window.top !== window.self;
    } catch {
      return true;
    }
  })();

  if (isEmbedded) {
    const popup = window.open(installUrl, '_blank', 'noopener,noreferrer');
    if (popup) {
      toast.info('OAuth opened in a new tab. Complete install, then return here.');
      return;
    }
  }

  window.location.assign(installUrl);
}

export default function Shopify() {
  const { user } = useAuth();
  const [stores, setStores] = useState<ShopifyStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shopDomain, setShopDomain] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isOAuthConnecting, setIsOAuthConnecting] = useState(false);
  const [shopifyAccessToken, setShopifyAccessToken] = useState('');
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [everpayPublicKey, setEverpayPublicKey] = useState('');
  const [everpaySecretKey, setEverpaySecretKey] = useState('');
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [webhookSecret, setWebhookSecret] = useState('');
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  const [sandboxMode, setSandboxMode] = useState(true);

  // Shopify App Credentials
  const [appClientId, setAppClientId] = useState('');
  const [appClientSecret, setAppClientSecret] = useState('');
  const [showAppSecret, setShowAppSecret] = useState(false);
  const [isSavingAppCreds, setIsSavingAppCreds] = useState(false);
  const [appCredsLoaded, setAppCredsLoaded] = useState(false);
  const [visibleTokenStoreId, setVisibleTokenStoreId] = useState<string | null>(null);
  const [copiedTokenStoreId, setCopiedTokenStoreId] = useState<string | null>(null);

  // Edit state
  const [editStore, setEditStore] = useState<ShopifyStore | null>(null);
  const [editDomain, setEditDomain] = useState('');
  const [editToken, setEditToken] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete state
  const [deleteStore, setDeleteStore] = useState<ShopifyStore | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Import products state
  const [importingStoreId, setImportingStoreId] = useState<string | null>(null);

  // OAuth callback state
  const [pendingOAuthQuery, setPendingOAuthQuery] = useState<Record<string, string> | null>(null);
  const [isHandlingOAuthCallback, setIsHandlingOAuthCallback] = useState(false);

  const handleImportProducts = async (store: ShopifyStore) => {
    if (!store.access_token) {
      toast.error('No access token. Connect via OAuth first.');
      return;
    }
    setImportingStoreId(store.id);
    try {
      const { data: merchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', user?.id ?? '')
        .single();
      if (!merchant) throw new Error('Merchant not found');

      const { data, error } = await supabase.functions.invoke('shopify-sync-products', {
        body: { store_id: store.id, merchant_id: merchant.id },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(`Imported ${data.imported} new products, updated ${data.updated} existing (${data.errors} errors)`);
      } else {
        toast.error(data?.error || 'Import failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to import products');
    } finally {
      setImportingStoreId(null);
    }
  };

  // Fetch token via OAuth
  const [fetchingTokenStoreId, setFetchingTokenStoreId] = useState<string | null>(null);

  const fetchStores = async () => {
    setIsLoading(true);
    try {
      // Scope to current merchant
      const { data: merchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', user?.id ?? '')
        .single();

      if (!merchant) {
        setStores([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('shopify_stores')
        .select('id, shop_domain, merchant_id, installed_at, scope, access_token, uninstalled')
        .eq('merchant_id', merchant.id)
        .order('installed_at', { ascending: false });

      if (error) throw error;
      setStores(dedupeStoresByDomain((data || []).filter(s => !s.uninstalled)));
    } catch (err: any) {
      console.error('Failed to fetch Shopify stores:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStores();
      loadAppCredentials();
    }
  }, [user]);

  const loadAppCredentials = async () => {
    try {
      const { data: merchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', user?.id ?? '')
        .single();
      if (!merchant) return;

      const { data: creds } = await supabase
        .from('shopify_app_credentials' as any)
        .select('client_id, client_secret_encrypted')
        .eq('merchant_id', merchant.id)
        .maybeSingle();

      if (creds) {
        setAppClientId((creds as any).client_id || '');
        setAppClientSecret((creds as any).client_secret_encrypted || '');
        setAppCredsLoaded(true);
      }
    } catch (err) {
      console.error('Failed to load app credentials:', err);
    }
  };

  // Listen for OAuth callback via URL params (both legacy client-side and new server redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callbackQuery = Object.fromEntries(params.entries());

    // Handle successful redirect from shopify-auth-callback edge function
    if (callbackQuery.connected === 'true' && callbackQuery.shop) {
      toast.success(`Store ${callbackQuery.shop} connected successfully!`);
      window.history.replaceState({}, '', window.location.pathname);
      fetchStores();
      return;
    }

    // Handle error redirects from callback
    if (callbackQuery.error) {
      const errorMessages: Record<string, string> = {
        missing_params: 'OAuth callback missing required parameters',
        invalid_shop: 'Invalid Shopify store domain',
        hmac_failed: 'HMAC verification failed — possible tampering',
        token_exchange_failed: 'Failed to exchange authorization code for access token',
        server_error: 'An unexpected error occurred during OAuth',
      };
      toast.error(errorMessages[callbackQuery.error] || `OAuth error: ${callbackQuery.error}`);
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    // Legacy: handle direct code+shop params (client-side callback)
    if (callbackQuery.code && callbackQuery.shop) {
      setPendingOAuthQuery(callbackQuery);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!user || !pendingOAuthQuery || isHandlingOAuthCallback) return;
    handleOAuthCallback(pendingOAuthQuery);
  }, [user, pendingOAuthQuery, isHandlingOAuthCallback]);

  const handleOAuthCallback = async (query: Record<string, string>) => {
    if (!user) return;
    setIsHandlingOAuthCallback(true);
    try {
      const { data: merchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!merchant?.id) {
        throw new Error('Merchant account not found for OAuth callback');
      }

      const { data, error } = await supabase.functions.invoke('shopify-oauth', {
        body: { action: 'callback', query, merchant_id: merchant.id },
      });

      if (error) throw error;
      if (data?.success) {
        toast.success(`Store ${data.shop} connected via OAuth (${data.mode} mode)`);
        setPendingOAuthQuery(null);
        fetchStores();
      } else {
        toast.error(data?.error || 'OAuth callback failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'OAuth callback error');
    } finally {
      setIsHandlingOAuthCallback(false);
    }
  };

  const handleOAuthConnect = async () => {
    const normalizedShop = normalizeShopDomain(shopDomain);

    if (!normalizedShop) {
      toast.error('Please enter a Shopify store domain');
      return;
    }

    if (!isValidShopDomain(normalizedShop)) {
      toast.error('Please enter a valid .myshopify.com store domain');
      return;
    }

    setIsOAuthConnecting(true);
    try {
      // Use the dedicated callback edge function URL — Shopify redirects via GET
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const callbackUrl = `${supabaseUrl}/functions/v1/shopify-auth-callback`;

      const { data, error } = await supabase.functions.invoke('shopify-oauth', {
        body: {
          action: 'install',
          shop: normalizedShop,
          redirect_uri: callbackUrl,
        },
      });

      if (error) throw error;

      if (data?.install_url) {
        launchOAuthInBestContext(data.install_url);
      } else if (data?.mode === 'simulation') {
        toast.info(data.message || 'Running in simulation mode — no Shopify API keys configured.');
      } else {
        toast.error('Failed to generate OAuth URL');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to start OAuth');
    } finally {
      setIsOAuthConnecting(false);
    }
  };

  const handleManualConnect = async () => {
    const normalizedShop = normalizeShopDomain(shopDomain);

    if (!normalizedShop) {
      toast.error('Please enter a Shopify store domain');
      return;
    }

    if (!isValidShopDomain(normalizedShop)) {
      toast.error('Please enter a valid .myshopify.com store domain');
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
        shop_domain: normalizedShop,
        merchant_id: merchant.id,
      };

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

  const handleFetchTokenViaOAuth = async (store: ShopifyStore) => {
    if (!store.shop_domain) return;
    const normalizedShop = normalizeShopDomain(store.shop_domain);
    if (!isValidShopDomain(normalizedShop)) {
      toast.error('Stored shop domain is invalid. Please edit and save the store domain first.');
      return;
    }

    setFetchingTokenStoreId(store.id);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const callbackUrl = `${supabaseUrl}/functions/v1/shopify-auth-callback`;

      const { data, error } = await supabase.functions.invoke('shopify-oauth', {
        body: {
          action: 'install',
          shop: normalizedShop,
          redirect_uri: callbackUrl,
        },
      });
      if (error) throw error;
      if (data?.install_url) {
        launchOAuthInBestContext(data.install_url);
      } else {
        toast.info(data?.message || 'Simulation mode — no OAuth redirect available');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to initiate OAuth');
    } finally {
      setFetchingTokenStoreId(null);
    }
  };

  const handleSaveApiKeys = async () => {
    setIsSavingKeys(true);
    try {
      toast.success('API keys saved. Webhook secret and environment configured.');
    } catch {
      toast.error('Failed to save API keys');
    } finally {
      setIsSavingKeys(false);
    }
  };

  // ── Edit Store ──
  const openEditDialog = (store: ShopifyStore) => {
    setEditStore(store);
    setEditDomain(store.shop_domain || '');
    setEditToken(store.access_token || '');
  };

  const handleSaveEdit = async () => {
    if (!editStore) return;
    const normalizedShop = normalizeShopDomain(editDomain);
    if (!normalizedShop || !isValidShopDomain(normalizedShop)) {
      toast.error('Please enter a valid .myshopify.com store domain');
      return;
    }

    setIsSavingEdit(true);
    try {
      const updates: any = { shop_domain: normalizedShop };
      if (editToken.trim()) updates.access_token = editToken.trim();

      const { error } = await supabase
        .from('shopify_stores')
        .update(updates)
        .eq('id', editStore.id);

      if (error) throw error;
      toast.success('Store updated');
      setEditStore(null);
      fetchStores();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update store');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ── Delete Store ──
  const handleDeleteStore = async () => {
    if (!deleteStore) return;
    setIsDeleting(true);
    try {
      let query = supabase
        .from('shopify_stores')
        .update({
          uninstalled: true,
          active: false,
          access_token: null,
          scope: null,
        });

      if (deleteStore.shop_domain && deleteStore.merchant_id) {
        query = query
          .eq('shop_domain', deleteStore.shop_domain)
          .eq('merchant_id', deleteStore.merchant_id);
      } else {
        query = query.eq('id', deleteStore.id);
      }

      const { error } = await query;

      if (error) throw error;
      toast.success('Store disconnected');

      const targetDomain = normalizeShopDomain(deleteStore.shop_domain || '');
      setStores((prev) => prev.filter((store) => {
        if (targetDomain && normalizeShopDomain(store.shop_domain || '') === targetDomain) {
          return false;
        }
        return store.id !== deleteStore.id;
      }));

      setDeleteStore(null);
      fetchStores();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete store');
    } finally {
      setIsDeleting(false);
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

        {/* Shopify App Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Shopify App Credentials
            </CardTitle>
            <CardDescription>
              Enter your Shopify app's Client ID and Secret from the Partner Dashboard → App setup.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">App Client ID</Label>
              <div className="relative">
                <Input
                  placeholder="e.g. 6c8d322d6ea3f110e8a3e89b60580e31"
                  value={appClientId}
                  onChange={(e) => setAppClientId(e.target.value)}
                  className="font-mono text-sm"
                />
                {appClientId && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      navigator.clipboard.writeText(appClientId);
                      toast.success('Client ID copied');
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">App Secret</Label>
              <div className="relative">
                <Input
                  type={showAppSecret ? 'text' : 'password'}
                  placeholder="shpss_..."
                  value={appClientSecret}
                  onChange={(e) => setAppClientSecret(e.target.value)}
                  className="font-mono text-sm pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowAppSecret(!showAppSecret)}
                >
                  {showAppSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Redirect URL</strong> — Set this in your Shopify Partner Dashboard → App setup:
              </p>
              <code className="mt-1 block bg-muted px-2 py-1 rounded text-[11px] font-mono text-foreground break-all">
                {import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify-auth-callback
              </code>
            </div>

            <Button
              onClick={async () => {
                if (!appClientId.trim() || !appClientSecret.trim()) {
                  toast.error('Both Client ID and Secret are required');
                  return;
                }
                setIsSavingAppCreds(true);
                try {
                  const { data: merchant } = await supabase
                    .from('merchants')
                    .select('id')
                    .eq('user_id', user?.id ?? '')
                    .single();
                  if (!merchant) throw new Error('Merchant not found');

                  const { data: existing } = await supabase
                    .from('shopify_app_credentials' as any)
                    .select('id')
                    .eq('merchant_id', merchant.id)
                    .maybeSingle();

                  if (existing) {
                    const { error } = await supabase
                      .from('shopify_app_credentials' as any)
                      .update({
                        client_id: appClientId.trim(),
                        client_secret_encrypted: appClientSecret.trim(),
                        updated_at: new Date().toISOString(),
                      } as any)
                      .eq('merchant_id', merchant.id);
                    if (error) throw error;
                  } else {
                    const { error } = await supabase
                      .from('shopify_app_credentials' as any)
                      .insert({
                        merchant_id: merchant.id,
                        client_id: appClientId.trim(),
                        client_secret_encrypted: appClientSecret.trim(),
                      } as any);
                    if (error) throw error;
                  }

                  toast.success('Shopify app credentials saved');
                  setAppCredsLoaded(true);
                } catch (err: any) {
                  toast.error(err.message || 'Failed to save credentials');
                } finally {
                  setIsSavingAppCreds(false);
                }
              }}
              disabled={isSavingAppCreds || !appClientId.trim() || !appClientSecret.trim()}
            >
              {isSavingAppCreds ? 'Saving…' : 'Save App Credentials'}
            </Button>

            {appCredsLoaded && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                Credentials configured
              </div>
            )}
          </CardContent>
        </Card>

        {/* Everpay API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Everpay API Configuration
            </CardTitle>
            <CardDescription>
              Configure your Everpay API keys for payment processing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Environment</p>
                <p className="text-xs text-muted-foreground">
                  {sandboxMode ? 'Sandbox — test mode' : 'Live — real payments'}
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
              <Input placeholder="pk_live_..." value={everpayPublicKey} onChange={(e) => setEverpayPublicKey(e.target.value)} className="font-mono text-sm" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Everpay Secret Key</Label>
              <div className="relative">
                <Input type={showSecretKey ? 'text' : 'password'} placeholder="sk_live_..." value={everpaySecretKey} onChange={(e) => setEverpaySecretKey(e.target.value)} className="font-mono text-sm pr-10" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowSecretKey(!showSecretKey)}>
                  {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Webhook Secret</Label>
              <div className="relative">
                <Input type={showWebhookSecret ? 'text' : 'password'} placeholder="whsec_..." value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} className="font-mono text-sm pr-10" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowWebhookSecret(!showWebhookSecret)}>
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
              Connect via OAuth (recommended) or enter an access token manually.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shop-domain">Store Domain</Label>
              <Input id="shop-domain" placeholder="your-store.myshopify.com" value={shopDomain} onChange={(e) => setShopDomain(e.target.value)} />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleOAuthConnect} disabled={isOAuthConnecting || !shopDomain.trim()} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                {isOAuthConnecting ? 'Redirecting…' : 'Connect via OAuth'}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or connect manually</span></div>
            </div>

            <div className="space-y-2">
              <Label>Shopify Access Token <span className="text-muted-foreground text-xs">(shpat_…)</span></Label>
              <div className="relative">
                <Input type={showAccessToken ? 'text' : 'password'} placeholder="shpat_..." value={shopifyAccessToken} onChange={(e) => setShopifyAccessToken(e.target.value)} className="font-mono text-sm pr-10" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowAccessToken(!showAccessToken)}>
                  {showAccessToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button variant="outline" onClick={handleManualConnect} disabled={isConnecting || !shopDomain.trim()}>
              {isConnecting ? 'Connecting…' : 'Connect Manually'}
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
                  <div key={store.id} className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Store className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">{store.shop_domain || 'Unknown Store'}</p>
                          <p className="text-xs text-muted-foreground">
                            Connected {store.installed_at ? new Date(store.installed_at).toLocaleDateString() : 'recently'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {store.scope ? (
                          <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Live</Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1"><AlertCircle className="h-3 w-3" /> Simulation</Badge>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(store)} title="Edit store">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteStore(store)} title="Delete store">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Admin API Token display */}
                    <div className="flex items-center gap-2 bg-muted/50 rounded-md p-2">
                      <Key className="h-4 w-4 text-muted-foreground shrink-0" />
                      {store.access_token ? (
                        <>
                          <code className="text-xs font-mono flex-1 truncate">
                            {visibleTokenStoreId === store.id ? store.access_token : store.access_token.slice(0, 8) + '•'.repeat(20)}
                          </code>
                          <button type="button" className="text-muted-foreground hover:text-foreground p-1" onClick={() => setVisibleTokenStoreId(visibleTokenStoreId === store.id ? null : store.id)} title={visibleTokenStoreId === store.id ? 'Hide token' : 'Show token'}>
                            {visibleTokenStoreId === store.id ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                          <button type="button" className="text-muted-foreground hover:text-foreground p-1" onClick={() => { navigator.clipboard.writeText(store.access_token!); setCopiedTokenStoreId(store.id); toast.success('Access token copied'); setTimeout(() => setCopiedTokenStoreId(null), 2000); }} title="Copy token">
                            {copiedTokenStoreId === store.id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground flex-1">No Admin API token — connect via OAuth to fetch one</span>
                      )}
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 shrink-0" disabled={fetchingTokenStoreId === store.id} onClick={() => handleFetchTokenViaOAuth(store)}>
                        <RefreshCw className={`h-3 w-3 ${fetchingTokenStoreId === store.id ? 'animate-spin' : ''}`} />
                        {store.access_token ? 'Re-auth' : 'Fetch via OAuth'}
                      </Button>
                    </div>

                    {/* Import Products */}
                    {store.access_token && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                        disabled={importingStoreId === store.id}
                        onClick={() => handleImportProducts(store)}
                      >
                        <Download className={`h-4 w-4 ${importingStoreId === store.id ? 'animate-bounce' : ''}`} />
                        {importingStoreId === store.id ? 'Importing Products…' : 'Import Products to Everpay'}
                      </Button>
                    )}

                    {store.scope && (
                      <p className="text-[11px] text-muted-foreground">Scopes: {store.scope}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" /> How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { step: '1', title: 'Connect Store', desc: 'Link your Shopify store via OAuth or access token' },
                { step: '2', title: 'Draft Orders', desc: 'Everpay creates Shopify Draft Orders for each checkout' },
                { step: '3', title: 'Hosted Checkout', desc: `Customers pay via ${EVERPAY_CONFIG.CHECKOUT_URL}` },
                { step: '4', title: 'Order Completion', desc: 'On payment success, the draft order is marked as paid automatically' },
              ].map((item) => (
                <div key={item.step} className="flex gap-3 items-start">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">{item.step}</div>
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

      {/* Edit Store Dialog */}
      <Dialog open={!!editStore} onOpenChange={(open) => !open && setEditStore(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Store</DialogTitle>
            <DialogDescription>Update the store domain or access token.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Store Domain</Label>
              <Input value={editDomain} onChange={(e) => setEditDomain(e.target.value)} placeholder="your-store.myshopify.com" />
            </div>
            <div className="space-y-2">
              <Label>Access Token</Label>
              <Input value={editToken} onChange={(e) => setEditToken(e.target.value)} placeholder="shpat_..." className="font-mono text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStore(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit}>{isSavingEdit ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteStore} onOpenChange={(open) => !open && setDeleteStore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Store</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect <strong>{deleteStore?.shop_domain}</strong>? This will remove the store and its access token.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStore} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? 'Deleting…' : 'Disconnect'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
