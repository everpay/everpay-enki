import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ChevronDown, Menu, X, ShoppingBag, UtensilsCrossed, ShoppingCart,
  Smartphone, Laptop, Store, Building2, CreditCard, Plug, Globe,
  Shield, Lock, DollarSign,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [openMobileSection, setOpenMobileSection] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMenuOpen) { document.body.style.overflow = 'hidden'; } else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  const handleMenuEnter = (menu: string) => {
    if (closeTimeoutRef.current) { clearTimeout(closeTimeoutRef.current); closeTimeoutRef.current = null; }
    setActiveMegaMenu(menu);
  };
  const handleMenuLeave = () => { closeTimeoutRef.current = setTimeout(() => setActiveMegaMenu(null), 150); };
  const toggleMobileSection = (section: string) => { setOpenMobileSection(prev => prev === section ? null : section); };

  const solutionItems = [
    { icon: ShoppingBag, label: 'Retail', to: '/solutions/retail' },
    { icon: UtensilsCrossed, label: 'Restaurant', to: '/solutions/restaurant' },
    { icon: ShoppingCart, label: 'E-commerce', to: '/solutions/ecommerce' },
    { icon: Smartphone, label: 'Mobile Payments', to: '/solutions/mobile-payments' },
  ];
  const platformItems = [
    { icon: Laptop, label: 'SaaS & Platforms', to: '/solutions/saas-platforms' },
    { icon: Store, label: 'Marketplaces', to: '/solutions/marketplaces' },
    { icon: Building2, label: 'Enterprise', to: '/solutions/enterprise' },
  ];
  const productItems = [
    { icon: CreditCard, label: 'Online Payments', to: '/online-payments' },
    { icon: Plug, label: 'Payment Gateway', to: '/products/payment-gateway' },
    { icon: Store, label: 'Point of Sale', to: '/solutions/pos' },
    { icon: Shield, label: 'Fraud Prevention', to: '/fraud-prevention' },
    { icon: Lock, label: 'Security', to: '/security' },
    { icon: Globe, label: 'Payment Methods', to: '/payments' },
    { icon: DollarSign, label: 'Funding', to: '/funding' },
    { icon: CreditCard, label: 'Card Issuing', to: '/card-issuing' },
  ];
  const resourceItems = [
    { label: 'Blog', to: '/blog' },
    { label: 'API Documentation', to: '/docs' },
    { label: 'Request Demo', to: '/demo' },
    { label: 'Help & Support', to: '/contact' },
    { label: 'Plans & Pricing', to: '/pricing' },
  ];
  const mobileSections = [
    { title: 'Solutions', key: 'solutions', items: [...solutionItems, ...platformItems] },
    { title: 'Products', key: 'products', items: productItems },
    { title: 'Resources', key: 'resources', items: resourceItems },
  ];

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white'}`}>
      <div className="container mx-auto flex h-[72px] items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/favicon.png" alt="Everpay Logo" className="h-8 w-8 rounded-lg" />
          <span className="text-[22px] font-bold text-foreground tracking-tight font-heading">everpay</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {/* Solutions */}
          <div className="relative" onMouseEnter={() => handleMenuEnter('solutions')} onMouseLeave={handleMenuLeave}>
            <button className="flex items-center gap-1 px-4 py-2 text-[15px] font-medium text-foreground/70 hover:text-foreground rounded-lg hover:bg-secondary transition-colors font-body">
              Solutions
              <ChevronDown className={`h-3.5 w-3.5 opacity-50 transition-transform ${activeMegaMenu === 'solutions' ? 'rotate-180' : ''}`} />
            </button>
            {activeMegaMenu === 'solutions' && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-[520px]">
                <div className="h-2" />
                <div className="bg-card rounded-2xl shadow-xl border border-border p-6">
                  <div className="grid grid-cols-2 gap-1">
                    <p className="col-span-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3 font-body">By Business Type</p>
                    {solutionItems.map((item) => (
                      <Link key={item.label} to={item.to} className="flex items-center gap-3 rounded-xl p-3 text-sm text-foreground/70 hover:bg-secondary hover:text-foreground transition-colors font-body" onClick={() => setActiveMegaMenu(null)}>
                        <item.icon className="h-4 w-4 text-primary" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    ))}
                    <div className="col-span-2 border-t border-border my-2" />
                    <p className="col-span-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3 font-body">By Platform</p>
                    {platformItems.map((item) => (
                      <Link key={item.label} to={item.to} className="flex items-center gap-3 rounded-xl p-3 text-sm text-foreground/70 hover:bg-secondary hover:text-foreground transition-colors font-body" onClick={() => setActiveMegaMenu(null)}>
                        <item.icon className="h-4 w-4 text-primary" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Products */}
          <div className="relative" onMouseEnter={() => handleMenuEnter('products')} onMouseLeave={handleMenuLeave}>
            <button className="flex items-center gap-1 px-4 py-2 text-[15px] font-medium text-foreground/70 hover:text-foreground rounded-lg hover:bg-secondary transition-colors font-body">
              Products
              <ChevronDown className={`h-3.5 w-3.5 opacity-50 transition-transform ${activeMegaMenu === 'products' ? 'rotate-180' : ''}`} />
            </button>
            {activeMegaMenu === 'products' && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-[440px]">
                <div className="h-2" />
                <div className="bg-card rounded-2xl shadow-xl border border-border p-6">
                  <div className="grid grid-cols-2 gap-1">
                    {productItems.map((item) => (
                      <Link key={item.label} to={item.to} className="flex items-center gap-3 rounded-xl p-3 text-sm text-foreground/70 hover:bg-secondary hover:text-foreground transition-colors font-body" onClick={() => setActiveMegaMenu(null)}>
                        <item.icon className="h-4 w-4 text-primary" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Link to="/pricing" className="px-4 py-2 text-[15px] font-medium text-foreground/70 hover:text-foreground rounded-lg hover:bg-secondary transition-colors font-body">Pricing</Link>
          <Link to="/about" className="px-4 py-2 text-[15px] font-medium text-foreground/70 hover:text-foreground rounded-lg hover:bg-secondary transition-colors font-body">About</Link>
          <Link to="/blog" className="px-4 py-2 text-[15px] font-medium text-foreground/70 hover:text-foreground rounded-lg hover:bg-secondary transition-colors font-body">Blog</Link>
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Link to="/docs" className="text-[15px] font-medium text-foreground/60 hover:text-foreground px-4 py-2 transition-colors font-body">Docs</Link>
          <Link to={user ? '/dashboard' : '/auth'} className="text-[15px] font-medium text-foreground/60 hover:text-foreground px-4 py-2 transition-colors font-body">
            {user ? 'Dashboard' : 'Login'}
          </Link>
          <Link to="/demo">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 h-10 text-[15px] font-semibold shadow-none active:scale-[0.97] transition-all">
              Get a free demo
            </Button>
          </Link>
        </div>

        <div className="flex lg:hidden items-center gap-3">
          <Link to="/demo">
            <Button variant="outline" className="rounded-full h-9 px-4 text-sm font-medium border-border active:scale-[0.97] transition-all">
              Book your demo
            </Button>
          </Link>
          <button onClick={() => { setIsMenuOpen(!isMenuOpen); setOpenMobileSection(null); }} aria-label="Toggle menu">
            {isMenuOpen ? <X className="h-6 w-6 text-foreground" /> : <Menu className="h-6 w-6 text-foreground" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[72px] bg-white z-40 overflow-y-auto">
          <nav className="flex flex-col">
            {mobileSections.map((section) => (
              <div key={section.key} className="border-b border-border">
                <button onClick={() => toggleMobileSection(section.key)} className="flex items-center justify-between w-full px-6 py-5 text-left">
                  <span className="text-lg font-semibold text-foreground font-heading">{section.title}</span>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${openMobileSection === section.key ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openMobileSection === section.key ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-6 pb-5 space-y-1">
                    {section.items.map((item) => (
                      <Link key={item.label} to={item.to} className="flex items-center gap-3 py-3 text-[15px] text-foreground/70 hover:text-foreground transition-colors font-body" onClick={() => setIsMenuOpen(false)}>
                        {'icon' in item && (
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary">
                            {(() => { const Icon = (item as any).icon; return <Icon className="h-4 w-4 text-foreground/70" />; })()}
                          </div>
                        )}
                        <span className="font-medium text-foreground">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <Link to="/blog" className="px-6 py-5 text-lg font-semibold text-foreground border-b border-border font-heading" onClick={() => setIsMenuOpen(false)}>Customer stories</Link>
            <Link to="/pricing" className="px-6 py-5 text-lg font-semibold text-foreground border-b border-border font-heading" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
            <div className="px-6 py-6 space-y-3">
              {user ? (
                <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full rounded-full h-12 text-[15px] font-semibold border-border active:scale-[0.97] transition-all">Dashboard</Button>
                </Link>
              ) : (
                <div className="flex gap-3">
                  <Link to="/auth" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full rounded-full h-12 text-[15px] font-semibold border-border active:scale-[0.97] transition-all">Log in</Button>
                  </Link>
                  <Link to="/auth" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-12 text-[15px] font-semibold active:scale-[0.97] transition-all">Sign up</Button>
                  </Link>
                </div>
              )}
              <Link to="/demo" onClick={() => setIsMenuOpen(false)} className="block">
                <Button variant="outline" className="w-full rounded-full h-12 text-[15px] font-semibold border-primary text-primary hover:bg-primary/5 active:scale-[0.97] transition-all">Book your demo</Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
