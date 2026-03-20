import { SiteHeader } from "@/components/front/SiteHeader"
import { SiteFooter } from "@/components/front/SiteFooter"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, CreditCard, ShoppingCart, Lock, Users, Zap, Globe, BarChart } from "lucide-react"
import { Link } from "react-router-dom"

import { MetaballsBackground } from "@/components/front/MetaballsBackground"

export default function PosPage() {
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
                Complete POS Solutions for Modern Businesses
              </h1>
              <p className="text-xl text-teal-50">
                Accept payments anywhere with our advanced point-of-sale systems. Fast, secure, and built for growth.
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
              <img
                src="/modern-pos-terminal-payment-system.jpg"
                alt="Modern POS Terminal System"
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
              <div className="text-4xl font-bold text-teal-600">99.9%</div>
              <div className="text-sm text-gray-600 mt-2">Uptime Guarantee</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-teal-600">&lt;2s</div>
              <div className="text-sm text-gray-600 mt-2">Transaction Speed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-teal-600">50K+</div>
              <div className="text-sm text-gray-600 mt-2">Active Merchants</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-teal-600">24/7</div>
              <div className="text-sm text-gray-600 mt-2">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Everything You Need to Run Your Business
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed to streamline operations and grow your revenue
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100">
                  <CreditCard className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Accept All Payment Types</h3>
                <p className="text-gray-600">
                  Credit cards, debit cards, mobile wallets, contactless payments, and more. Support for all major
                  payment methods.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100">
                  <Zap className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Lightning Fast Checkout</h3>
                <p className="text-gray-600">
                  Process transactions in under 2 seconds. Reduce wait times and serve more customers efficiently.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100">
                  <ShoppingCart className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Inventory Management</h3>
                <p className="text-gray-600">
                  Track stock levels in real-time, set low-stock alerts, and manage products across multiple locations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100">
                  <BarChart className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Advanced Analytics</h3>
                <p className="text-gray-600">
                  Get insights into sales trends, top products, and customer behavior with detailed reporting
                  dashboards.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100">
                  <Lock className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Bank-Level Security</h3>
                <p className="text-gray-600">
                  PCI DSS Level 1 certified with end-to-end encryption. Your data and your customers' information are
                  always protected.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100">
                  <Users className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Employee Management</h3>
                <p className="text-gray-600">
                  Set permissions, track time, monitor performance, and manage multiple team members from one dashboard.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Hardware Options Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Choose Your Perfect Hardware</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From countertop terminals to mobile readers, we have the right solution for your business
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="overflow-hidden">
              <div className="relative h-64">
                <img src="/countertop-pos-terminal.jpg" alt="Countertop POS Terminal" className="absolute inset-0 w-full h-full object-cover" />
              </div>
              <CardContent className="pt-6">
                <h3 className="text-2xl font-semibold mb-3">Countertop Terminal</h3>
                <p className="text-gray-600 mb-4">
                  Perfect for retail stores and restaurants. Accept chip, swipe, tap, and mobile payments.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-teal-600" />
                    <span>5.5" touchscreen display</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-teal-600" />
                    <span>Built-in receipt printer</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-teal-600" />
                    <span>WiFi & 4G connectivity</span>
                  </li>
                </ul>
                <Link to="/demo">
                  <Button className="w-full">Learn More</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="relative h-64">
                <img src="/mobile-card-reader.jpg" alt="Mobile Card Reader" className="absolute inset-0 w-full h-full object-cover" />
              </div>
              <CardContent className="pt-6">
                <h3 className="text-2xl font-semibold mb-3">Mobile Reader</h3>
                <p className="text-gray-600 mb-4">
                  Accept payments anywhere with our compact mobile card reader. Perfect for on-the-go businesses.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-teal-600" />
                    <span>Bluetooth connectivity</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-teal-600" />
                    <span>12-hour battery life</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-teal-600" />
                    <span>Contactless payments</span>
                  </li>
                </ul>
                <Link to="/demo">
                  <Button className="w-full">Learn More</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="relative h-64">
                <img src="/tablet-pos-system.jpg" alt="Tablet POS System" className="absolute inset-0 w-full h-full object-cover" />
              </div>
              <CardContent className="pt-6">
                <h3 className="text-2xl font-semibold mb-3">Tablet POS</h3>
                <p className="text-gray-600 mb-4">
                  Full-featured POS system on a tablet. Ideal for restaurants, cafes, and service businesses.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-teal-600" />
                    <span>10" HD touchscreen</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-teal-600" />
                    <span>Cloud-based software</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-teal-600" />
                    <span>Optional printer & cash drawer</span>
                  </li>
                </ul>
                <Link to="/demo">
                  <Button className="w-full">Learn More</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Seamless Integrations</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connect with the tools you already use to run your business
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
                  <ShoppingCart className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">E-commerce</h3>
                <p className="text-sm text-gray-600">Shopify, WooCommerce, Magento</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
                  <BarChart className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Accounting</h3>
                <p className="text-sm text-gray-600">QuickBooks, Xero, FreshBooks</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
                  <Users className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">CRM</h3>
                <p className="text-sm text-gray-600">Salesforce, HubSpot, Mailchimp</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
                  <Globe className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">More Tools</h3>
                <p className="text-sm text-gray-600">1000+ integrations via API</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Built for Every Industry</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Customized solutions for your specific business needs
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Retail",
                description: "Inventory management, customer loyalty programs, and multi-location support",
              },
              {
                title: "Restaurants",
                description: "Table management, kitchen display systems, and online ordering integration",
              },
              { title: "Healthcare", description: "HIPAA compliant, appointment scheduling, and insurance billing" },
              {
                title: "Beauty & Wellness",
                description: "Booking management, customer profiles, and membership programs",
              },
              { title: "Professional Services", description: "Time tracking, invoicing, and project management tools" },
              {
                title: "E-commerce",
                description: "Online and in-store sales sync, shipping integration, and returns management",
              },
            ].map((industry, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-2">{industry.title}</h3>
                  <p className="text-gray-600">{industry.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-teal-600 to-teal-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Ready to Transform Your Business?</h2>
          <p className="text-xl text-teal-50 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already using everpay POS solutions. Get started today with a free demo.
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
