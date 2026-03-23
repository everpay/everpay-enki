import { Link } from 'react-router-dom';
import { Facebook, Twitter, Linkedin, Github } from 'lucide-react';

const footerSections = [
  { title: 'Solutions', links: [
    { to: '/solutions/retail', label: 'Retail' }, { to: '/solutions/restaurant', label: 'Restaurant' },
    { to: '/solutions/ecommerce', label: 'E-commerce' }, { to: '/solutions/mobile-payments', label: 'Mobile Payments' },
    { to: '/solutions/saas-platforms', label: 'SaaS & Platforms' }, { to: '/solutions/marketplaces', label: 'Marketplaces' },
    { to: '/solutions/enterprise', label: 'Enterprise' },
  ]},
  { title: 'Products', links: [
    { to: '/online-payments', label: 'Online Payments' }, { to: '/products/payment-gateway', label: 'Payment Gateway' },
    { to: '/solutions/pos', label: 'POS & Kiosks' }, { to: '/commerce', label: 'Omni-Commerce' },
    { to: '/payments', label: 'Payment Methods' }, { to: '/fraud-prevention', label: 'Fraud Prevention' },
    { to: '/funding', label: 'Funding' }, { to: '/card-issuing', label: 'Card Issuing' },
  ]},
  { title: 'Developers', links: [
    { to: '/developers', label: 'Developer Portal' }, { to: '/developers/api/payments', label: 'API Reference' },
    { to: '/developers/quickstart', label: 'Quick Start' }, { to: '/developers/keys', label: 'API Keys' },
    { to: '/developers/webhooks', label: 'Webhooks' }, { to: '/developers/sdks', label: 'SDKs & Downloads' },
    { to: '/developers/guides', label: 'Integration Guides' },
  ]},
  { title: 'Company', links: [
    { to: '/about', label: 'About Us' }, { to: '/careers', label: 'Careers' },
    { to: '/contact', label: 'Contact Us' }, { to: '/partners', label: 'Partners' },
    { to: '/pricing', label: 'Plans & Pricing' }, { to: '/demo', label: 'Request Demo' },
  ]},
];

const legalLinks = [
  { to: '/privacy-policy', label: 'Privacy Policy' }, { to: '/terms', label: 'Terms of Service' },
  { to: '/cookie-policy', label: 'Cookie Policy' }, { to: '/aml-policy', label: 'AML Policy' },
  { to: '/security', label: 'Security & Trust' },
  { href: 'https://status.everpayinc.com', label: 'System Status' },
];

const securityBadges = [
  { src: '/logos/pci-dss.svg', alt: 'PCI DSS Level 1 Certified', width: 89, height: 34 },
  { src: '/logos/soc-2-certificate.svg', alt: 'SOC 2 Type II Certified', width: 74, height: 32 },
  { src: '/logos/gdpr-compliant.svg', alt: 'GDPR Compliant', width: 110, height: 35 },
  { src: '/logos/iso-27018-certificate.svg', alt: 'ISO 27018 Certified', width: 45, height: 45 },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-bold text-foreground mb-4 font-heading">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-sm text-muted-foreground hover:text-primary transition-colors font-body">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mt-10">
          <div className="flex items-center gap-4">
            {[
              { href: 'https://facebook.com/everpay/', icon: Facebook, label: 'Facebook' },
              { href: 'https://twitter.com/everpay/', icon: Twitter, label: 'Twitter' },
              { href: 'https://linkedin.com/in/everpay/', icon: Linkedin, label: 'LinkedIn' },
              { href: 'https://github.com/everpay/', icon: Github, label: 'GitHub' },
            ].map(({ href, icon: Icon, label }) => (
              <a key={label} href={href} className="hover:scale-110 transition-transform duration-200" aria-label={label}>
                <Icon className="w-5 h-5 text-muted-foreground hover:text-primary" />
              </a>
            ))}
          </div>
          <div className="flex items-center gap-5 flex-wrap">
            {securityBadges.map((badge) => (
              <img key={badge.alt} src={badge.src} alt={badge.alt} width={badge.width} height={badge.height} className="opacity-60 hover:opacity-100 transition-opacity duration-200" loading="lazy" />
            ))}
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <p className="text-xs text-muted-foreground font-body">© {new Date().getFullYear()} Everpay Corporation. All rights reserved.</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {legalLinks.map((link) =>
                'href' in link && link.href ? (
                  <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors font-body">{link.label}</a>
                ) : (
                  <Link key={link.label} to={link.to} className="text-xs text-muted-foreground hover:text-primary transition-colors font-body">{link.label}</Link>
                )
              )}
            </div>
          </div>
          <div className="mt-8 space-y-2">
            <p className="text-xs text-muted-foreground/60 leading-relaxed font-body">
              Everpay Corporation is a financial technology company and not a bank. Banking services are provided by Everpay's bank partners, Members FDIC. The Everpay Visa® Card is issued by Everpay's banking partners pursuant to a license from Visa U.S.A. Inc. and may be used everywhere Visa debit cards are accepted.
            </p>
            <p className="text-xs text-muted-foreground/60 leading-relaxed font-body">
              Everpay is PCI DSS Level 1 certified, the highest level of security certification in the payments industry. All sensitive payment data is encrypted end-to-end and tokenized to ensure it never touches your servers. Our platform is SOC 2 Type II audited and GDPR compliant.
            </p>
            <p className="text-xs text-muted-foreground/60 leading-relaxed font-body">
              Everpay's money transmission and payment processing services are provided in the United States by Everpay Inc., a registered Money Services Business (MSB) with FinCEN. In Canada, services are provided by Everpay Canada Corp., a registered payment service provider. International services are provided by Everpay International Limited, authorized and regulated by applicable financial authorities.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}