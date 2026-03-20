import { SiteHeader } from "@/components/front/SiteHeader"
import { SiteFooter } from "@/components/front/SiteFooter"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle, Users, Building, Globe } from 'lucide-react'

import { Link } from "react-router-dom"

const partnerTypes = [
  {
    title: "Technology Partners",
    description: "Integrate your solutions with our payment infrastructure",
    icon: Globe,
    benefits: ["Access to payment APIs", "Technical documentation", "Integration support", "Testing environment"],
  },
  {
    title: "Solution Partners",
    description: "Build and implement payment solutions for your clients",
    icon: Building,
    benefits: ["Partner portal access", "Revenue sharing", "Sales enablement", "Joint marketing"],
  },
  {
    title: "Strategic Partners",
    description: "Create innovative payment experiences together",
    icon: Users,
    benefits: ["Custom solutions", "Dedicated support", "Co-marketing opportunities", "Priority features"],
  },
]

const featuredPartners = [
  {
    name: "Shopify",
    type: "E-commerce",
    description: "Integrated payment solutions for online stores",
    logo: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&h=200&fit=crop",
  },
  {
    name: "Salesforce",
    type: "CRM",
    description: "Seamless payment processing in CRM workflows",
    logo: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=200&fit=crop",
  },
  {
    name: "QuickBooks",
    type: "Accounting",
    description: "Automated payment reconciliation",
    logo: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=200&fit=crop",
  },
]

export default function PartnersPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-[#0A2F2F] text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold mb-6">Partner with Everpay</h1>
              <p className="text-xl text-gray-300 mb-8">
                Join our partner ecosystem to build innovative payment solutions and grow your business with
                industry-leading payment technology.
              </p>
              <div className="flex gap-4">
                <Button size="lg" className="bg-[#4CAF50] hover:bg-[#45a049]">
                  Become a Partner
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white bg-transparent text-white hover:bg-white/10"
                >
                  Partner Directory
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Partner Types */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Partnership Programs</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {partnerTypes.map((type, index) => (
                <div key={index} className="p-6 border rounded-lg bg-white shadow-sm">
                  <type.icon className="h-12 w-12 text-[#4CAF50] mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{type.title}</h3>
                  <p className="text-gray-600 mb-6">{type.description}</p>
                  <ul className="space-y-3">
                    {type.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-[#4CAF50]" />
                        <span className="text-gray-600">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="link" className="mt-6 p-0">
                    Learn more <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Partners */}
        <section className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Featured Partners</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {featuredPartners.map((partner, index) => (
                <Link
                  key={index}
                  to="#"
                  className="block p-6 bg-white rounded-lg border transition-shadow hover:shadow-md"
                >
                  <div className="h-16 relative mb-4">
                    <img
                      src={partner.logo || "/placeholder.svg"}
                      alt={partner.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-[#4CAF50] font-medium">{partner.type}</div>
                    <h3 className="text-xl font-semibold">{partner.name}</h3>
                    <p className="text-gray-600">{partner.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Why Partner with Everpay?</h2>
                <div className="space-y-6">
                  {[
                    {
                      title: "Market Reach",
                      description: "Access millions of businesses worldwide through our platform.",
                    },
                    {
                      title: "Technical Support",
                      description: "Get dedicated integration support and technical resources.",
                    },
                    {
                      title: "Revenue Growth",
                      description: "Unlock new revenue streams with competitive revenue sharing.",
                    },
                    {
                      title: "Innovation",
                      description: "Build on cutting-edge payment technology and infrastructure.",
                    },
                  ].map((benefit, index) => (
                    <div key={index} className="flex gap-4">
                      <CheckCircle className="h-6 w-6 text-[#4CAF50] flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold mb-1">{benefit.title}</h3>
                        <p className="text-gray-600">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative h-[400px] rounded-lg overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=500&fit=crop"
                  alt="Partnership benefits"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-[#0A2F2F] text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Partner?</h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Join our partner ecosystem and let's build the future of payments together.
            </p>
            <div className="flex justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="bg-[#4CAF50] hover:bg-[#45a049]">
                  Apply Now
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="border-white bg-transparent text-white hover:bg-white/10">
                  Contact Partner Team
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
