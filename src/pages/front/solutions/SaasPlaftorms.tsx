import { SiteHeader } from "@/components/front/SiteHeader"
import { SiteFooter } from "@/components/front/SiteFooter"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Code, CreditCard, Repeat, Shield, TrendingUp, Zap } from "lucide-react"
import { Link } from "react-router-dom"


export default function SaasPlaftormsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 py-20 text-white">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Embedded Payments for SaaS & Platforms
              </h1>
              <p className="text-xl text-blue-50">
                Monetize your platform with embedded payment solutions. Accept payments, manage subscriptions, and
                unlock new revenue streams seamlessly.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/demo">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                    Book a Demo
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white/10 bg-transparent"
                  >
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative h-[400px] lg:h-[500px]">
              <img
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop&q=80"
                alt="SaaS platform payments"
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
              <div className="text-4xl font-bold text-blue-600">2000+</div>
              <div className="text-sm text-gray-600 mt-2">SaaS Platforms</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">$10B+</div>
              <div className="text-sm text-gray-600 mt-2">Payment Volume</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">40%</div>
              <div className="text-sm text-gray-600 mt-2">Revenue Increase</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">15min</div>
              <div className="text-sm text-gray-600 mt-2">Integration Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Everything You Need to Monetize Your Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Embed payments directly into your platform and unlock new revenue opportunities
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Payment Facilitation</h3>
                <p className="text-gray-600">
                  Become a payment facilitator and process payments on behalf of your customers. Keep them in your
                  ecosystem.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <Repeat className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Subscription Billing</h3>
                <p className="text-gray-600">
                  Automate recurring billing, manage plans and pricing, handle upgrades and downgrades seamlessly.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <Code className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">White Label Solution</h3>
                <p className="text-gray-600">
                  Fully customizable payment experience that matches your brand. Your customers never leave your
                  platform.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Revenue Sharing</h3>
                <p className="text-gray-600">
                  Earn revenue share on every transaction. New monetization opportunities without changing your business
                  model.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Compliance & Security</h3>
                <p className="text-gray-600">
                  We handle all compliance, security, and regulatory requirements. PCI DSS Level 1 certified
                  infrastructure.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Fast Integration</h3>
                <p className="text-gray-600">
                  Get up and running in minutes with our pre-built components and comprehensive SDKs for all major
                  frameworks.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Platform Types Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Built for Every Platform Type</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Tailored solutions for your specific use case</p>
          </div>

          <div className="space-y-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">Vertical SaaS</h3>
                <p className="text-gray-600 mb-6">
                  Industry-specific software solutions can embed payments to serve their customers better and create new
                  revenue streams.
                </p>
                <ul className="space-y-3">
                  {[
                    "Tailored payment flows for your industry",
                    "Industry-specific compliance support",
                    "Custom reporting and analytics",
                    "Integrated accounting tools",
                    "Multi-location support",
                    "Vertical-specific features",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative h-[400px]">
                <img
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&q=80"
                  alt="Vertical SaaS"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 relative h-[400px]">
                <img
                  src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop&q=80"
                  alt="E-commerce platforms"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="order-1 md:order-2">
                <h3 className="text-2xl font-bold mb-4">E-commerce Platforms</h3>
                <p className="text-gray-600 mb-6">
                  Enable your merchants to accept payments without leaving your platform. Increase retention and
                  revenue.
                </p>
                <ul className="space-y-3">
                  {[
                    "Multi-merchant management",
                    "Embedded checkout experience",
                    "Global payment methods",
                    "Shopping cart integration",
                    "Order management",
                    "Shipping and fulfillment",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">Business Management Software</h3>
                <p className="text-gray-600 mb-6">
                  ERP, CRM, and business management platforms can offer payment processing as a native feature.
                </p>
                <ul className="space-y-3">
                  {[
                    "Seamless workflow integration",
                    "Automated invoicing",
                    "Payment reconciliation",
                    "Financial reporting",
                    "Multi-currency support",
                    "API-first architecture",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative h-[400px]">
                <img
                  src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop&q=80"
                  alt="Business management"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Why Embed Payments?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform your platform into a complete business solution
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Increase Revenue",
                description: "Earn a share of payment processing fees and unlock new monetization streams",
                stat: "+40%",
              },
              {
                title: "Improve Retention",
                description: "Customers stay in your ecosystem, reducing churn and increasing lifetime value",
                stat: "2x",
              },
              {
                title: "Faster Time to Market",
                description: "Launch embedded payments in days, not months, with our pre-built solutions",
                stat: "15min",
              },
              {
                title: "Better Experience",
                description: "Seamless payment experience keeps users engaged and reduces friction",
                stat: "99%",
              },
            ].map((benefit, index) => (
              <Card key={index}>
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{benefit.stat}</div>
                  <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Ready to Embed Payments in Your Platform?
          </h2>
          <p className="text-xl text-blue-50 mb-8 max-w-2xl mx-auto">
            Join thousands of platforms already monetizing with embedded payments. Get started today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/demo">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                Book a Demo
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 bg-transparent">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
