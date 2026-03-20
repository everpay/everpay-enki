import { SiteHeader } from "@/components/front/SiteHeader"
import { SiteFooter } from "@/components/front/SiteFooter"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Users, DollarSign, Shield, TrendingUp, Zap, Globe } from "lucide-react"
import { Link } from "react-router-dom"


export default function MarketplacesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-green-50 to-white py-20 md:py-32 animate-fade-in text-grey-900">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Power Your Marketplace with Seamless Payments
              </h1>
              <p className="text-xl text-grey-500">
                Enable multi-party transactions, automate payouts, and scale globally with our comprehensive marketplace
                payment platform.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/demo">
                  <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50">
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
                src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=600&fit=crop&q=80"
                alt="Marketplace payments"
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
              <div className="text-4xl font-bold text-indigo-600">500+</div>
              <div className="text-sm text-gray-600 mt-2">Marketplaces Powered</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600">$5B+</div>
              <div className="text-sm text-gray-600 mt-2">GMV Processed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600">150+</div>
              <div className="text-sm text-gray-600 mt-2">Countries Supported</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600">99.9%</div>
              <div className="text-sm text-gray-600 mt-2">Platform Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Complete Marketplace Payment Solution
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage complex multi-party transactions
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                  <DollarSign className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Split Payments</h3>
                <p className="text-gray-600">
                  Automatically split payments between multiple sellers, handle commissions, and manage complex fee
                  structures with ease.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Seller Onboarding</h3>
                <p className="text-gray-600">
                  Streamlined onboarding process with automated KYC/KYB verification, identity checks, and compliance
                  screening.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                  <Zap className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Instant Payouts</h3>
                <p className="text-gray-600">
                  Enable instant payouts to sellers or schedule automated bulk payouts on your preferred cadence.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                  <Shield className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Escrow Services</h3>
                <p className="text-gray-600">
                  Hold funds in escrow until delivery confirmation, protecting both buyers and sellers in your
                  marketplace.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                  <Globe className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Global Coverage</h3>
                <p className="text-gray-600">
                  Accept payments in 135+ currencies and pay out sellers in their local currency automatically.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                  <TrendingUp className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Revenue Optimization</h3>
                <p className="text-gray-600">
                  Advanced analytics and reporting to optimize pricing, fees, and transaction success rates.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Built for Every Marketplace Model</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you're B2B, B2C, or C2C, we have the right solution
            </p>
          </div>

          <div className="space-y-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">E-commerce Marketplaces</h3>
                <p className="text-gray-600 mb-6">
                  Perfect for multi-vendor e-commerce platforms. Handle product listings, inventory, orders, and
                  payments seamlessly.
                </p>
                <ul className="space-y-3">
                  {[
                    "Multi-vendor management",
                    "Product catalog sync",
                    "Order fulfillment tracking",
                    "Seller dashboard & analytics",
                    "Automated commission splits",
                    "Integrated shipping solutions",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-indigo-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative h-[400px]">
                <img
                  src="https://images.unsplash.com/photo-1556742111-a301076d9d18?w=800&h=600&fit=crop&q=80"
                  alt="E-commerce marketplace"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 relative h-[400px]">
                <img
                  src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=800&h=600&fit=crop&q=80"
                  alt="Service marketplace"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="order-1 md:order-2">
                <h3 className="text-2xl font-bold mb-4">Service Marketplaces</h3>
                <p className="text-gray-600 mb-6">
                  Enable service providers to receive bookings and payments. Perfect for gig economy and professional
                  services platforms.
                </p>
                <ul className="space-y-3">
                  {[
                    "Booking and scheduling integration",
                    "Milestone-based payments",
                    "Escrow for project completion",
                    "Rating and review system",
                    "Time tracking integration",
                    "Dispute resolution tools",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-indigo-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">Peer-to-Peer Marketplaces</h3>
                <p className="text-gray-600 mb-6">
                  Connect buyers and sellers directly with secure peer-to-peer payment processing and fraud protection.
                </p>
                <ul className="space-y-3">
                  {[
                    "Identity verification",
                    "Secure messaging system",
                    "Transaction protection",
                    "Automated refunds",
                    "Community trust scoring",
                    "Local payment methods",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-indigo-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative h-[400px]">
                <img
                  src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=800&h=600&fit=crop&q=80"
                  alt="P2P marketplace"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Developer-Friendly Platform</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful APIs and tools to build your marketplace faster
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "RESTful APIs",
                description: "Comprehensive APIs for payment processing, seller management, and payouts",
              },
              {
                title: "Webhooks",
                description: "Real-time notifications for all marketplace events and transactions",
              },
              {
                title: "SDKs & Libraries",
                description: "Pre-built SDKs for major programming languages and frameworks",
              },
              {
                title: "White Label",
                description: "Fully customizable UI to match your marketplace brand",
              },
              {
                title: "Testing Environment",
                description: "Comprehensive sandbox for testing all marketplace scenarios",
              },
              {
                title: "Documentation",
                description: "Detailed guides, tutorials, and API references",
              },
            ].map((feature, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Ready to Launch Your Marketplace?</h2>
          <p className="text-xl text-indigo-50 mb-8 max-w-2xl mx-auto">
            Join hundreds of successful marketplaces using everpay. Get started today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/demo">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50">
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
