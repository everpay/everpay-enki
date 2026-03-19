import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Store, ShoppingCart, Link2, Plug, CheckCircle2, AlertCircle, Package } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';

interface ShopifyStore {
  id: string;
  shop_domain: string | null;
  access_token: string | null;
  active: boolean | null;
  merchant_id: string | null;
  installed_at: string | null;
  scope: string | null;
}

export default function Shopify() {
  const { user } = useAuth();
  const [stores, setStores] = useState<ShopifyStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shopDomain, setShopDomain] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const fetchStores = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('shopify_stores')
        .select('*')
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
      // Get merchant
      const { data: merchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', user?.id ?? '')
        .single();

      if (!merchant) {
        toast.error('Merchant account not found');
        return;
      }

      const { error } = await supabase.from('shopify_stores').insert({
        shop_domain: shopDomain.trim(),
        merchant_id: merchant.id,
        active: true,
      });

      if (error) throw error;

      toast.success('Shopify store connected successfully');
      setShopDomain('');
      fetchStores();
    } catch (err: any) {
      toast.error(err.message || 'Failed to connect store');
    } finally {
      setIsConnecting(false);
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
              <p className="text-2xl font-bold">{stores.filter(s => s.active).length}</p>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plug className="h-5 w-5" />
              Connect Shopify Store
            </CardTitle>
            <CardDescription>
              Enter your Shopify store domain to connect it with Everpay for payment processing via Draft Orders.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="shop-domain">Store Domain</Label>
                <Input
                  id="shop-domain"
                  placeholder="your-store.myshopify.com"
                  value={shopDomain}
                  onChange={(e) => setShopDomain(e.target.value)}
                />
              </div>
              <Button onClick={handleConnect} disabled={isConnecting}>
                {isConnecting ? 'Connecting…' : 'Connect Store'}
              </Button>
            </div>
          </CardContent>
        </Card>

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
                      {store.access_token ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Live
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <AlertCircle className="h-3 w-3" /> Simulation
                        </Badge>
                      )}
                      <Badge variant={store.active ? 'default' : 'outline'}>
                        {store.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
                { step: '1', title: 'Connect Store', desc: 'Link your Shopify store domain to Everpay' },
                { step: '2', title: 'Draft Orders', desc: 'Everpay creates Shopify Draft Orders for each checkout' },
                { step: '3', title: 'Payment Processing', desc: 'Customers pay via Everpay\'s hosted checkout' },
                { step: '4', title: 'Order Completion', desc: 'On payment success, the draft order is completed automatically' },
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
