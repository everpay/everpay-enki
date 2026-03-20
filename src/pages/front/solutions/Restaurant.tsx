import { SiteHeader } from "@/components/front/SiteHeader"
import { SiteFooter } from "@/components/front/SiteFooter"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Utensils, CreditCard, Smartphone, Users, BarChart, Clock } from "lucide-react"
import { Link } from "react-router-dom"

import { MetaballsBackground } from "@/components/front/MetaballsBackground"

export default function RestaurantPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-600 to-orange-800 py-20 text-white overflow-hidden">
        <MetaballsBackground count={5} className="opacity-20" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Complete Payment Solutions for Restaurants
              </h1>
              <p className="text-xl text-orange-50">
                From quick-service to fine dining, accept payments faster and serve more customers with our
                restaurant-focused payment solutions.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/demo">
                  <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50">
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
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&q=80"
                alt="Restaurant payment processing"
                className="absolute inset-0 w-full h-full object-cover"
                className="object-cover rounded-lg shadow-2xl"
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
              <div className="text-4xl font-bold text-orange-600">30%</div>
              <div className="text-sm text-gray-600 mt-2">Faster Service</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600">24/7</div>
              <div className="text-sm text-gray-600 mt-2">Support Available</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600">15K+</div>
              <div className="text-sm text-gray-600 mt-2">Restaurants Trust Us</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600">99.9%</div>
              <div className="text-sm text-gray-600 mt-2">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Everything Your Restaurant Needs</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From tableside payments to online ordering, we've got you covered
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                  <CreditCard className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Tableside Payments</h3>
                <p className="text-gray-600">
                  Accept payments right at the table with mobile POS devices. Faster checkouts mean happier customers
                  and higher table turnover.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                  <Smartphone className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Online Ordering</h3>
                <p className="text-gray-600">
                  Integrate with your online ordering system. Accept payments for delivery, takeout, and curbside pickup
                  seamlessly.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Split Bills</h3>
                <p className="text-gray-600">
                  Handle split checks effortlessly. Split by item, evenly, or custom amounts. Make group dining easy for
                  your servers.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                  <BarChart className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Reporting & Analytics</h3>
                <p className="text-gray-600">
                  Track sales, tips, and trends in real-time. Make data-driven decisions to optimize your menu and
                  staffing.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Quick Service Mode</h3>
                <p className="text-gray-600">
                  Optimized for fast-casual and QSR. Process transactions in seconds with streamlined payment flows.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                  <Utensils className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Tip Management</h3>
                <p className="text-gray-600">
                  Flexible tip options with automatic calculation. Digital tip prompts increase tip amounts by up to
                  20%.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Restaurant Types Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Solutions for Every Restaurant Type</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tailored features for your specific restaurant model
            </p>
          </div>

          <div className="space-y-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">Quick Service Restaurants</h3>
                <p className="text-gray-600 mb-6">
                  Speed is everything in QSR. Our solutions help you serve more customers faster with optimized payment
                  flows.
                </p>
                <ul className="space-y-3">
                  {[
                    "Lightning-fast transaction processing",
                    "Order-ahead and mobile ordering",
                    "Drive-thru payment solutions",
                    "Self-service kiosks integration",
                    "Loyalty program integration",
                    "Multi-location management",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-orange-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative h-[400px]">
                <img
                  src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop&q=80"
                  alt="Quick service restaurant"
                  className="absolute inset-0 w-full h-full object-cover"
                  className="object-cover rounded-lg shadow-xl"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 relative h-[400px]">
                <img
                  src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop&q=80"
                  alt="Full service restaurant"
                  className="absolute inset-0 w-full h-full object-cover"
                  className="object-cover rounded-lg shadow-xl"
                />
              </div>
              <div className="order-1 md:order-2">
                <h3 className="text-2xl font-bold mb-4">Full Service Restaurants</h3>
                <p className="text-gray-600 mb-6">
                  Enhance the dining experience with tableside payments and seamless check splitting for your guests.
                </p>
                <ul className="space-y-3">
                  {[
                    "Tableside payment processing",
                    "Advanced tip management",
                    "Table management integration",
                    "Wine and bar tab features",
                    "Server-level reporting",
                    "Guest check splitting",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-orange-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">Food Trucks & Pop-ups</h3>
                <p className="text-gray-600 mb-6">
                  Mobile-first payment solutions perfect for food trucks, pop-ups, and catering services.
                </p>
                <ul className="space-y-3">
                  {[
                    "Portable mobile card readers",
                    "WiFi and 4G connectivity",
                    "Long battery life devices",
                    "Contactless payments",
                    "Offline mode capability",
                    "Real-time sales tracking",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-orange-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative h-[400px]">
                <img
                  src="https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=800&h=600&fit=crop&q=80"
                  alt="Food truck"
                  className="absolute inset-0 w-full h-full object-cover"
                  className="object-cover rounded-lg shadow-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Integrates With Your POS</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Seamlessly connect with leading restaurant management systems
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {["Toast", "Square", "Clover", "TouchBistro", "Lightspeed", "Aloha", "Revel", "Upserve"].map(
              (pos, index) => (
                <Card key={index}>
                  <CardContent className="pt-6 text-center">
                    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                      <span className="text-2xl font-bold text-orange-600">{pos[0]}</span>
                    </div>
                    <h3 className="text-lg font-semibold">{pos}</h3>
                  </CardContent>
                </Card>
              ),
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-orange-600 to-orange-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Ready to Transform Your Restaurant Payments?
          </h2>
          <p className="text-xl text-orange-50 mb-8 max-w-2xl mx-auto">
            Join thousands of restaurants using everpay. Get started today with a free consultation.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/demo">
              <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50">
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
