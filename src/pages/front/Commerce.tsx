import { SiteHeader } from "@/components/front/SiteHeader"
import { SiteFooter } from "@/components/front/SiteFooter"
import { CTASection } from "@/components/front/CtaSection"
import { Button } from "@/components/ui/button"
import { ChevronRight, Globe, ShoppingCart, CreditCard, BarChart } from 'lucide-react'

import { Link } from "react-router-dom"

export default function CommercePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-[#0A2F2F] text-white animate-fade-in">
          <div className="container mx-auto px-4 py-20">
            <div className="max-w-4xl">
              <h1 className="text-5xl font-bold mb-6">Commerce</h1>
              <p className="text-xl text-gray-300 mb-8">
                Sell anywhere and get paid anytime with flexible <span className="text-[#4CAF50]">omnichannel</span>{" "}
                commerce tools. Connect and customize all parts of your business so you can open up to more customers in
                more places.
              </p>
              <div className="flex gap-4">
                <Button size="lg" className="bg-[#4CAF50] hover:bg-[#45a049]">
                  Get started
                </Button>
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                  Contact sales
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 animate-fade-in">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  title: "In-Store Payments",
                  description: "Accept all payment types with our secure POS system",
                  icon: CreditCard,
                  image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d",
                  link: "/commerce/pos",
                },
                {
                  title: "Online Store",
                  description: "Build and customize your online presence",
                  icon: Globe,
                  image: "https://images.unsplash.com/photo-1531973576160-7125cd663d86",
                  link: "/commerce/online",
                },
                {
                  title: "Inventory Management",
                  description: "Track and manage your inventory across all channels",
                  icon: ShoppingCart,
                  image: "https://images.unsplash.com/photo-1553413077-190dd305871c",
                  link: "/commerce/inventory",
                },
                {
                  title: "Analytics & Reporting",
                  description: "Get real-time insights into your business performance",
                  icon: BarChart,
                  image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71",
                  link: "/commerce/analytics",
                },
              ].map((feature, index) => (
                <Link
                  key={index}
                  to={feature.link}
                  className="group relative overflow-hidden rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="relative z-10">
                    <div className="mb-4 inline-block rounded-lg bg-[#4CAF50]/10 p-3">
                      <feature.icon className="h-6 w-6 text-[#4CAF50]" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                    <p className="mb-4 text-gray-600">{feature.description}</p>
                    <div className="flex items-center text-[#4CAF50]">
                      Learn more <ChevronRight className="ml-1 h-4 w-4" />
                    </div>
                  </div>
                  <div className="absolute inset-0 -z-10 opacity-0 transition-opacity group-hover:opacity-5">
                    <img
                      src={feature.image || "/placeholder.svg"}
                      alt={feature.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Integration Section */}
        <section className="bg-gray-50 py-20 animate-fade-in">
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

        {/* Testimonial Section */}
        <section className="py-20 animate-fade-in">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="mb-8">
                <img src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=120&h=40&fit=crop" alt="Customer logo" width={120} height={40} className="mx-auto" />
              </div>
              <blockquote className="text-2xl font-medium mb-8">
                "Everpay's commerce platform has transformed how we run our business. The ability to sell across
                multiple channels while managing everything from one place has been game-changing."
              </blockquote>
              <div>
                <div className="font-semibold">Stan Sterling</div>
                <div className="text-gray-600">CEO, Sterling Capital LLC.</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-[#0A2F2F] text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to grow your business?</h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of businesses using Everpay's commerce platform to reach more customers and increase sales.
            </p>
            <div className="flex justify-center gap-4">            
              <Link to="/signup">
                <Button size="lg" className="bg-[#4CAF50] hover:bg-[#45a049]">
                  Get started
                </Button>
              </Link>
            <Link to="/contact">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                Talk to sales
              </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <CTASection />
      <SiteFooter />
    </div>
  )
}
