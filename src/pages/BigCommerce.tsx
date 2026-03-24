import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useBigCommerce } from '@/hooks/useBigCommerce';
import { Store, ShoppingCart, Link2, Plug, CheckCircle2, AlertCircle, RefreshCw, Webhook, Settings2, ShoppingBag, Eye, EyeOff, Copy, Code } from 'lucide-react';

export default function BigCommerce() {
  const {
    stores, isLoading, listStores, connectStore,
    getConfig, saveConfig, getOrders, getWebhookLogs,
    registerWebhooks, refreshToken
  } = useBigCommerce();

  const [storeHash, setStoreHash] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedStore, setSelectedStore] = useState<any>(null);

  // Config state
  const [config, setConfig] = useState<any>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [everpayPublicKey, setEverpayPublicKey] = useState('');
  const [everpaySecret, setEverpaySecret] = useState('');
  const [testMode, setTestMode] = useState(true);
  const [checkoutEnabled, setCheckoutEnabled] = useState(true);
  const [buttonText, setButtonText] = useState('Pay with Everpay');
  const [buttonBg, setButtonBg] = useState('#0052cc');
  const [buttonColor, setButtonColor] = useState('#ffffff');
  const [headerText, setHeaderText] = useState('Pay securely with Everpay');

  // Orders & Logs
  const [orders, setOrders] = useState<any[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);

  // Access token visibility
  const [showToken, setShowToken] = useState(false);

  useEffect(() => { listStores(); }, []);

  const handleConnect = async () => {
    if (!storeHash.trim()) { toast.error('Please enter a store hash'); return; }
    setIsConnecting(true);
    try {
      const result = await connectStore({
        code: `sim_code_${Date.now()}`,
        scope: 'store_v2_products store_v2_orders store_v2_transactions',
        store_hash: storeHash.trim(),
        merchant_id: '',
      });
      toast.success(`Store ${storeHash} connected (${result.mode} mode)`);
      setStoreHash('');
      listStores();
    } catch { toast.error('Failed to connect store'); }
    finally { setIsConnecting(false); }
  };

  const handleSelectStore = async (store: any) => {
    setSelectedStore(store);
    setConfigLoading(true);
    try {
      const cfg = await getConfig(store.id);
      setConfig(cfg);
      if (cfg) {
        setEverpayPublicKey(cfg.everpay_public_key || '');
        setEverpaySecret(cfg.everpay_secret_encrypted || '');
        setTestMode(cfg.test_mode ?? true);
        setCheckoutEnabled(cfg.checkout_script_enabled ?? true);
        setButtonText(cfg.button_text || 'Pay with Everpay');
        setButtonBg(cfg.button_bg_color || '#0052cc');
        setButtonColor(cfg.button_text_color || '#ffffff');
        setHeaderText(cfg.header_text || 'Pay securely with Everpay');
      }
    } catch { /* ignore */ }
    finally { setConfigLoading(false); }
  };

  const handleSaveConfig = async () => {
    if (!selectedStore) return;
    try {
      await saveConfig({
        store_id: selectedStore.id,
        everpay_public_key: everpayPublicKey,
        everpay_secret: everpaySecret,
        test_mode: testMode,
        checkout_script_enabled: checkoutEnabled,
        button_text: buttonText,
        button_bg_color: buttonBg,
        button_text_color: buttonColor,
        header_text: headerText,
      });
      toast.success('Configuration saved');
    } catch { toast.error('Failed to save configuration'); }
  };

  const handleLoadOrders = async () => {
    if (!selectedStore) return;
    setOrdersLoading(true);
    try { setOrders(await getOrders(selectedStore.id)); }
    catch { toast.error('Failed to load orders'); }
    finally { setOrdersLoading(false); }
  };

  const handleLoadLogs = async () => {
    if (!selectedStore) return;
    setLogsLoading(true);
    try { setWebhookLogs(await getWebhookLogs(selectedStore.id)); }
    catch { toast.error('Failed to load logs'); }
    finally { setLogsLoading(false); }
  };

  const handleRegisterWebhooks = async () => {
    if (!selectedStore) return;
    try {
      await registerWebhooks(selectedStore.store_hash);
      toast.success('Webhooks registered successfully');
    } catch { toast.error('Failed to register webhooks'); }
  };

  const handleRefreshToken = async () => {
    if (!selectedStore) return;
    try {
      await refreshToken(selectedStore.store_hash);
      toast.success('Token refreshed');
      listStores();
    } catch { toast.error('Failed to refresh token'); }
  };

  const maskToken = (token: string) => {
    if (!token) return '';
    if (token.length <= 8) return '••••••••';
    return token.substring(0, 4) + '••••••••' + token.substring(token.length - 4);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">BigCommerce Integration</h1>
        <p className="text-sm text-muted-foreground">
          Connect your BigCommerce store to process payments through Everpay
        </p>
      </div>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plug className="h-5 w-5" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: '1', title: 'Install Plugin', desc: 'Add Everpay to your BigCommerce store via OAuth' },
              { step: '2', title: 'Configure Keys', desc: 'Set your Everpay API keys and choose sandbox/live mode' },
              { step: '3', title: 'Script Injected', desc: 'Checkout widget auto-loads on your storefront' },
              { step: '4', title: 'Customer Pays', desc: 'Cards tokenized via Everpay, orders synced via webhooks' },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center p-3 rounded-lg border bg-card">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold mb-2">
                  {item.step}
                </div>
                <h4 className="font-medium text-sm">{item.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Connect Store */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 className="h-5 w-5" />
            Connect a Store
          </CardTitle>
          <CardDescription>
            Enter your BigCommerce store hash to connect
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label htmlFor="storeHash" className="text-sm">Store Hash</Label>
              <Input id="storeHash" placeholder="e.g. abc123xyz" value={storeHash} onChange={(e) => setStoreHash(e.target.value)} />
            </div>
            <Button onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? 'Connecting...' : 'Connect Store'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Find your store hash in BigCommerce → Settings → API Accounts.
          </p>
        </CardContent>
      </Card>

      {/* Connected Stores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Store className="h-5 w-5" />
            Connected Stores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading stores...</p>
          ) : stores.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No BigCommerce stores connected yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stores.map((store) => (
                <div
                  key={store.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedStore?.id === store.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleSelectStore(store)}
                >
                  <div className="flex items-center gap-3">
                    <Store className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{store.shop_domain || store.store_hash}</p>
                      <p className="text-xs text-muted-foreground">
                        Hash: {store.store_hash} · Installed: {new Date(store.installed_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {store.webhook_registered && (
                      <Badge variant="outline" className="text-xs">
                        <Webhook className="h-3 w-3 mr-1" /> Webhooks
                      </Badge>
                    )}
                    <Badge variant={store.active ? 'default' : 'secondary'} className="text-xs">
                      {store.active ? (
                        <><CheckCircle2 className="h-3 w-3 mr-1" /> Live</>
                      ) : (
                        <><AlertCircle className="h-3 w-3 mr-1" /> Inactive</>
                      )}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Store Detail Tabs */}
      {selectedStore && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Store: {selectedStore.shop_domain || selectedStore.store_hash}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="config">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="config"><Settings2 className="h-4 w-4 mr-1" /> Config</TabsTrigger>
                <TabsTrigger value="orders" onClick={handleLoadOrders}><ShoppingBag className="h-4 w-4 mr-1" /> Orders</TabsTrigger>
                <TabsTrigger value="webhooks" onClick={handleLoadLogs}><Webhook className="h-4 w-4 mr-1" /> Logs</TabsTrigger>
                <TabsTrigger value="token"><Eye className="h-4 w-4 mr-1" /> Token</TabsTrigger>
                <TabsTrigger value="endpoints"><Code className="h-4 w-4 mr-1" /> API</TabsTrigger>
              </TabsList>

              {/* Config Tab */}
              <TabsContent value="config" className="space-y-4 mt-4">
                {configLoading ? (
                  <p className="text-sm text-muted-foreground">Loading configuration...</p>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label className="text-sm">Everpay Public Key</Label>
                        <Input placeholder="pk_test_..." value={everpayPublicKey} onChange={(e) => setEverpayPublicKey(e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-sm">Everpay Secret Key</Label>
                        <Input type="password" placeholder="sk_test_..." value={everpaySecret} onChange={(e) => setEverpaySecret(e.target.value)} />
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Switch checked={testMode} onCheckedChange={setTestMode} />
                        <Label className="text-sm">Test Mode (Sandbox)</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={checkoutEnabled} onCheckedChange={setCheckoutEnabled} />
                        <Label className="text-sm">Checkout Script Enabled</Label>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium text-sm mb-3">Checkout Widget Customization</h4>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label className="text-sm">Header Text</Label>
                          <Input value={headerText} onChange={(e) => setHeaderText(e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-sm">Button Text</Label>
                          <Input value={buttonText} onChange={(e) => setButtonText(e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-sm">Button Background</Label>
                          <div className="flex gap-2">
                            <Input type="color" value={buttonBg} onChange={(e) => setButtonBg(e.target.value)} className="w-12 p-1 h-9" />
                            <Input value={buttonBg} onChange={(e) => setButtonBg(e.target.value)} className="flex-1" />
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm">Button Text Color</Label>
                          <div className="flex gap-2">
                            <Input type="color" value={buttonColor} onChange={(e) => setButtonColor(e.target.value)} className="w-12 p-1 h-9" />
                            <Input value={buttonColor} onChange={(e) => setButtonColor(e.target.value)} className="flex-1" />
                          </div>
                        </div>
                      </div>

                      {/* Preview */}
                      <div className="mt-4 p-4 border rounded-lg bg-muted/30">
                        <p className="text-sm font-medium mb-2">Preview</p>
                        <div className="border p-4 rounded-lg bg-background max-w-md">
                          <h4 className="text-sm font-medium mb-2">{headerText}</h4>
                          <button
                            style={{ backgroundColor: buttonBg, color: buttonColor }}
                            className="px-4 py-2 rounded-md text-sm font-semibold"
                          >
                            {buttonText}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button onClick={handleSaveConfig}>Save Configuration</Button>
                      <Button variant="outline" onClick={handleRegisterWebhooks}>
                        <Webhook className="h-4 w-4 mr-1" /> Re-register Webhooks
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Orders Tab */}
              <TabsContent value="orders" className="mt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-sm">BigCommerce Orders</h4>
                  <Button variant="outline" size="sm" onClick={handleLoadOrders}>
                    <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                  </Button>
                </div>
                {ordersLoading ? (
                  <p className="text-sm text-muted-foreground">Loading orders...</p>
                ) : orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No orders yet</p>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-2">BC Order ID</th>
                          <th className="text-left p-2">Amount</th>
                          <th className="text-left p-2">Currency</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id} className="border-t">
                            <td className="p-2 font-mono text-xs">{order.bc_order_id}</td>
                            <td className="p-2">{(order.amount || 0).toFixed(2)}</td>
                            <td className="p-2">{order.currency}</td>
                            <td className="p-2">
                              <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                                {order.status}
                              </Badge>
                            </td>
                            <td className="p-2 text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              {/* Webhook Logs Tab */}
              <TabsContent value="webhooks" className="mt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-sm">Webhook Event Logs</h4>
                  <Button variant="outline" size="sm" onClick={handleLoadLogs}>
                    <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                  </Button>
                </div>
                {logsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading logs...</p>
                ) : webhookLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No webhook events yet</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {webhookLogs.map((log) => (
                      <div key={log.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{log.source}</Badge>
                            <span className="text-sm font-medium">{log.event_type}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                        <pre className="text-xs bg-muted/50 p-2 rounded mt-1 overflow-x-auto max-h-32">
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Token Tab */}
              <TabsContent value="token" className="mt-4 space-y-4">
                <div>
                  <Label className="text-sm">BigCommerce Access Token</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      readOnly
                      type={showToken ? 'text' : 'password'}
                      value={selectedStore.access_token || ''}
                      className="font-mono text-xs"
                    />
                    <Button variant="outline" size="icon" onClick={() => setShowToken(!showToken)}>
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedStore.access_token || '');
                        toast.success('Token copied');
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleRefreshToken}>
                    <RefreshCw className="h-4 w-4 mr-1" /> Refresh Token
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Token last updated: {selectedStore.token_updated_at ? new Date(selectedStore.token_updated_at).toLocaleString() : 'N/A'}</p>
                  <p>Webhooks registered: {selectedStore.webhook_registered ? 'Yes' : 'No'}</p>
                </div>
              </TabsContent>

              {/* API Endpoints Tab */}
              <TabsContent value="endpoints" className="mt-4 space-y-2">
                {[
                  { label: 'OAuth Callback', path: '/functions/v1/bigcommerce-oauth' },
                  { label: 'Checkout Payment', path: '/functions/v1/bigcommerce-checkout' },
                  { label: 'Checkout Script', path: '/functions/v1/bigcommerce-checkout-script' },
                  { label: 'Order Webhook', path: '/functions/v1/bigcommerce-webhook' },
                ].map((endpoint) => (
                  <div key={endpoint.label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{endpoint.label}</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{endpoint.path}</code>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
