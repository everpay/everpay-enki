import { SiteHeader } from "@/components/front/SiteHeader"
import { SiteFooter } from "@/components/front/SiteFooter"
import { CTASection } from "@/components/front/CtaSection"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Building2, Globe, Shield, Users, Lock, TrendingUp } from "lucide-react"
import { Link } from "react-router-dom"


export default function EnterprisePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-600 to-slate-800 py-20 text-white">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Enterprise Payment Solutions at Scale
              </h1>
              <p className="text-xl text-slate-50">
                Purpose-built for global enterprises. Process billions in transactions with enterprise-grade security,
                compliance, and dedicated support.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/demo">
                  <Button size="lg" className="bg-white text-slate-600 hover:bg-slate-50">
                    Book a Demo
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white/10 bg-transparent"
                  >
                    Contact Sales
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative h-[400px] lg:h-[500px]">
              <img
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop&q=80"
                alt="Enterprise payments"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-slate-600">Fortune 500</div>
              <div className="text-sm text-gray-600 mt-2">Companies Trust Us</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-slate-600">$100B+</div>
              <div className="text-sm text-gray-600 mt-2">Annual Volume</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-slate-600">99.995%</div>
              <div className="text-sm text-gray-600 mt-2">Uptime SLA</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-slate-600">24/7/365</div>
              <div className="text-sm text-gray-600 mt-2">Dedicated Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Enterprise-Grade Payment Infrastructure
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built to handle the complexity and scale of global enterprises
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                  <Globe className="h-6 w-6 text-slate-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Global Scale</h3>
                <p className="text-gray-600">
                  Process payments in 150+ countries and 135+ currencies. Multi-region infrastructure with local
                  processing capabilities.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                  <Shield className="h-6 w-6 text-slate-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Advanced Security</h3>
                <p className="text-gray-600">
                  Enterprise-grade security with SOC 2 Type II, ISO 27001, PCI DSS Level 1 compliance, and advanced
                  fraud prevention.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                  <Building2 className="h-6 w-6 text-slate-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Custom Integration</h3>
                <p className="text-gray-600">
                  Tailored integrations with your existing ERP, CRM, and business systems. Dedicated integration team
                  and support.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                  <Users className="h-6 w-6 text-slate-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Dedicated Support</h3>
                <p className="text-gray-600">
                  24/7/365 dedicated account management, technical support, and professional services team for your
                  enterprise.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                  <Lock className="h-6 w-6 text-slate-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Compliance</h3>
                <p className="text-gray-600">
                  Meet global regulatory requirements including GDPR, PSD2, PCI DSS, and regional compliance standards.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                  <TrendingUp className="h-6 w-6 text-slate-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Advanced Analytics</h3>
                <p className="text-gray-600">
                  Enterprise reporting, custom dashboards, and business intelligence tools with real-time transaction
                  monitoring.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Enterprise Capabilities */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Built for Enterprise Complexity</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Handle the most complex payment scenarios at global scale
            </p>
          </div>

          <div className="space-y-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">Multi-Entity Management</h3>
                <p className="text-gray-600 mb-6">
                  Manage multiple legal entities, brands, and subsidiaries from a single platform with consolidated
                  reporting and billing.
                </p>
                <ul className="space-y-3">
                  {[
                    "Multi-entity hierarchy support",
                    "Consolidated financial reporting",
                    "Cross-entity fund transfers",
                    "Centralized compliance management",
                    "Brand-specific configurations",
                    "Unified administration portal",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-slate-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative h-[400px]">
                <img
                  src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop&q=80"
                  alt="Multi-entity management"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 relative h-[400px]">
                <img
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&q=80"
                  alt="Payment orchestration"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="order-1 md:order-2">
                <h3 className="text-2xl font-bold mb-4">Payment Orchestration</h3>
                <p className="text-gray-600 mb-6">
                  Intelligent routing across multiple processors, acquirers, and payment methods to optimize success
                  rates and costs.
                </p>
                <ul className="space-y-3">
                  {[
                    "Multi-processor failover",
                    "Smart transaction routing",
                    "Cost optimization algorithms",
                    "Regional processor selection",
                    "Custom routing rules",
                    "Real-time performance monitoring",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-slate-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">Advanced Fraud Management</h3>
                <p className="text-gray-600 mb-6">
                  Enterprise-grade fraud prevention with machine learning, custom rules, and real-time risk scoring.
                </p>
                <ul className="space-y-3">
                  {[
                    "AI-powered fraud detection",
                    "Custom risk rules engine",
                    "Real-time decisioning",
                    "Chargeback management",
                    "3D Secure 2.0 authentication",
                    "Global fraud intelligence network",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-slate-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative h-[400px]">
                <img
                  src="https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=600&fit=crop&q=80"
                  alt="Fraud management"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support & SLA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Enterprise-Grade Support</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Dedicated resources and support for your mission-critical operations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Dedicated Account Manager",
                description: "Single point of contact for all your needs, strategic guidance, and escalation support",
              },
              {
                title: "24/7 Technical Support",
                description: "Round-the-clock support from payment experts with guaranteed response times",
              },
              {
                title: "Professional Services",
                description: "Expert consulting, custom development, and integration assistance",
              },
              {
                title: "99.995% Uptime SLA",
                description: "Industry-leading uptime guarantee with financial penalties for non-compliance",
              },
            ].map((item, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-slate-600 to-slate-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Ready to Scale Your Enterprise Payments?
          </h2>
          <p className="text-xl text-slate-50 mb-8 max-w-2xl mx-auto">
            Let's discuss how everpay can support your enterprise payment needs. Talk to our enterprise team today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/demo">
              <Button size="lg" className="bg-white text-slate-600 hover:bg-slate-50">
                Book a Demo
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 bg-transparent">
                Contact Enterprise Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <CTASection />
      <SiteFooter />
    </div>
  )
}
