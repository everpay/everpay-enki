import { SiteHeader } from "@/components/front/SiteHeader"
import { SiteFooter } from "@/components/front/SiteFooter"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Smartphone, Wifi, ShoppingBag, Users, Shield, Zap } from "lucide-react"
import { Link } from "react-router-dom"
export default function MobilePaymentsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-green-50 to-white py-20 md:py-32 animate-fade-in text-grey-900">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Accept Payments Anywhere with Mobile POS
              </h1>
              <p className="text-xl text-grey-500">
                Transform your smartphone or tablet into a powerful point of sale. Accept payments on-the-go with our
                secure mobile payment solutions.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/demo">
                  <Button size="lg" className="bg-white text-cyan-600 hover:bg-cyan-50">
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
              <img src="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=800&h=600&fit=crop&q=80" alt="Mobile payment processing" className="absolute inset-0 w-full h-full object-cover rounded-lg shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-600">85%</div>
              <div className="text-sm text-gray-600 mt-2">Mobile Adoption</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-600">2sec</div>
              <div className="text-sm text-gray-600 mt-2">Transaction Time</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-600">99.9%</div>
              <div className="text-sm text-gray-600 mt-2">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-600">12hr</div>
              <div className="text-sm text-gray-600 mt-2">Battery Life</div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20 animate-fade-in">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Complete Mobile Payment Solution</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to accept payments wherever your business takes you
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-100">
                  <Smartphone className="h-6 w-6 text-cyan-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Tap, Chip & Swipe</h3>
                <p className="text-gray-600">
                  Accept all payment types including contactless NFC, EMV chip cards, and traditional magnetic stripe
                  cards.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-100">
                  <Wifi className="h-6 w-6 text-cyan-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Works Offline</h3>
                <p className="text-gray-600">
                  Continue accepting payments even without internet connection. Transactions sync automatically when
                  back online.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-100">
                  <ShoppingBag className="h-6 w-6 text-cyan-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Digital Receipts</h3>
                <p className="text-gray-600">
                  Send receipts via email or SMS instantly. Reduce paper waste and keep customers connected to your
                  business.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-100">
                  <Users className="h-6 w-6 text-cyan-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Multi-User Support</h3>
                <p className="text-gray-600">
                  Multiple team members can use the same account with individual login credentials and permission
                  levels.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-100">
                  <Shield className="h-6 w-6 text-cyan-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Bank-Level Security</h3>
                <p className="text-gray-600">
                  End-to-end encryption and PCI DSS Level 1 compliance protect every transaction and customer data.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-100">
                  <Zap className="h-6 w-6 text-cyan-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Instant Setup</h3>
                <p className="text-gray-600">
                  Download the app, pair your card reader, and start accepting payments in minutes. No technical
                  expertise required.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-gray-50 animate-fade-in">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Perfect For Every Mobile Business</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From food trucks to field services, we have you covered
            </p>
          </div>

          <div className="space-y-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">Food Trucks & Pop-Ups</h3>
                <p className="text-gray-600 mb-6">
                  Perfect for mobile food vendors, farmers markets, and pop-up shops. Accept payments anywhere you set
                  up.
                </p>
                <ul className="space-y-3">
                  {[
                    "Quick transaction processing",
                    "Works on battery power",
                    "Menu and inventory management",
                    "Multiple payment methods",
                    "Location tracking",
                    "Event reporting",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-cyan-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative h-[400px]">
                <img src="https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=800&h=600&fit=crop&q=80" alt="Food truck" className="absolute inset-0 w-full h-full object-cover rounded-lg shadow-xl" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 relative h-[400px]">
                <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop&q=80" alt="Field services" className="absolute inset-0 w-full h-full object-cover rounded-lg shadow-xl" />
              </div>
              <div className="order-1 md:order-2">
                <h3 className="text-2xl font-bold mb-4">Field Services</h3>
                <p className="text-gray-600 mb-6">
                  Enable technicians and service professionals to collect payments on-site after completing jobs.
                </p>
                <ul className="space-y-3">
                  {[
                    "Accept payment at job completion",
                    "Digital invoicing",
                    "Photo attachments",
                    "Customer signatures",
                    "Service history tracking",
                    "Route optimization",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-cyan-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">Retail & Events</h3>
                <p className="text-gray-600 mb-6">
                  Ideal for retail stores, craft fairs, trade shows, and events where you need portable payment
                  processing.
                </p>
                <ul className="space-y-3">
                  {[
                    "Line busting during peak hours",
                    "Tableside payments",
                    "Product catalog",
                    "Customer loyalty programs",
                    "Split tender payments",
                    "Real-time inventory sync",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-cyan-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative h-[400px]">
                <img src="https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=800&h=600&fit=crop&q=80" alt="Retail events" className="absolute inset-0 w-full h-full object-cover rounded-lg shadow-xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hardware Options */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Choose Your Mobile Reader</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Flexible hardware options to fit your business needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 animate-fade-in">
            {[
              {
                name: "Card Reader",
                price: "$49",
                description: "Compact Bluetooth reader",
                features: ["Chip & swipe", "12-hour battery", "Bluetooth 5.0", "Pocket-sized"],
              },
              {
                name: "Tap Reader",
                price: "$79",
                description: "Contactless payment reader",
                features: ["NFC/contactless", "Chip & swipe", "15-hour battery", "Water resistant"],
              },
              {
                name: "All-in-One Terminal",
                price: "$199",
                description: "Complete mobile POS",
                features: ["Built-in printer", "Touchscreen display", "4G connectivity", "All payment types"],
              },
            ].map((hardware, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <h3 className="text-2xl font-bold mb-2">{hardware.name}</h3>
                  <div className="text-3xl font-bold text-cyan-600 mb-2">{hardware.price}</div>
                  <p className="text-gray-600 mb-6">{hardware.description}</p>
                  <ul className="space-y-2 mb-6">
                    {hardware.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-cyan-600" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full bg-cyan-600 hover:bg-cyan-700">Order Now</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-cyan-600 to-cyan-800 text-white animate-fade-in">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Ready to Go Mobile with Your Payments?</h2>
          <p className="text-xl text-cyan-50 mb-8 max-w-2xl mx-auto">
            Join thousands of mobile businesses already using everpay. Get started today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/demo">
              <Button size="lg" className="bg-white text-cyan-600 hover:bg-cyan-50">
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
