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
  { title: 'Resources', links: [
    { to: '/blog', label: 'Blog' }, { to: '/docs', label: 'API Documentation' },
    { to: '/demo', label: 'Request Demo' }, { to: '/contact', label: 'Help & Support' },
    { to: '/pricing', label: 'Plans & Pricing' },
  ]},
  { title: 'Company', links: [
    { to: '/about', label: 'About Us' }, { to: '/careers', label: 'Careers' },
    { to: '/contact', label: 'Contact Us' }, { to: '/partners', label: 'Partners' },
  ]},
];

const legalLinks = [
  { to: '/privacy-policy', label: 'Privacy Policy' }, { to: '/terms', label: 'Terms of Service' },
  { to: '/cookie-policy', label: 'Cookie Policy' }, { to: '/aml-policy', label: 'AML Policy' },
  { to: '/security', label: 'Security & Trust' },
  { href: 'https://status.everpayinc.com', label: 'System Status' },
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
                    <Link to={link.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 mt-10">
          {[
            { href: 'https://facebook.com/everpay/', icon: Facebook, label: 'Facebook' },
            { href: 'https://twitter.com/everpay/', icon: Twitter, label: 'Twitter' },
            { href: 'https://linkedin.com/in/everpay/', icon: Linkedin, label: 'LinkedIn' },
            { href: 'https://github.com/everpay/', icon: Github, label: 'GitHub' },
          ].map(({ href, icon: Icon, label }) => (
            <a key={label} href={href} className="hover:scale-110 transition-transform duration-200" aria-label={label}>
              <Icon className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </a>
          ))}
        </div>

        <div className="mt-10 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <p className="text-xs text-muted-foreground font-body">© {new Date().getFullYear()} Everpay Corporation. All rights reserved.</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {legalLinks.map((link) =>
                'href' in link && link.href ? (
                  <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors font-body">{link.label}</a>
                ) : (
                  <Link key={link.label} to={link.to} className="text-xs text-muted-foreground hover:text-foreground transition-colors font-body">{link.label}</Link>
                )
              )}
            </div>
          </div>
          <div className="mt-8 space-y-2">
            <p className="text-xs text-muted-foreground/60 leading-relaxed font-body">
              Everpay Corporation is a financial technology company and not a bank. Banking services are provided by Everpay's bank partners, Members FDIC.
            </p>
            <p className="text-xs text-muted-foreground/60 leading-relaxed font-body">
              Everpay is PCI DSS Level 1 certified, the highest level of security certification in the payments industry.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
