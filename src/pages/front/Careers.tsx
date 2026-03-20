import { SiteHeader } from "@/components/front/SiteHeader"
import { SiteFooter } from "@/components/front/SiteFooter"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
const departments = [
  {
    name: "Engineering",
    positions: [
      { title: "Senior Backend Engineer", location: "New York", type: "Full-time" },
      { title: "Frontend Developer", location: "Remote", type: "Full-time" },
      { title: "DevOps Engineer", location: "London", type: "Full-time" },
    ],
  },
  {
    name: "Product & Design",
    positions: [
      { title: "Product Manager", location: "Singapore", type: "Full-time" },
      { title: "UX Designer", location: "Remote", type: "Full-time" },
    ],
  },
  {
    name: "Sales & Marketing",
    positions: [
      { title: "Account Executive", location: "New York", type: "Full-time" },
      { title: "Marketing Manager", location: "London", type: "Full-time" },
      { title: "Sales Development Representative", location: "Singapore", type: "Full-time" },
    ],
  },
]

const benefits = [
  {
    title: "Health & Wellness",
    description: "Comprehensive health insurance, mental health support, and wellness programs",
  },
  {
    title: "Work-Life Balance",
    description: "Flexible working hours, remote work options, and unlimited PTO",
  },
  {
    title: "Growth & Development",
    description: "Learning stipend, conference attendance, and career development opportunities",
  },
  {
    title: "Equity",
    description: "Competitive equity package to share in the company's success",
  },
]

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-white via-green-50 to-white py-20 md:py-32 animate-fade-in">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1
                className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in-up"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                Join Our Mission to Transform Global Commerce
              </h1>
              <p
                className="text-lg md:text-xl text-gray-600 mb-8 animate-fade-in-up animation-delay-200"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                We're looking for exceptional people to help us build the future of payments.
              </p>
              <Button
                size="lg"
                className="bg-gray-900 hover:bg-gray-800 text-white rounded-full shadow-xl animate-fade-in-up animation-delay-400"
              >
                View Open Positions
              </Button>
            </div>
          </div>
        </section>

        {/* Culture Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="animate-fade-in-left">
                <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
                  Our Culture
                </h2>
                <p className="text-gray-600 mb-6 text-lg" style={{ fontFamily: "Inter, sans-serif" }}>
                  At everpay, we're building more than just a payment platform. We're creating an environment where
                  innovation thrives, ideas are valued, and people can do their best work.
                </p>
                <ul className="space-y-4">
                  {[
                    "Innovation and creativity are encouraged",
                    "Diverse and inclusive workplace",
                    "Focus on impact and results",
                    "Continuous learning and growth",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-[#1aa478]" />
                      <span style={{ fontFamily: "Inter, sans-serif" }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl animate-fade-in-right">
                <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80" alt="Team collaboration" className="absolute inset-0 w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <h2
              className="text-3xl md:text-4xl font-bold text-center mb-12 animate-fade-in-up"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Benefits & Perks
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className={`bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in-up`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <h3 className="text-xl font-semibold mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Open Positions */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2
              className="text-3xl md:text-4xl font-bold text-center mb-12 animate-fade-in-up"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Open Positions
            </h2>
            <div className="space-y-12">
              {departments.map((dept, index) => (
                <div key={index} className="animate-fade-in-up" style={{ animationDelay: `${index * 200}ms` }}>
                  <h3 className="text-2xl font-bold mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
                    {dept.name}
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dept.positions.map((position, posIndex) => (
                      <Link
                        key={posIndex}
                        to="#"
                        className="block p-6 rounded-2xl border-2 border-gray-200 hover:border-[#1aa478] transition-all duration-300 hover:shadow-xl"
                      >
                        <h4 className="font-semibold mb-2 text-lg" style={{ fontFamily: "Manrope, sans-serif" }}>
                          {position.title}
                        </h4>
                        <div className="text-sm text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>
                          <p>{position.location}</p>
                          <p>{position.type}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-[#1aa478] to-[#158f64]">
          <div className="container mx-auto px-4 text-center">
            <h2
              className="text-3xl md:text-4xl font-bold text-white mb-6 animate-fade-in-up"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Don't See the Right Role?
            </h2>
            <p
              className="text-white/90 mb-8 max-w-2xl mx-auto text-lg animate-fade-in-up animation-delay-200"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              We're always looking for talented people to join our team. Send us your resume and we'll keep you in mind
              for future opportunities.
            </p>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-[#1aa478] rounded-full animate-fade-in-up animation-delay-400"
            >
              Submit Your Resume
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
