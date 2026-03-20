import { SiteHeader } from "@/components/front/SiteHeader"
import { SiteFooter } from "@/components/front/SiteFooter"
import { Button } from "@/components/ui/button"
import { Globe, Smartphone, ShieldCheck, CheckCircle } from "lucide-react"

import { Link } from "react-router-dom"

const features = [
  {
    title: "Global Payment Methods",
    description: "Accept payments from customers anywhere with support for multiple payment methods and currencies",
    icon: Globe,
    items: ["Credit & debit cards", "Digital wallets", "Bank transfers", "Buy now, pay later"],
  },
  {
    title: "Mobile Optimized",
    description: "Seamless checkout experience across all devices with mobile-first design",
    icon: Smartphone,
    items: ["Responsive design", "One-click payments", "Digital wallets", "SMS payments"],
  },
  {
    title: "Advanced Security",
    description: "Enterprise-grade security with fraud prevention and compliance built-in",
    icon: ShieldCheck,
    items: ["PCI DSS compliance", "3D Secure 2.0", "Tokenization", "Fraud detection"],
  },
]

export default function OnlinePaymentsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0A2F2F]">
      <SiteHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg- bg-gradient-to-br from-white via-green-50 to-white py-20 md:py-32 animate-fade-in text-gray-900">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl font-bold mb-6">Accept Payments Online</h1>
                <p className="text-xl text-gray-300 mb-8">
                  Everything you need to accept payments online. Simple integration, optimized checkout, and powerful
                  features to grow your business.
                </p>
                <div className="flex gap-4">
                <Link to="/signup">
                  <Button size="lg" className="bg-[#4CAF50] hover:bg-[#45a049]">
                    Start Now
                  </Button>
                </Link>
              <Link to="/contact">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-green bg-transparent text-green hover:bg-white/10"
                  >
                    Contact Sales
                  </Button>
                </Link>
                </div>
              </div>
              <div className="relative h-[400px] rounded-lg overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=500&fit=crop"
                  alt="Online Payments"
                  width={600}
                  height={400}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="space-y-20">
              {features.map((feature, index) => (
                <div key={index} className="grid md:grid-cols-2 gap-12 items-center">
                  <div className={index % 2 === 1 ? "md:order-2" : ""}>
                    <feature.icon className="h-12 w-12 text-[#4CAF50] mb-6" />
                    <h2 className="text-3xl font-bold mb-4">{feature.title}</h2>
                    <p className="text-gray-600 mb-6">{feature.description}</p>
                    <ul className="space-y-3">
                      {feature.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-[#4CAF50]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div
                    className={`relative h-[400px] rounded-lg overflow-hidden ${index % 2 === 1 ? "md:order-1" : ""}`}
                  >
                    <img
                      src={[
                        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop",
                        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
                        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
                      ][index % 3]}
                      alt={feature.title}
                      width={600}
                      height={400}
                      className="object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Integration Section */}
        <section className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Simple Integration</h2>
              <p className="text-gray-600">Get up and running quickly with our developer-friendly APIs and SDKs.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Direct API",
                  description: "RESTful APIs with comprehensive documentation",
                  code: "curl -X POST https://api.everpay.com/v1/payments \\\n-d amount=2000 \\\n-d currency=usd",
                },
                {
                  title: "SDKs & Libraries",
                  description: "Native SDKs for major programming languages",
                  code: "npm install @everpay/js\n\nconst payment = await everpay.createPayment({\n  amount: 2000,\n  currency: 'usd'\n});",
                },
                {
                  title: "No-Code Solutions",
                  description: "Payment links and embeddable checkout",
                  code: '<script src="https://js.everpay.com/v1"></script>\n\n<div id="checkout"></div>',
                },
              ].map((integration, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold mb-2">{integration.title}</h3>
                  <p className="text-gray-600 mb-4">{integration.description}</p>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{integration.code}</code>
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
              <p className="text-gray-600">No hidden fees. Pay only for what you use with our competitive pricing.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {[
                {
                  title: "Standard",
                  price: "2.9% + $0.30",
                  description: "Per successful card charge",
                  features: ["All major cards accepted", "Instant setup", "24/7 support", "No monthly fees"],
                },
                {
                  title: "Enterprise",
                  price: "Custom",
                  description: "For high-volume businesses",
                  features: ["Volume discounts", "Dedicated support", "Custom integration", "Free fraud prevention"],
                },
              ].map((plan, index) => (
                <div key={index} className="border rounded-lg p-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.title}</h3>
                  <div className="text-4xl font-bold text-[#4CAF50] mb-2">{plan.price}</div>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-[#4CAF50]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full bg-[#4CAF50] hover:bg-[#45a049]">Get Started</Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-[#0A2F2F] text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to start accepting payments?</h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of businesses using Everpay to power their online payments.
            </p>
            <div className="flex justify-center gap-4">
               <Link to="https://app.everpayinc.com/sign-up">
              <Button size="lg" className="bg-[#4CAF50] hover:bg-[#45a049]">
                Create Account
              </Button>
                 </Link>
               <Link to="/contact">
              <Button variant="outline" size="lg" className="border-white bg-transparent text-white hover:bg-white/10">
                Contact Sales
              </Button>
                 </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
