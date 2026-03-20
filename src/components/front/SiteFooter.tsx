import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Facebook, Twitter, Linkedin, Github } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 relative bg-no-repeat bg-center" style={{ backgroundImage: 'url(/footer-bg.png)', backgroundSize: 'contain', backgroundPosition: 'center bottom' }}>
      <div className="absolute inset-0 bg-gray-50/80" />
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          <div />
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Solutions</h3>
            <ul className="space-y-3">
              {[
                { to: '/solutions/retail', label: 'Retail' },
                { to: '/solutions/restaurant', label: 'Restaurant' },
                { to: '/solutions/ecommerce', label: 'E-commerce' },
                { to: '/solutions/mobile-payments', label: 'Mobile Payments' },
                { to: '/solutions/saas-platforms', label: 'SaaS & Platforms' },
                { to: '/solutions/marketplaces', label: 'Marketplaces' },
                { to: '/solutions/enterprise', label: 'Enterprise' },
              ].map((item) => (
                <li key={item.to}><Link to={item.to} className="text-sm text-gray-600 hover:text-[#1aa478] transition-colors">{item.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Products</h3>
            <ul className="space-y-3">
              {[
                { to: '/online-payments', label: 'Online Payments' },
                { to: '/products/payment-gateway', label: 'Payment Gateway' },
                { to: '/solutions/pos', label: 'POS & Kiosks' },
                { to: '/commerce', label: 'Omni-Commerce' },
                { to: '/payments', label: 'Payment Methods' },
                { to: '/fraud-prevention', label: 'Fraud Prevention' },
                { to: '/funding', label: 'Funding' },
                { to: '/card-issuing', label: 'Card Issuing' },
              ].map((item) => (
                <li key={item.to}><Link to={item.to} className="text-sm text-gray-600 hover:text-[#1aa478] transition-colors">{item.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Resources</h3>
            <ul className="space-y-3">
              {[
                { to: '/blog', label: 'Blog' },
                { to: '/docs', label: 'API Documentation' },
                { to: '/demo', label: 'Request Demo' },
                { to: '/contact', label: 'Help & Support' },
                { to: '/pricing', label: 'Plans & Pricing' },
              ].map((item) => (
                <li key={item.to}><Link to={item.to} className="text-sm text-gray-600 hover:text-[#1aa478] transition-colors">{item.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Company</h3>
            <ul className="space-y-3">
              {[
                { to: '/about', label: 'About Us' },
                { to: '/careers', label: 'Careers' },
                { to: '/contact', label: 'Contact Us' },
                { to: '/partners', label: 'Partners' },
              ].map((item) => (
                <li key={item.to}><Link to={item.to} className="text-sm text-gray-600 hover:text-[#1aa478] transition-colors">{item.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Stay Updated</h3>
            <p className="text-sm text-gray-600 mb-4">Subscribe to our newsletter for the latest updates.</p>
            <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
              <Input type="email" placeholder="Enter your email" className="rounded-full" />
              <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full">Subscribe</Button>
            </form>
            <div className="flex items-center gap-4 mt-4">
              <a href="https://facebook.com/everpay/" className="hover:scale-110 transition-transform duration-200"><Facebook className="w-5 h-5 text-gray-400 hover:text-gray-600" /></a>
              <a href="https://twitter.com/everpay/" className="hover:scale-110 transition-transform duration-200"><Twitter className="w-5 h-5 text-gray-400 hover:text-gray-600" /></a>
              <a href="https://linkedin.com/in/everpay/" className="hover:scale-110 transition-transform duration-200"><Linkedin className="w-5 h-5 text-gray-400 hover:text-gray-600" /></a>
              <a href="https://github.com/everpay/" className="hover:scale-110 transition-transform duration-200"><Github className="w-5 h-5 text-gray-400 hover:text-gray-600" /></a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-xs text-gray-600">© {new Date().getFullYear()} Everpay Corporation. All rights reserved.</p>
            <div className="flex flex-wrap gap-6">
              <Link to="/privacy-policy" className="text-xs text-gray-600 hover:text-[#1aa478] transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-xs text-gray-600 hover:text-[#1aa478] transition-colors">Terms of Service</Link>
              <Link to="/cookie-policy" className="text-xs text-gray-600 hover:text-[#1aa478] transition-colors">Cookie Policy</Link>
              <Link to="/aml-policy" className="text-xs text-gray-600 hover:text-[#1aa478] transition-colors">AML Policy</Link>
              <Link to="/security" className="text-xs text-gray-600 hover:text-[#1aa478] transition-colors">Security & Trust</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
