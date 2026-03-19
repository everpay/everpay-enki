import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useBigCommerce } from '@/hooks/useBigCommerce';
import { Store, ShoppingCart, Link2, Plug, CheckCircle2, AlertCircle } from 'lucide-react';

export default function BigCommerce() {
  const { stores, isLoading, listStores, connectStore } = useBigCommerce();
  const [storeHash, setStoreHash] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    listStores();
  }, []);

  const handleSimulatedConnect = async () => {
    if (!storeHash.trim()) {
      toast.error('Please enter a store hash');
      return;
    }
    setIsConnecting(true);
    try {
      const result = await connectStore({
        code: `sim_code_${Date.now()}`,
        scope: 'store_v2_products store_v2_orders store_v2_transactions',
        store_hash: storeHash.trim(),
        merchant_id: '', // Will be resolved from auth context
      });
      toast.success(`Store ${storeHash} connected (${result.mode} mode)`);
      setStoreHash('');
      listStores();
    } catch (error) {
      toast.error('Failed to connect store');
    } finally {
      setIsConnecting(false);
    }
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
              { step: '2', title: 'Script Injected', desc: 'Checkout script auto-loads on your storefront' },
              { step: '3', title: 'Customer Pays', desc: 'Cards tokenized via VGS, processed by Everpay' },
              { step: '4', title: 'Order Fulfilled', desc: 'Webhook confirms payment, order status updated' },
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
            Enter your BigCommerce store hash to connect (simulation mode until live credentials are configured)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label htmlFor="storeHash" className="text-sm">Store Hash</Label>
              <Input
                id="storeHash"
                placeholder="e.g. abc123xyz"
                value={storeHash}
                onChange={(e) => setStoreHash(e.target.value)}
              />
            </div>
            <Button onClick={handleSimulatedConnect} disabled={isConnecting}>
              {isConnecting ? 'Connecting...' : 'Connect Store'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Find your store hash in BigCommerce → Settings → API Accounts. 
            Set <code>BIGCOMMERCE_CLIENT_ID</code> and <code>BIGCOMMERCE_CLIENT_SECRET</code> for live OAuth.
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
                <div key={store.id} className="flex items-center justify-between p-3 rounded-lg border">
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
                    <Badge variant={store.active ? 'default' : 'secondary'} className="text-xs">
                      {store.active ? (
                        <><CheckCircle2 className="h-3 w-3 mr-1" /> Active</>
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

      {/* Integration Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">API Endpoints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { label: 'OAuth Callback', path: '/functions/v1/bigcommerce-oauth' },
            { label: 'Checkout Payment', path: '/functions/v1/bigcommerce-checkout' },
            { label: 'Order Webhook', path: '/functions/v1/bigcommerce-webhook' },
          ].map((endpoint) => (
            <div key={endpoint.label} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{endpoint.label}</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">{endpoint.path}</code>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
