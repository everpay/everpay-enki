import { Link } from 'react-router-dom';

const footerSections = [
  { title: 'Products and pricing', links: [
    { to: '/pricing', label: 'Pricing' },
    { to: '/online-payments', label: 'Online Payments' },
    { to: '/products/payment-gateway', label: 'Payment Gateway' },
    { to: '/payments', label: 'Payment Methods' },
    { to: '/card-issuing', label: 'Card Issuing' },
    { to: '/solutions/pos', label: 'Terminal & POS' },
    { to: '/commerce', label: 'Omni-Commerce' },
    { to: '/fraud-prevention', label: 'Fraud Prevention' },
    { to: '/funding', label: 'Capital & Funding' },
  ]},
  { title: 'Solutions', links: [
    { to: '/solutions/enterprise', label: 'Enterprises' },
    { to: '/solutions/ecommerce', label: 'Ecommerce' },
    { to: '/solutions/saas-platforms', label: 'SaaS & Platforms' },
    { to: '/solutions/marketplaces', label: 'Marketplaces' },
    { to: '/solutions/retail', label: 'Retail' },
    { to: '/solutions/restaurant', label: 'Restaurant' },
    { to: '/solutions/mobile-payments', label: 'Mobile Payments' },
  ]},
  { title: 'Developers', links: [
    { to: '/developers', label: 'Documentation' },
    { to: '/developers/api/payments', label: 'API Reference' },
    { to: '/developers/quickstart', label: 'Quick Start' },
    { to: '/developers/sdks', label: 'Libraries & SDKs' },
    { to: '/developers/webhooks', label: 'Webhooks' },
    { to: '/developers/guides', label: 'Integration Guides' },
  ]},
  { title: 'Resources', links: [
    { to: '/blog', label: 'Blog' },
    { to: '/partners', label: 'Partner Ecosystem' },
    { to: '/privacy-policy', label: 'Privacy & Terms' },
    { to: '/security', label: 'Security' },
    { to: '/cookie-policy', label: 'Cookie Settings' },
    { href: 'https://status.everpayinc.com', label: 'System Status' },
  ]},
  { title: 'Company', links: [
    { to: '/about', label: 'About Us' },
    { to: '/careers', label: 'Careers' },
    { to: '/contact', label: 'Contact Sales' },
    { to: '/demo', label: 'Request Demo' },
  ]},
];

const securityBadges = [
  { src: '/logos/pci-dss.svg', alt: 'PCI DSS Level 1 Certified', width: 89, height: 34 },
  { src: '/logos/soc-2-certificate.svg', alt: 'SOC 2 Type II Certified', width: 74, height: 32 },
  { src: '/logos/gdpr-compliant.svg', alt: 'GDPR Compliant', width: 110, height: 35 },
  { src: '/logos/iso-27018-certificate.svg', alt: 'ISO 27018 Certified', width: 45, height: 45 },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-white">
      {/* Ready to get started? CTA */}
      <div className="container mx-auto px-6 py-16 border-b border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-3 font-heading">Ready to get started?</h2>
            <p className="text-sm text-muted-foreground mb-5 font-body leading-relaxed">
              Create an account instantly, or contact us to design a custom package for your business.
            </p>
            <div className="flex items-center gap-3">
              <Link to="/demo">
                <Button size="sm" className="bg-primary hover:bg-primary/85 text-primary-foreground rounded-full px-5 h-9 text-sm font-semibold active:scale-[0.97] transition-all">
                  Start now <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="sm" variant="outline" className="rounded-full px-5 h-9 text-sm font-semibold border-border hover:bg-secondary/50 active:scale-[0.97] transition-all">
                  Contact sales
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground mb-1 font-heading">See what you'll pay</h3>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">Integrated per-transaction pricing with no hidden fees.</p>
              <Link to="/pricing" className="text-sm text-primary hover:text-primary/80 font-semibold mt-1 inline-block font-body">
                Pricing details →
              </Link>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground mb-1 font-heading">Start building</h3>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">Get up and running with Everpay in as little as 10 minutes.</p>
              <Link to="/developers" className="text-sm text-primary hover:text-primary/80 font-semibold mt-1 inline-block font-body">
                Integration options →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer links grid */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-10">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-bold text-foreground mb-4 font-heading">{section.title}</h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {'href' in link && link.href ? (
                      <a href={(link as any).href} target="_blank" rel="noopener noreferrer" className="text-[13px] text-muted-foreground hover:text-primary transition-colors font-body">{link.label}</a>
                    ) : (
                      <Link to={link.to!} className="text-[13px] text-muted-foreground hover:text-primary transition-colors font-body">{link.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Security badges */}
        <div className="flex items-center gap-5 flex-wrap mt-10 pt-8 border-t border-border">
          {securityBadges.map((badge) => (
            <img key={badge.alt} src={badge.src} alt={badge.alt} width={badge.width} height={badge.height} className="opacity-50 hover:opacity-100 transition-opacity duration-200" loading="lazy" />
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-body">🌐 United States (English)</span>
          </div>
          <p className="text-xs text-muted-foreground font-body">© {new Date().getFullYear()} Everpay Corporation. All rights reserved.</p>
        </div>

        {/* Legal disclaimers */}
        <div className="mt-6 space-y-2">
          <p className="text-[11px] text-muted-foreground/50 leading-relaxed font-body">
            Everpay Corporation is a financial technology company and not a bank. Banking services are provided by Everpay's bank partners, Members FDIC. The Everpay Visa® Card is issued by Everpay's banking partners pursuant to a license from Visa U.S.A. Inc. and may be used everywhere Visa debit cards are accepted.
          </p>
          <p className="text-[11px] text-muted-foreground/50 leading-relaxed font-body">
            Everpay is PCI DSS Level 1 certified. All sensitive payment data is encrypted end-to-end and tokenized. Our platform is SOC 2 Type II audited and GDPR compliant.
          </p>
        </div>
      </div>
    </footer>
  );
}
