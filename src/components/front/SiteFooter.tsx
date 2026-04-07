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
    { to: '/integrations-directory', label: 'Integrations' },
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
            Everpay Corporation is a financial technology company and is not a bank. Banking services are provided by i3 Bank, Member FDIC. The Everpay Corporation Visa Debit Card is issued by i3 Bank pursuant to a license from Visa U.S.A. Inc. and may be used anywhere Visa cards are accepted.
          </p>
          <p className="text-[11px] text-muted-foreground/50 leading-relaxed font-body">
            Deposits may qualify for up to $3,000,000 in FDIC insurance coverage when placed at program banks in the i3 Bank sweep program. Accounts are eligible for pass-through deposit insurance only to the extent pass-through insurance is permitted by the rules and regulations of the FDIC, and if the requirements for pass-through insurance are satisfied. There may be a risk that pass-through deposit insurance is not available because conditions have not been satisfied. In such cases, funds may not be fully insured in the event the insured depository institution where the funds have been deposited were to fail.
          </p>
          <p className="text-[11px] text-muted-foreground/50 leading-relaxed font-body">
            ² Annual Percentage Yield (APY) is variable and is subject to change after account opening. Rate is compounded monthly and credited monthly.
          </p>
          <p className="text-[11px] text-muted-foreground/50 leading-relaxed font-body">
            ³ No account or domestic transaction fees. Some foreign transaction fees may apply in limited circumstances.
          </p>
        </div>
      </div>
    </footer>
  );
}
