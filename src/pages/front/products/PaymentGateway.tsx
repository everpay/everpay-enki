import { SiteHeader } from "@/components/front/SiteHeader"
import { SiteFooter } from "@/components/front/SiteFooter"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, GitBranch, Shield, TrendingUp, Zap, Globe, BarChart } from "lucide-react"
import { Link } from "react-router-dom"

import { MetaballsBackground } from "@/components/front/MetaballsBackground"

export default function PaymentGatewayPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-green-50 to-white py-20 md:py-32 text-gray-900 animate-fade-in">
        <MetaballsBackground count={6} className="opacity-30" />

        <div className="container mx-auto px-3 relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Intelligent Payments Orchestration
              </h1>
              <p className="text-xl text-gray-600">
                Optimize payment routing, maximize authorization rates, and reduce costs with our AI powered payments
                orchestration platform.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/demo">
                  <Button
                    size="lg"
                    className="bg-gray-900 hover:bg-gray-800 text-white rounded-full shadow-xl min-w-[200px]"
                  >
                    Book a Demo
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-gray-900 bg-transparent text-gray-900 hover:bg-gray-900 hover:text-white rounded-full min-w-[200px]"
                  >
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative h-[380px] lg:h-[480px]">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&q=80"
                alt="Payment gateway orchestration"
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
              <div className="text-4xl font-bold text-emerald-600">+15%</div>
              <div className="text-sm text-gray-600 mt-2">Higher Auth Rates</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600">-30%</div>
              <div className="text-sm text-gray-600 mt-2">Processing Costs</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600">99.99%</div>
              <div className="text-sm text-gray-600 mt-2">Uptime SLA</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600">50ms</div>
              <div className="text-sm text-gray-600 mt-2">Avg Response Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Next-Generation Payment Orchestration
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Optimize every transaction with intelligent routing and orchestration
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                  <GitBranch className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Smart Routing</h3>
                <p className="text-gray-600">
                  Automatically route transactions to the best processor based on success rates, cost, and performance
                  metrics.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Maximize Approvals</h3>
                <p className="text-gray-600">
                  Increase authorization rates by up to 15% with intelligent retry logic and processor failover
                  strategies.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                  <Shield className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Multi-Processor Support</h3>
                <p className="text-gray-600">
                  Connect to multiple payment processors through a single API. Avoid vendor lock-in and negotiate better
                  rates.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                  <Zap className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Real-Time Analytics</h3>
                <p className="text-gray-600">
                  Monitor transaction performance, success rates, and costs in real-time with detailed analytics
                  dashboards.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                  <Globe className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Global Reach</h3>
                <p className="text-gray-600">
                  Accept payments in 135+ currencies with local payment methods and automatic currency conversion.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                  <BarChart className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Cost Optimization</h3>
                <p className="text-gray-600">
                  Reduce processing costs by up to 30% by routing to the most cost-effective processor for each
                  transaction.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">How Payment Orchestration Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Intelligent decision-making at every step of the payment flow
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {[
              {
                step: "1",
                title: "Transaction Initiated",
                description:
                  "Customer initiates a payment on your website, app, or POS system. Transaction data is securely captured.",
              },
              {
                step: "2",
                title: "Intelligent Routing",
                description:
                  "Our orchestration engine analyzes the transaction and selects the optimal processor based on multiple factors including success rates, cost, and processor health.",
              },
              {
                step: "3",
                title: "Smart Retry Logic",
                description:
                  "If the initial attempt fails, the system automatically retries with the best alternative processor, maximizing authorization rates.",
              },
              {
                step: "4",
                title: "Real-Time Monitoring",
                description:
                  "Transaction performance is monitored in real-time. Analytics and insights are immediately available in your dashboard.",
              },
            ].map((item, index) => (
              <div key={index} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Why Choose Payment Orchestration?</h2>
              <div className="space-y-6">
                {[
                  {
                    title: "Higher Revenue",
                    description:
                      "Increase successful transactions by 15% with intelligent routing and retry logic, directly impacting your bottom line.",
                  },
                  {
                    title: "Lower Costs",
                    description:
                      "Reduce processing fees by automatically routing to the most cost-effective processor for each transaction type.",
                  },
                  {
                    title: "Better Experience",
                    description:
                      "Minimize payment failures and provide customers with a seamless checkout experience across all channels.",
                  },
                  {
                    title: "Full Control",
                    description:
                      "Maintain complete control over your payment infrastructure without being locked into a single processor.",
                  },
                ].map((benefit, index) => (
                  <div key={index} className="flex gap-4">
                    <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">{benefit.title}</h3>
                      <p className="text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative h-[500px]">
              <img
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&q=80"
                alt="Payment analytics"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Connect Any Processor</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Integrate with leading payment processors through a single unified API
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {["Stripe", "Adyen", "Braintree", "Authorize.Net", "WorldPay", "PayPal", "Square", "Checkout.com"].map(
              (processor, index) => (
                <Card key={index}>
                  <CardContent className="pt-6 text-center">
                    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                      <span className="text-2xl font-bold text-emerald-600">{processor[0]}</span>
                    </div>
                    <h3 className="text-lg font-semibold">{processor}</h3>
                  </CardContent>
                </Card>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Seamlessly integrate with your existing tools</h2>
              <p className="text-gray-600 mb-8">
                Connect your commerce platform with the tools you already use. From accounting software to marketing
                tools, we make it easy to run your entire business from one place.
              </p>
              <ul className="space-y-4">
                {[
                  "Accounting software integration",
                  "Marketing automation tools",
                  "Inventory management systems",
                  "Customer relationship management",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#4CAF50]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative h-[400px] rounded-lg overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71"
                alt="Integration dashboard"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#0A2F2F] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Ready to Optimize Your Payment Processing?
          </h2>
          <p className="text-xl text-emerald-50 mb-8 max-w-2xl mx-auto">
            See how payment orchestration can increase your revenue and reduce costs. Get started today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/demo">
              <Button size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50">
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
