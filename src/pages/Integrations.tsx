import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Globe, CreditCard, Smartphone, Building2, Landmark, ShieldCheck, Zap, ArrowRight, ExternalLink } from 'lucide-react';
import { getProviderLogo } from '@/lib/payment-method-logos';
import { GatewayCredentialsManager } from '@/components/integrations/GatewayCredentialsManager';
import { GatewayMigrationTool } from '@/components/integrations/GatewayMigrationTool';
import { IntegrationConfigureModal } from '@/components/integrations/IntegrationConfigureModal';
import { integrations as supportedGateways } from '@/data/integrations-directory';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'connected' | 'available' | 'coming_soon';
  regions: string[];
  methods: string[];
  icon: React.ElementType;
  color: string;
  docsUrl?: string;
}

const integrations: Integration[] = [
  {
    id: 'shieldhub', name: 'ShieldHub',
    description: 'Primary global card processor. Optimized for US/MX with 3DS service and PCI-DSS compliance.',
    category: 'payments', status: 'connected', regions: ['US', 'MX', 'Global'], methods: ['Card', 'ACH'],
    icon: ShieldCheck, color: 'hsl(var(--chart-2))',
  },
  {
    id: 'mondo', name: 'Mondo Open Banking',
    description: 'EU/UK payment processing via SEPA, Faster Payments, Open Banking, and card rails.',
    category: 'payments', status: 'connected', regions: ['EU', 'UK'], methods: ['Card', 'SEPA', 'Faster Payments', 'Open Banking'],
    icon: Building2, color: 'hsl(var(--chart-3))',
  },
  {
    id: 'paygate10', name: 'Paygate10',
    description: 'Emerging markets processor for India, Pakistan, LATAM, and Africa. Supports UPI, PIX, SPEI, PSE, JazzCash.',
    category: 'payments', status: 'connected', regions: ['IN', 'PK', 'BR', 'MX', 'CO', 'AR', 'EG'],
    methods: ['UPI', 'PIX', 'SPEI', 'PSE', 'JazzCash', 'EasyPaisa', 'Bank Transfer'],
    icon: Globe, color: 'hsl(25 95% 53%)',
  },
  {
    id: 'ofa', name: 'OFA Pay',
    description: 'Asia-Pacific P2P and P2C payment methods across China, Vietnam, Thailand, Japan, and more.',
    category: 'payments', status: 'connected', regions: ['CN', 'VN', 'TH', 'JP', 'KR', 'ID', 'MY', 'PH', 'HK', 'AU'],
    methods: ['P2P', 'P2C', 'QP', 'CRYPTO', 'Bank Transfer'],
    icon: Globe, color: 'hsl(340 75% 55%)',
  },
  {
    id: 'moneto', name: 'Moneto',
    description: 'Canadian wallet and bank transfer processing for CAD transactions.',
    category: 'payments', status: 'connected', regions: ['CA'], methods: ['Wallet', 'Bank Transfer'],
    icon: Landmark, color: 'hsl(var(--chart-5))',
  },
  {
    id: 'dcbank', name: 'DC Bank',
    description: 'Canadian-only Interac e-Transfer, EFT, and VISA Direct processing.',
    category: 'payments', status: 'available', regions: ['CA'], methods: ['Interac e-Transfer', 'EFT', 'VISA Direct', 'Bill Payment'],
    icon: Landmark, color: 'hsl(210 85% 45%)', docsUrl: 'https://clientdoc.dcbankapi.com/',
  },
  {
    id: 'makapay', name: 'MakaPay',
    description: 'Bangladesh payment gateway supporting SSLCommerz, bKash, Nagad, and SurjoPay mobile wallets.',
    category: 'payments', status: 'connected', regions: ['BD'],
    methods: ['SSLCommerz', 'SurjoPay', 'bKash', 'Nagad'],
    icon: Smartphone, color: 'hsl(160 70% 45%)',
  },
  {
    id: 'lipad', name: 'Lipad.io',
    description: 'Pan-African mobile money and card payments across 11+ countries.',
    category: 'payments', status: 'connected', regions: ['KE', 'TZ', 'UG', 'GH', 'ZA', 'NG', 'RW', 'ET'],
    methods: ['M-Pesa', 'Mobile Money', 'Card', 'Airtel Money'],
    icon: Smartphone, color: 'hsl(35 90% 50%)',
  },
  {
    id: 'payok', name: 'PayOK',
    description: 'Turkish card and bank transfer processing for TRY transactions.',
    category: 'payments', status: 'connected', regions: ['TR'], methods: ['Card', 'Bank Transfer'],
    icon: CreditCard, color: 'hsl(200 80% 50%)',
  },
  {
    id: 'matrix', name: 'Matrix Pay Solution',
    description: 'Gaming, Casino & Lottery card processing. Supports EUR/USD. Not available for US-based customers.',
    category: 'payments', status: 'available', regions: ['EU', 'Global (excl. US)'],
    methods: ['Card', 'Checkout HPP', 'Crypto'],
    icon: Zap, color: 'hsl(270 70% 55%)', docsUrl: 'https://docs.matrixpaysolution.com/',
  },
  {
    id: 'prometeo', name: 'Prometeo',
    description: 'Open finance and bank redirect payments across Latin America.',
    category: 'payments', status: 'connected', regions: ['MX', 'CO', 'BR', 'CL', 'PE', 'UY'],
    methods: ['Bank Redirect', 'SPEI', 'PSE', 'Open Finance'],
    icon: Building2, color: 'hsl(155 65% 42%)',
  },
  // E-Commerce plugins
  {
    id: 'shopify', name: 'Shopify',
    description: 'Accept payments in your Shopify store with automatic order sync and fulfillment tracking.',
    category: 'ecommerce', status: 'connected', regions: ['Global'], methods: ['Card', 'All supported methods'],
    icon: Globe, color: 'hsl(120 60% 40%)',
  },
  {
    id: 'bigcommerce', name: 'BigCommerce',
    description: 'Embed Everpay checkout in BigCommerce stores with product sync and webhook support.',
    category: 'ecommerce', status: 'connected', regions: ['Global'], methods: ['Card', 'All supported methods'],
    icon: Globe, color: 'hsl(220 70% 50%)',
  },
  // Fraud & Risk
  {
    id: 'chargeflow', name: 'Chargeflow',
    description: 'Automated chargeback management and dispute resolution with AI-powered evidence.',
    category: 'risk', status: 'connected', regions: ['Global'], methods: [],
    icon: ShieldCheck, color: 'hsl(0 72% 50%)',
  },
  {
    id: 'tapix', name: 'Tapix Enrichment',
    description: 'Transaction enrichment with merchant logos, clean names, and category mapping.',
    category: 'risk', status: 'connected', regions: ['Global'], methods: [],
    icon: Zap, color: 'hsl(45 90% 50%)',
  },
];

const categories = [
  { id: 'all', label: 'All Integrations' },
  { id: 'payments', label: 'Payments' },
  { id: 'ecommerce', label: 'E-Commerce' },
  { id: 'risk', label: 'Risk & Fraud' },
  { id: 'supported', label: 'Supported Gateways (130+)' },
];

export default function Integrations() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [configModal, setConfigModal] = useState<{ open: boolean; id: string; name: string; connected: boolean }>({ open: false, id: '', name: '', connected: false });
  const { user } = useAuth();

  const { data: merchant } = useQuery({
    queryKey: ['merchant-for-integrations', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from('merchants').select('id').eq('user_id', user.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Filter supported gateways from directory
  const supportedGatewayItems = supportedGateways.filter(g => g.category === 'supported');

  const filtered = activeCategory === 'supported'
    ? supportedGatewayItems.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase()))
    : integrations.filter(i => {
        const matchesSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = activeCategory === 'all' || i.category === activeCategory;
        return matchesSearch && matchesCategory;
      });

  const connectedCount = integrations.filter(i => i.status === 'connected').length;

  const openConfig = (id: string, name: string, connected: boolean) => {
    setConfigModal({ open: true, id, name, connected });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Gateway Credentials & Migration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GatewayCredentialsManager merchantId={merchant?.id} />
          <GatewayMigrationTool merchantId={merchant?.id} />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-[Sora]">Integrations & Providers</h1>
            <p className="text-muted-foreground mt-1">
              {connectedCount} of {integrations.length} direct integrations connected &middot; 130+ supported gateways via Active Merchant
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search integrations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList>
            {categories.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id}>{cat.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Grid — Direct Integrations */}
        {activeCategory !== 'supported' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(filtered as Integration[]).map(integration => (
              <Card key={integration.id} className="relative overflow-hidden hover:shadow-md transition-shadow border-border">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const provLogo = getProviderLogo(integration.id);
                        return provLogo ? (
                          <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-background border border-border p-1">
                            <img src={provLogo} alt={integration.name} className="h-7 w-7 object-contain" loading="lazy" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${integration.color}20` }}>
                            <integration.icon className="h-5 w-5" style={{ color: integration.color }} />
                          </div>
                        );
                      })()}
                      <div><h3 className="font-semibold text-foreground">{integration.name}</h3></div>
                    </div>
                    <Badge
                      variant={integration.status === 'connected' ? 'default' : integration.status === 'available' ? 'outline' : 'secondary'}
                      className={integration.status === 'connected' ? 'bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]' : ''}
                    >
                      {integration.status === 'connected' ? 'Connected' : integration.status === 'available' ? 'Available' : 'Coming Soon'}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">{integration.description}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {integration.regions.slice(0, 5).map(r => (
                      <Badge key={r} variant="secondary" className="text-[10px] px-1.5 py-0">{r}</Badge>
                    ))}
                    {integration.regions.length > 5 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">+{integration.regions.length - 5}</Badge>
                    )}
                  </div>

                  {integration.methods.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {integration.methods.slice(0, 4).map(m => (
                        <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground">{m}</span>
                      ))}
                      {integration.methods.length > 4 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground">+{integration.methods.length - 4}</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    {integration.status === 'available' ? (
                      <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => openConfig(integration.id, integration.name, false)}>
                        Connect <ArrowRight className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="text-xs gap-1.5" onClick={() => openConfig(integration.id, integration.name, true)}>
                        Configure <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}
                    {integration.docsUrl && (
                      <Button size="sm" variant="ghost" className="text-xs gap-1.5" asChild>
                        <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer">
                          Docs <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Grid — 130+ Supported Gateways */}
        {activeCategory === 'supported' && (
          <>
            <p className="text-sm text-muted-foreground">
              Route payments to any of 130+ processors worldwide via the Active Merchant compatibility layer. Click "Connect" to add your credentials.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(filtered as typeof supportedGatewayItems).map(gw => (
                <Card key={gw.name} className="hover:shadow-md transition-shadow border-border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-lg">
                          {gw.icon === '💳' ? <CreditCard className="h-4 w-4 text-muted-foreground" /> : <span>{gw.icon}</span>}
                        </div>
                        <h3 className="font-semibold text-sm text-foreground">{gw.name}</h3>
                      </div>
                      <Badge variant="outline" className="text-[10px]">Active Merchant</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{gw.description}</p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1.5"
                        onClick={() => openConfig(gw.name.toLowerCase().replace(/[\s.'-]+/g, '_'), gw.name, false)}
                      >
                        Connect <ArrowRight className="h-3 w-3" />
                      </Button>
                      {gw.learnMore && (
                        <Button size="sm" variant="ghost" className="text-xs gap-1.5" asChild>
                          <a href={gw.learnMore} target="_blank" rel="noopener noreferrer">
                            Learn More <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Globe className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No integrations found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        )}

        {/* Configure Modal */}
        <IntegrationConfigureModal
          open={configModal.open}
          onOpenChange={(o) => setConfigModal(prev => ({ ...prev, open: o }))}
          integrationId={configModal.id}
          integrationName={configModal.name}
          merchantId={merchant?.id}
          isConnected={configModal.connected}
        />
      </div>
    </AppLayout>
  );
}
