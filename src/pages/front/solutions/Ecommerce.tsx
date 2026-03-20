import { SiteHeader } from "@/components/front/SiteHeader"
import { SiteFooter } from "@/components/front/SiteFooter"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Lock, Zap, Globe, TrendingUp, Shield, Users } from "lucide-react"
import { Link } from "react-router-dom"
import { MetaballsBackground } from "@/components/front/MetaballsBackground"

export default function EcommercePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-teal-600 to-teal-800 py-20 text-white overflow-hidden">
        <MetaballsBackground count={5} className="opacity-20" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Secure Payment Solutions for E-commerce
              </h1>
              <p className="text-xl text-teal-50">
                Drive revenue growth with secure, seamless checkout experiences. Accept payments globally while
                protecting your customers and your business from fraud.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/demo">
                  <Button size="lg" className="bg-white text-teal-600 hover:bg-teal-50">
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
              <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&q=80" alt="E-commerce payment processing" className="absolute inset-0 w-full h-full object-cover rounded-lg shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-teal-600">150+</div>
              <div className="text-sm text-gray-600 mt-2">Countries Supported</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-teal-600">99.9%</div>
              <div className="text-sm text-gray-600 mt-2">Uptime SLA</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-teal-600">$50B+</div>
              <div className="text-sm text-gray-600 mt-2">Processed Annually</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-teal-600">0.1%</div>
              <div className="text-sm text-gray-600 mt-2">Fraud Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Challenges Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              E-commerce Payment Challenges We Solve
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We understand the unique challenges online businesses face
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Card-Not-Present Fraud</h3>
                <p className="text-gray-600">
                  Advanced fraud detection with machine learning algorithms that adapt to new threats in real-time,
                  protecting your revenue.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Cart Abandonment</h3>
                <p className="text-gray-600">
                  Optimize checkout flow with one-click payments, digital wallets, and flexible payment options to
                  maximize conversions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Global Expansion</h3>
                <p className="text-gray-600">
                  Accept 135+ currencies and local payment methods worldwide. Automatic currency conversion and tax
                  calculation.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <Lock className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">PCI Compliance</h3>
                <p className="text-gray-600">
                  Built-in PCI DSS Level 1 compliance. We handle the security so you can focus on growing your business.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Payment Processing Speed</h3>
                <p className="text-gray-600">
                  Process transactions in under 2 seconds with 99.9% uptime. Fast settlements to improve your cash flow.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100">
                  <Users className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Customer Experience</h3>
                <p className="text-gray-600">
                  Seamless mobile checkout, saved payment methods, and intelligent retry logic for failed transactions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Complete E-commerce Payment Platform</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to accept payments and grow your online business
            </p>
          </div>

          <div className="space-y-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">Flexible Payment Options</h3>
                <p className="text-gray-600 mb-6">
                  Give your customers the freedom to pay how they want. Support for all major credit cards, digital
                  wallets, buy now pay later, and local payment methods.
                </p>
                <ul className="space-y-3">
                  {[
                    "Credit & debit cards (Visa, Mastercard, Amex, Discover)",
                    "Digital wallets (Apple Pay, Google Pay, PayPal)",
                    "Buy now, pay later (Affirm, Klarna, Afterpay)",
                    "Bank transfers and ACH",
                    "Cryptocurrency payments",
                    "Local payment methods for 150+ countries",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-teal-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative h-[400px]">
                <img src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop&q=80" alt="Payment methods" className="absolute inset-0 w-full h-full object-cover rounded-lg shadow-xl" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 relative h-[400px]">
                <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&q=80" alt="Fraud prevention" className="absolute inset-0 w-full h-full object-cover rounded-lg shadow-xl" />
              </div>
              <div className="order-1 md:order-2">
                <h3 className="text-2xl font-bold mb-4">Advanced Fraud Prevention</h3>
                <p className="text-gray-600 mb-6">
                  Protect your business with enterprise-grade fraud detection powered by machine learning and AI. Reduce
                  chargebacks and false declines.
                </p>
                <ul className="space-y-3">
                  {[
                    "Real-time risk scoring and fraud detection",
                    "3D Secure 2.0 authentication",
                    "Device fingerprinting and behavioral analysis",
                    "Customizable fraud rules engine",
                    "Chargeback management and prevention",
                    "Address verification (AVS) and CVV checks",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-teal-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">Seamless Integration</h3>
                <p className="text-gray-600 mb-6">
                  Easy integration with your existing e-commerce platform. Pre-built plugins for Shopify, WooCommerce,
                  Magento, and more.
                </p>
                <ul className="space-y-3">
                  {[
                    "RESTful APIs and webhooks",
                    "SDKs for major programming languages",
                    "Pre-built plugins for popular platforms",
                    "Hosted checkout pages",
                    "Mobile SDKs for iOS and Android",
                    "Comprehensive documentation",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-teal-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative h-[400px]">
                <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&q=80" alt="Integration" className="absolute inset-0 w-full h-full object-cover rounded-lg shadow-xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Built for Every E-commerce Model</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you're B2C, B2B, or marketplace, we have the right solution
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Direct-to-Consumer",
                description:
                  "Perfect for brands selling directly to customers. Optimize conversion with fast checkout and flexible payment options.",
                features: ["One-click checkout", "Subscription billing", "Multi-currency support"],
              },
              {
                title: "B2B E-commerce",
                description:
                  "Handle large transactions, net terms, and complex approval workflows with enterprise-grade features.",
                features: ["Invoice payments", "Purchase orders", "Credit terms"],
              },
              {
                title: "Marketplaces",
                description:
                  "Split payments, manage seller payouts, and handle complex fee structures with our marketplace solution.",
                features: ["Split payments", "Seller payouts", "Escrow services"],
              },
            ].map((useCase, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-3">{useCase.title}</h3>
                  <p className="text-gray-600 mb-4">{useCase.description}</p>
                  <ul className="space-y-2">
                    {useCase.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-teal-600" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-teal-600 to-teal-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Ready to Grow Your E-commerce Business?
          </h2>
          <p className="text-xl text-teal-50 mb-8 max-w-2xl mx-auto">
            Join thousands of online merchants already using everpay. Get started today with a free consultation.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/demo">
              <Button size="lg" className="bg-white text-teal-600 hover:bg-teal-50">
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
