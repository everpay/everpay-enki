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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  const handleMenuEnter = (menu: string) => {
    if (closeTimeoutRef.current) { clearTimeout(closeTimeoutRef.current); closeTimeoutRef.current = null; }
    setActiveMegaMenu(menu);
  };

  const handleMenuLeave = () => {
    closeTimeoutRef.current = setTimeout(() => setActiveMegaMenu(null), 150);
  };

  const toggleMobileSection = (section: string) => {
    setOpenMobileSection(prev => prev === section ? null : section);
  };

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
    {
      title: 'Solutions',
      key: 'solutions',
      items: [...solutionItems, ...platformItems],
    },
    {
      title: 'Products',
      key: 'products',
      items: productItems,
    },
    {
      title: 'Resources',
      key: 'resources',
      items: resourceItems,
    },
  ];

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white'}`}>
      <div className="container mx-auto flex h-[72px] items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/favicon.png" alt="Everpay Logo" className="h-8 w-8 rounded-lg" />
          <span className="text-[22px] font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>everpay</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {/* Solutions */}
          <div className="relative" onMouseEnter={() => handleMenuEnter('solutions')} onMouseLeave={handleMenuLeave}>
            <button className="flex items-center gap-1 px-4 py-2 text-[15px] font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors">
              Solutions
              <ChevronDown className={`h-3.5 w-3.5 opacity-50 transition-transform ${activeMegaMenu === 'solutions' ? 'rotate-180' : ''}`} />
            </button>
            {activeMegaMenu === 'solutions' && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-[520px]">
                <div className="h-2" />
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                  <div className="grid grid-cols-2 gap-1">
                    <p className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">By Business Type</p>
                    {solutionItems.map((item) => (
                      <Link key={item.label} to={item.to} className="flex items-center gap-3 rounded-xl p-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => setActiveMegaMenu(null)}>
                        <item.icon className="h-4 w-4 text-[#1aa478]" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    ))}
                    <div className="col-span-2 border-t border-gray-100 my-2" />
                    <p className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">By Platform</p>
                    {platformItems.map((item) => (
                      <Link key={item.label} to={item.to} className="flex items-center gap-3 rounded-xl p-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => setActiveMegaMenu(null)}>
                        <item.icon className="h-4 w-4 text-[#1aa478]" />
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
            <button className="flex items-center gap-1 px-4 py-2 text-[15px] font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors">
              Products
              <ChevronDown className={`h-3.5 w-3.5 opacity-50 transition-transform ${activeMegaMenu === 'products' ? 'rotate-180' : ''}`} />
            </button>
            {activeMegaMenu === 'products' && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-[440px]">
                <div className="h-2" />
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                  <div className="grid grid-cols-2 gap-1">
                    {productItems.map((item) => (
                      <Link key={item.label} to={item.to} className="flex items-center gap-3 rounded-xl p-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={() => setActiveMegaMenu(null)}>
                        <item.icon className="h-4 w-4 text-[#1aa478]" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Link to="/pricing" className="px-4 py-2 text-[15px] font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors">Pricing</Link>
          <Link to="/about" className="px-4 py-2 text-[15px] font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors">About</Link>
          <Link to="/blog" className="px-4 py-2 text-[15px] font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors">Blog</Link>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <Link to="/docs" className="text-[15px] font-medium text-gray-600 hover:text-gray-900 px-4 py-2 transition-colors">Docs</Link>
          <Link to={user ? '/dashboard' : '/auth'} className="text-[15px] font-medium text-gray-600 hover:text-gray-900 px-4 py-2 transition-colors">
            {user ? 'Dashboard' : 'Login'}
          </Link>
          <Link to="/demo">
            <Button className="bg-[#1aa478] hover:bg-[#158f68] text-white rounded-full px-6 h-10 text-[15px] font-semibold shadow-none">
              Get a free demo
            </Button>
          </Link>
        </div>

        {/* Mobile: Book demo + hamburger */}
        <div className="flex lg:hidden items-center gap-3">
          <Link to="/demo">
            <Button variant="outline" className="rounded-full h-9 px-4 text-sm font-medium border-gray-300">
              Book your demo
            </Button>
          </Link>
          <button onClick={() => { setIsMenuOpen(!isMenuOpen); setOpenMobileSection(null); }} aria-label="Toggle menu">
            {isMenuOpen ? <X className="h-6 w-6 text-gray-900" /> : <Menu className="h-6 w-6 text-gray-900" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation — Recurly-style accordion */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[72px] bg-white z-40 overflow-y-auto">
          <nav className="flex flex-col">
            {/* Accordion sections */}
            {mobileSections.map((section) => (
              <div key={section.key} className="border-b border-gray-100">
                <button
                  onClick={() => toggleMobileSection(section.key)}
                  className="flex items-center justify-between w-full px-6 py-5 text-left"
                >
                  <span className="text-lg font-semibold text-gray-900">{section.title}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                      openMobileSection === section.key ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Expanded content */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openMobileSection === section.key ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 pb-5 space-y-1">
                    {section.key === 'products' && (
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">PRODUCTS</p>
                    )}
                    {section.items.map((item) => (
                      <Link
                        key={item.label}
                        to={item.to}
                        className="flex items-center gap-3 py-3 text-[15px] text-gray-600 hover:text-gray-900 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {'icon' in item && (
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-50">
                            {(() => { const Icon = (item as any).icon; return <Icon className="h-4 w-4 text-gray-700" />; })()}
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-900">{item.label}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Direct links */}
            <Link to="/blog" className="px-6 py-5 text-lg font-semibold text-gray-900 border-b border-gray-100" onClick={() => setIsMenuOpen(false)}>
              Customer stories
            </Link>
            <Link to="/pricing" className="px-6 py-5 text-lg font-semibold text-gray-900 border-b border-gray-100" onClick={() => setIsMenuOpen(false)}>
              Pricing
            </Link>

            {/* CTA */}
            <div className="px-6 py-6">
              <Link to="/demo" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full bg-[#1aa478] hover:bg-[#158f68] text-white rounded-full h-12 text-[15px] font-semibold">
                  Book your demo
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
