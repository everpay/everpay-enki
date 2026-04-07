import { SiteHeader } from "@/components/front/SiteHeader";
import { SiteFooter } from "@/components/front/SiteFooter";
import { CTASection } from "@/components/front/CtaSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, ArrowRight, ExternalLink, Globe, CreditCard, Landmark,
  ShieldCheck, ShoppingCart, Smartphone, Building2, Code2, Zap,
} from "lucide-react";

const CATEGORIES = [
  { key: "all", label: "All Categories" },
  { key: "accounting", label: "Accounting & ERP" },
  { key: "ecommerce", label: "E-commerce & Marketplaces" },
  { key: "gateways", label: "Payment Gateways" },
  { key: "crm", label: "CRM & Sales Platforms" },
  { key: "banking", label: "Banking & Treasury" },
  { key: "fraud", label: "Fraud & Risk" },
  { key: "developer", label: "Developer Tools" },
];

interface IntegrationItem {
  name: string;
  description: string;
  category: string;
  icon: string;
  learnMore?: string;
}

const integrations: IntegrationItem[] = [
  // Accounting & ERP
  { name: "QuickBooks", description: "Simplify financial reporting and automate reconciliation with seamless ERP integrations.", category: "accounting", icon: "/logos/integrations/quickbooks.png" },
  { name: "Xero", description: "Cloud-based financial tracking for growing businesses.", category: "accounting", icon: "/logos/integrations/xero.png" },
  { name: "SAP", description: "Enterprise-scale financial management and reporting.", category: "accounting", icon: "/logos/integrations/sap.png" },
  { name: "NetSuite", description: "Connect ERP to your payment gateway for real-time insights.", category: "accounting", icon: "/logos/integrations/netsuite.png" },
  // E-commerce
  { name: "Shopify", description: "Powerful e-commerce platform with seamless payment integration.", category: "ecommerce", icon: "/logos/integrations/shopify.png" },
  { name: "WooCommerce", description: "Flexible payment solutions for your online store.", category: "ecommerce", icon: "/logos/integrations/woocommerce.png" },
  { name: "BigCommerce", description: "Enterprise e-commerce with advanced checkout experiences.", category: "ecommerce", icon: "/logos/integrations/bigcommerce.png" },
  { name: "Magento", description: "Open-source e-commerce with customizable payment flows.", category: "ecommerce", icon: "/logos/integrations/magento.png" },
  // Payment Gateways
  { name: "Mondo", description: "EU & UK card processing with multi-currency support.", category: "gateways", icon: "/logos/integrations/mondo.png" },
  { name: "ShieldHub", description: "US & Global acquiring with advanced tokenization.", category: "gateways", icon: "/logos/integrations/shieldhub.png" },
  { name: "Paygate10", description: "Emerging market coverage — India, Mexico, Pakistan, Brazil, Colombia.", category: "gateways", icon: "/logos/integrations/paygate10.png" },
  { name: "Matrix Partners", description: "Gaming, casino & lottery processing — EUR/USD. Not available in the US.", category: "gateways", icon: "/logos/integrations/matrix.png" },
  { name: "DC Bank", description: "Canadian-only processing for domestic transactions.", category: "gateways", icon: "/logos/integrations/dcbank.png" },
  { name: "OFA Pay", description: "Asia-Pacific coverage with local payment methods.", category: "gateways", icon: "/logos/integrations/ofa.png" },
  { name: "Moneto", description: "Canadian digital wallet and payment solutions.", category: "gateways", icon: "/logos/integrations/moneto.png" },
  { name: "Makapay", description: "Bangladesh market with mobile money support.", category: "gateways", icon: "/logos/integrations/makapay.png" },
  { name: "Lipad.io", description: "African payment coverage — Kenya, Nigeria, South Africa.", category: "gateways", icon: "/logos/integrations/lipad.png" },
  { name: "PayOK", description: "Alternative payment methods for global coverage.", category: "gateways", icon: "/logos/integrations/payok.png" },
  { name: "PacoPay", description: "LATAM & emerging markets card processing.", category: "gateways", icon: "/logos/integrations/pacopay.png" },
  // CRM
  { name: "HubSpot", description: "Automate payment workflows to accelerate your sales pipeline.", category: "crm", icon: "/logos/integrations/hubspot.png" },
  { name: "Salesforce", description: "Integrate payments in enterprise sales and service workflows.", category: "crm", icon: "/logos/integrations/salesforce.png" },
  { name: "Pipedrive", description: "Payment tracking directly within your CRM deals.", category: "crm", icon: "/logos/integrations/pipedrive.png" },
  // Banking & Treasury
  { name: "Plaid", description: "Secure bank account linking and financial data access.", category: "banking", icon: "/logos/integrations/plaid.png" },
  { name: "Wise", description: "Low-cost international payments with real FX rates.", category: "banking", icon: "/logos/integrations/wise.png" },
  { name: "Open Banking APIs", description: "Direct bank-to-bank transactions via open banking standards.", category: "banking", icon: "/logos/integrations/openbanking.png" },
  { name: "Prometeo", description: "Latin American open banking and account connectivity.", category: "banking", icon: "/logos/integrations/prometeo.png" },
  // Fraud & Risk
  { name: "Chargeflow", description: "Automated chargeback management and dispute resolution.", category: "fraud", icon: "/logos/integrations/chargeflow.png" },
  { name: "Tapix", description: "Transaction enrichment and merchant intelligence.", category: "fraud", icon: "/logos/integrations/tapix.png" },
  { name: "3D Secure 2.0", description: "Strong customer authentication for card-not-present transactions.", category: "fraud", icon: "/logos/integrations/3dsecure.png" },
  // Developer Tools
  { name: "REST API v2", description: "Full-featured payment API with idempotency and rate limiting.", category: "developer", icon: "⚡" },
  { name: "Webhooks", description: "Real-time event notifications for payment lifecycle events.", category: "developer", icon: "🔔" },
  { name: "SDKs", description: "Client libraries for Node.js, Python, PHP, and more.", category: "developer", icon: "📦" },
];

export default function FrontIntegrations() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = integrations.filter((item) => {
    if (activeCategory !== "all" && item.category !== activeCategory) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase()) && !item.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const grouped = CATEGORIES.filter((c) => c.key !== "all").reduce((acc, cat) => {
    const items = filtered.filter((i) => i.category === cat.key);
    if (items.length > 0) acc.push({ ...cat, items });
    return acc;
  }, [] as { key: string; label: string; items: IntegrationItem[] }[]);

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-foreground text-white">
        <div className="container mx-auto px-6 py-20 lg:py-28">
          <div className="max-w-3xl">
            <Badge className="bg-primary/20 text-primary border-primary/30 mb-6 font-body">INTEGRATIONS</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-[56px] font-bold leading-[1.08] tracking-tight font-heading mb-6">
              Powerful Integrations
              <br />to Supercharge Your
              <br />Financial Operations
            </h1>
            <p className="text-lg text-white/70 font-body max-w-xl mb-8 leading-relaxed">
              Connect Everpay with your leading corporate software, e-commerce, and CRM platforms to simplify financial management and payments.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/developers">
                <Button className="bg-primary hover:bg-primary/85 text-primary-foreground rounded-full px-8 h-12 text-[15px] font-semibold active:scale-[0.97] transition-all font-body">
                  Learn More <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/developers/api/payments">
                <Button variant="outline" className="rounded-full px-8 h-12 text-[15px] font-semibold border-white/30 text-white bg-white/10 hover:bg-white/20 active:scale-[0.97] transition-all font-body">
                  View docs <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-6 mt-10">
              <span className="text-xs text-white/40 font-body">Partnered & Trusted by:</span>
              <div className="flex items-center gap-5 text-white/50 text-sm font-medium font-body">
                <span>Shopify</span>
                <span>BigCommerce</span>
                <span>QuickBooks</span>
                <span className="hidden sm:inline">Salesforce</span>
              </div>
            </div>
          </div>
        </div>

        {/* Code snippet decoration */}
        <div className="absolute right-8 top-20 hidden xl:block w-[380px]">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-5 font-mono text-xs text-white/60 leading-relaxed shadow-2xl">
            <div className="flex items-center gap-1.5 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
            </div>
            <p className="text-white/40">// The Everpay Payments API</p>
            <p><span className="text-primary">POST</span> /v2/payments</p>
            <p className="mt-2 text-white/40">Authorization: Bearer sk_live_...</p>
            <p>Content-Type: <span className="text-primary">application/json</span></p>
            <p className="mt-2">{"{"}</p>
            <p className="pl-4">"amount": <span className="text-primary">5000</span>,</p>
            <p className="pl-4">"currency": <span className="text-primary">"usd"</span>,</p>
            <p className="pl-4">"method": <span className="text-primary">"card"</span>,</p>
            <p className="pl-4">"description": <span className="text-primary">"Order #1234"</span></p>
            <p>{"}"}</p>
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-6">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-4 font-body">PLATFORMS</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-heading mb-3">
            Seamless Connections with Leading Platforms
          </h2>
          <p className="text-muted-foreground font-body max-w-2xl mb-10">
            Discover how the top services and platforms leverage Everpay to optimize payments, prevent fraud, and scale globally.
          </p>

          {/* Sidebar categories + grid */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Category sidebar */}
            <div className="lg:w-56 shrink-0">
              <div className="sticky top-24 space-y-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors font-body ${
                      activeCategory === cat.key
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground/60 hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Integration grid */}
            <div className="flex-1">
              {/* Search */}
              <div className="relative mb-8 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search integrations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 rounded-xl border-border h-11 font-body"
                />
              </div>

              {grouped.map((group) => (
                <div key={group.key} className="mb-12">
                  <h3 className="text-xl font-bold tracking-tight font-heading mb-2">{group.label}</h3>
                  <p className="text-sm text-muted-foreground font-body mb-6">
                    {group.key === "accounting" && "Simplify financial reporting and automate reconciliation with seamless ERP integrations."}
                    {group.key === "ecommerce" && "Enhance checkout experiences and streamline payment processing for your online store."}
                    {group.key === "gateways" && "Connect to multiple payment processors and acquirers via our multi-PSP architecture."}
                    {group.key === "crm" && "Track revenue, manage customer payments, and automate billing from your sales tools."}
                    {group.key === "banking" && "Connect directly to bank accounts for real-time cash flow visibility and payments."}
                    {group.key === "fraud" && "Protect transactions with intelligent fraud detection and dispute management."}
                    {group.key === "developer" && "Build, test, and deploy custom payment integrations with our developer toolkit."}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.items.map((item) => (
                      <div
                        key={item.name}
                        className="group border border-border rounded-2xl p-5 hover:shadow-md hover:border-primary/20 transition-all bg-card"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          {item.icon.startsWith('/') ? (
                            <img src={item.icon} alt={item.name} className="w-10 h-10 rounded-lg object-contain" loading="lazy" />
                          ) : (
                            <span className="text-2xl w-10 h-10 flex items-center justify-center">{item.icon}</span>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground font-heading text-[15px]">{item.name}</h4>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground font-body leading-relaxed mb-4">{item.description}</p>
                        <Link
                          to="/developers"
                          className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors font-body gap-1"
                        >
                          Learn More <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-muted-foreground font-body">No integrations found matching your search.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Developer Tools highlight */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-4 font-body">DEVELOPERS</Badge>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-heading mb-4">
                Seamless Integration with Powerful Developer Tools
              </h2>
              <p className="text-muted-foreground font-body leading-relaxed mb-8">
                Integrate Everpay's full-featured API to revolutionize the way you accept, process, and settle payments.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "RESTful APIs & Webhooks",
                  "SDKs for Multiple Languages",
                  "Sandbox for Testing",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-body text-foreground">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Zap className="h-3 w-3 text-primary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/developers">
                <Button className="bg-primary hover:bg-primary/85 text-primary-foreground rounded-full px-8 h-11 text-[15px] font-semibold active:scale-[0.97] transition-all font-body">
                  Explore Developer Portal <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Code block */}
            <div className="bg-foreground rounded-2xl p-6 font-mono text-sm text-white/70 leading-relaxed shadow-xl">
              <div className="flex items-center gap-1.5 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
              </div>
              <p className="text-white/40">// Install the Everpay SDK</p>
              <p><span className="text-primary">npm install</span> @everpay/sdk</p>
              <p className="mt-3 text-white/40">// Initialize the client</p>
              <p><span className="text-primary">const</span> everpay = <span className="text-primary">require</span>(<span className="text-green-400">'@everpay/sdk'</span>);</p>
              <p className="mt-1">everpay.apiKey = <span className="text-green-400">'sk_live_...'</span>;</p>
              <p className="mt-3 text-white/40">// Create a payment</p>
              <p><span className="text-primary">const</span> payment = <span className="text-primary">await</span> everpay.payments.create({"{"}</p>
              <p className="pl-4">amount: <span className="text-primary">5000</span>,</p>
              <p className="pl-4">currency: <span className="text-green-400">'usd'</span>,</p>
              <p className="pl-4">customer: <span className="text-green-400">'cus_abc123'</span>,</p>
              <p className="pl-4">description: <span className="text-green-400">'Order #1234'</span>,</p>
              <p>{"}"});</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-24">
        <div className="container mx-auto px-6 max-w-3xl">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-4 font-body mx-auto block w-fit">FAQ</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-center font-heading mb-3">Frequently Asked Questions</h2>
          <p className="text-center text-muted-foreground font-body mb-10">We've compiled the most common questions to help you get started.</p>
          <div className="space-y-3">
            {[
              { q: "How do I connect a new integration?", a: "Navigate to the Integrations page in your dashboard, find the provider you want, and click Connect. Follow the setup wizard to authenticate and configure." },
              { q: "Are there any hidden fees?", a: "No. Everpay pricing is transparent — you only pay for the transactions you process. Integration setup is free." },
              { q: "Do you support international transactions?", a: "Yes. Our multi-PSP architecture supports 30+ currencies and routes transactions to the optimal provider based on geography and cost." },
              { q: "Can I use Everpay without coding skills?", a: "Absolutely. Our hosted checkout, payment links, and e-commerce plugins require zero code to set up." },
              { q: "How do you prevent fraud?", a: "We combine 3D Secure 2.0, machine learning fraud scoring, velocity checks, and device fingerprinting across all transactions." },
              { q: "Can I contact sales for a custom plan?", a: "Yes — reach out via our Contact page or book a free demo to discuss enterprise pricing and custom integrations." },
            ].map((faq, i) => (
              <details key={i} className="group border border-border rounded-xl">
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer font-medium text-foreground font-body text-[15px] list-none">
                  {faq.q}
                  <span className="text-muted-foreground group-open:rotate-180 transition-transform text-lg">▾</span>
                </summary>
                <div className="px-6 pb-4 text-sm text-muted-foreground font-body leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
      <SiteFooter />
    </div>
  );
}
