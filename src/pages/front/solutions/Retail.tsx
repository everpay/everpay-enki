import { SiteHeader } from "@/components/front/SiteHeader"
import { SiteFooter } from "@/components/front/SiteFooter"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Store, ShoppingBag, Smartphone, BarChart, Users, Zap } from "lucide-react"
import { Link } from "react-router-dom"

import { MetaballsBackground } from "@/components/front/MetaballsBackground"

export default function RetailPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-600 to-white-800 py-20 text-black overflow-hidden">
        <MetaballsBackground count={5} className="opacity-20" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Modern Payment Solutions for Retail
              </h1>
              <p className="text-xl text-black-50">
                Unify your in-store and online sales with seamless payment processing. Accept every payment type your
                customers prefer.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/demo">
                  <Button size="lg" className="border-grey bg-white text-purple-600 hover:bg-purple-50">
                    Book a Demo
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-grey text-grey hover:bg-white/10 bg-transparent"
                  >
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative h-[400px] lg:h-[500px]">
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop&q=80"
                alt="Retail payment processing"
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
              <div className="text-4xl font-bold text-purple-600">25K+</div>
              <div className="text-sm text-gray-600 mt-2">Retail Stores</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600">$3B+</div>
              <div className="text-sm text-gray-600 mt-2">Processed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600">99.99%</div>
              <div className="text-sm text-gray-600 mt-2">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600">24/7</div>
              <div className="text-sm text-gray-600 mt-2">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Complete Retail Payment Platform</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to run a successful retail business
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <Store className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">In-Store Payments</h3>
                <p className="text-gray-600">
                  Accept all payment types including chip, swipe, tap, and mobile wallets. Fast checkout keeps your
                  lines moving.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <ShoppingBag className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Omnichannel Commerce</h3>
                <p className="text-gray-600">
                  Unify in-store, online, and mobile sales. One platform for all your channels with centralized
                  inventory.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <Smartphone className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Mobile POS</h3>
                <p className="text-gray-600">
                  Empower your sales associates with mobile checkout. Process payments anywhere in your store or at
                  events.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <BarChart className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Inventory Management</h3>
                <p className="text-gray-600">
                  Real-time inventory tracking across all locations. Automatic stock alerts and purchase order
                  management.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Customer Loyalty</h3>
                <p className="text-gray-600">
                  Built-in loyalty programs and customer profiles. Track purchase history and reward your best
                  customers.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Quick Integration</h3>
                <p className="text-gray-600">
                  Connect with your existing systems easily. Integrations with major retail software and e-commerce
                  platforms.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Retail Types Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Solutions for Every Retail Format</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Specialized features for your retail business type
            </p>
          </div>

          <div className="space-y-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">Specialty Retail</h3>
                <p className="text-gray-600 mb-6">
                  Perfect for boutiques, specialty shops, and unique retail concepts. Tools to create memorable shopping
                  experiences.
                </p>
                <ul className="space-y-3">
                  {[
                    "Custom product catalogs",
                    "Gift card and store credit",
                    "Special order management",
                    "Customer wishlists",
                    "Clienteling tools",
                    "Multi-store inventory",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-purple-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative h-[400px]">
                <img
                  src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&h=600&fit=crop&q=80"
                  alt="Specialty retail"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 relative h-[400px]">
                <img
                  src="https://images.unsplash.com/photo-1580828343064-fde4fc206bc6?w=800&h=600&fit=crop&q=80"
                  alt="Fashion retail"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="order-1 md:order-2">
                <h3 className="text-2xl font-bold mb-4">Fashion & Apparel</h3>
                <p className="text-gray-600 mb-6">
                  Manage seasonal inventory, size/color variants, and returns efficiently with our fashion-focused
                  features.
                </p>
                <ul className="space-y-3">
                  {[
                    "Size and color matrix",
                    "Seasonal collections",
                    "Easy returns and exchanges",
                    "Customer style profiles",
                    "Visual merchandising reports",
                    "Cross-channel fulfillment",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-purple-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">Multi-Location Retail</h3>
                <p className="text-gray-600 mb-6">
                  Manage multiple stores from one centralized system. Real-time sync across all locations.
                </p>
                <ul className="space-y-3">
                  {[
                    "Centralized management dashboard",
                    "Inter-store transfers",
                    "Location-based reporting",
                    "Consolidated inventory view",
                    "Employee management across stores",
                    "Unified customer database",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-purple-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative h-[400px]">
                <img
                  src="https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80"
                  alt="Multi-location retail"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hardware Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Flexible Hardware Options</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the right hardware for your store layout and workflow
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Countertop Terminal",
                description: "Traditional checkout with modern capabilities",
                features: ["Touchscreen display", "Built-in printer", "Contactless ready"],
              },
              {
                title: "Mobile POS",
                description: "Take payments anywhere in your store",
                features: ["iPad/tablet based", "Portable reader", "Line busting"],
              },
              {
                title: "All-in-One POS",
                description: "Complete solution with cash drawer",
                features: ["Integrated hardware", "Receipt printer", "Scanner ready"],
              },
            ].map((hardware, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-3">{hardware.title}</h3>
                  <p className="text-gray-600 mb-4">{hardware.description}</p>
                  <ul className="space-y-2">
                    {hardware.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-purple-600" />
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
      <section className="py-20 bg-gradient-to-br from-purple-600 to-purple-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Ready to Modernize Your Retail Store?</h2>
          <p className="text-xl text-purple-50 mb-8 max-w-2xl mx-auto">
            Join thousands of retailers using everpay. Get started today with a free consultation.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/demo">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50">
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
