import type React from "react"

import { useState } from "react"
import { SiteHeader } from "@/components/front/SiteHeader"
import { SiteFooter } from "@/components/front/SiteFooter"
import { CTASection } from "@/components/front/CtaSection"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle } from "lucide-react"

const countries = [
  "United States", "Canada", "United Kingdom", "Germany", "France", "Australia",
  "Japan", "Brazil", "India", "Mexico", "Spain", "Italy", "Netherlands", "Sweden",
  "Switzerland", "Singapore", "South Korea", "Pakistan", "Nigeria", "South Africa",
  "United Arab Emirates", "Saudi Arabia", "Other"
];

export default function DemoPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitMessage(null)

    const form = e.currentTarget
    const formData = new FormData(form)
    const data = {
      first_name: formData.get("firstName") as string,
      last_name: formData.get("lastName") as string,
      email: formData.get("email") as string,
      company: formData.get("company") as string,
      phone: formData.get("phone") as string,
      country: formData.get("country") as string,
      company_size: formData.get("companySize") as string,
      monthly_volume: formData.get("volume") as string,
      use_case: (formData.get("useCase") as string) || undefined,
      message: (formData.get("message") as string) || undefined,
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-transactional-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          to: 'sales@everpayinc.com',
          subject: `Demo Request from ${data.first_name} ${data.last_name} - ${data.company}`,
          html: `<h2>New Demo Request</h2>
            <p><strong>Name:</strong> ${data.first_name} ${data.last_name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Company:</strong> ${data.company}</p>
            <p><strong>Phone:</strong> ${data.phone}</p>
            <p><strong>Country:</strong> ${data.country}</p>
            <p><strong>Company Size:</strong> ${data.company_size}</p>
            <p><strong>Monthly Volume:</strong> ${data.monthly_volume}</p>
            ${data.use_case ? `<p><strong>Use Case:</strong> ${data.use_case}</p>` : ''}
            ${data.message ? `<p><strong>Message:</strong> ${data.message}</p>` : ''}`,
        }),
      })

      setSubmitMessage({
        type: "success",
        message: "Thank you for your interest! Our team will reach out within 24 hours to schedule your personalized demo.",
      })
      e.currentTarget.reset()
    } catch {
      setSubmitMessage({
        type: "success",
        message: "Thank you for your interest! Our team will reach out within 24 hours to schedule your personalized demo.",
      })
      e.currentTarget.reset()
    }

    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-white via-green-50 to-white py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-16 items-start">
                {/* Left Column - Info */}
                <div className="lg:sticky lg:top-24">
                  <h1
                    className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 animate-fade-in-up"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    See everpay in action
                  </h1>
                  <p
                    className="text-lg text-gray-600 mb-8 animate-fade-in-up animation-delay-200"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Schedule a personalized demo with our payments experts to learn how everpay can help your business
                    grow.
                  </p>

                  <div className="space-y-6 mb-8">
                    {[
                      {
                        title: "Personalized walkthrough",
                        description: "See how everpay works for your specific business needs and use cases",
                      },
                      {
                        title: "Technical deep dive",
                        description: "Learn about our APIs, integrations, and customization options",
                      },
                      {
                        title: "Q&A with experts",
                        description: "Get answers to your questions from our payment specialists",
                      },
                      {
                        title: "Custom pricing",
                        description: "Discover pricing options tailored to your transaction volume",
                      },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 animate-fade-in-left"
                        style={{ animationDelay: `${(index + 3) * 100}ms` }}
                      >
                        <CheckCircle className="h-6 w-6 text-[#1aa478] flex-shrink-0 mt-1" />
                        <div>
                          <h3
                            className="font-semibold text-gray-900 mb-1"
                            style={{ fontFamily: "Manrope, sans-serif" }}
                          >
                            {item.title}
                          </h3>
                          <p className="text-gray-600 text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Trust Indicators */}
                  <div className="border-t border-gray-200 pt-8">
                    <p className="text-sm text-gray-500 mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
                      Trusted by thousands of businesses worldwide
                    </p>
                    <div className="flex flex-wrap gap-4 items-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#1aa478]">99.99%</div>
                        <div className="text-xs text-gray-600">Uptime</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#1aa478]">$2B+</div>
                        <div className="text-xs text-gray-600">Processed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#1aa478]">50K+</div>
                        <div className="text-xs text-gray-600">Merchants</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#1aa478]">150+</div>
                        <div className="text-xs text-gray-600">Countries</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Form */}
                <div className="lg:sticky lg:top-24">
                  <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 animate-fade-in-right">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
                      Request a demo
                    </h2>

                    {submitMessage && (
                      <div
                        className={`mb-6 p-4 rounded-lg ${submitMessage.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
                      >
                        {submitMessage.message}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Name Fields */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="firstName"
                            className="block text-sm font-medium text-gray-700 mb-2"
                            style={{ fontFamily: "Inter, sans-serif" }}
                          >
                            First name *
                          </label>
                          <Input
                            id="firstName"
                            name="firstName"
                            type="text"
                            required
                            className="w-full rounded-lg"
                            placeholder="John"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="lastName"
                            className="block text-sm font-medium text-gray-700 mb-2"
                            style={{ fontFamily: "Inter, sans-serif" }}
                          >
                            Last name *
                          </label>
                          <Input
                            id="lastName"
                            name="lastName"
                            type="text"
                            required
                            className="w-full rounded-lg"
                            placeholder="Doe"
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-700 mb-2"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          Work email *
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          className="w-full rounded-lg"
                          placeholder="john@company.com"
                        />
                      </div>

                      {/* Company */}
                      <div>
                        <label
                          htmlFor="company"
                          className="block text-sm font-medium text-gray-700 mb-2"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          Company name *
                        </label>
                        <Input
                          id="company"
                          name="company"
                          type="text"
                          required
                          className="w-full rounded-lg"
                          placeholder="Company Inc."
                        />
                      </div>

                      {/* Phone */}
                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-sm font-medium text-gray-700 mb-2"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          Phone number *
                        </label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          required
                          className="w-full rounded-lg"
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>

                      {/* Country */}
                      <div>
                        <label
                          htmlFor="country"
                          className="block text-sm font-medium text-gray-700 mb-2"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          Country *
                        </label>
                        <select
                          id="country"
                          name="country"
                          required
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1aa478] focus:border-transparent"
                        >
                          <option value="">Select a country</option>
                          {countries.map((country) => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Company Size */}
                      <div>
                        <label
                          htmlFor="companySize"
                          className="block text-sm font-medium text-gray-700 mb-2"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          Company size *
                        </label>
                        <select
                          id="companySize"
                          name="companySize"
                          required
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1aa478] focus:border-transparent"
                        >
                          <option value="">Select company size</option>
                          <option value="1-10">1-10 employees</option>
                          <option value="11-50">11-50 employees</option>
                          <option value="51-200">51-200 employees</option>
                          <option value="201-500">201-500 employees</option>
                          <option value="501-1000">501-1000 employees</option>
                          <option value="1000+">1000+ employees</option>
                        </select>
                      </div>

                      {/* Monthly Volume */}
                      <div>
                        <label
                          htmlFor="volume"
                          className="block text-sm font-medium text-gray-700 mb-2"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          Estimated monthly payment volume *
                        </label>
                        <select
                          id="volume"
                          name="volume"
                          required
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1aa478] focus:border-transparent"
                        >
                          <option value="">Select volume range</option>
                          <option value="0-10k">$0 - $10,000</option>
                          <option value="10k-50k">$10,000 - $50,000</option>
                          <option value="50k-100k">$50,000 - $100,000</option>
                          <option value="100k-500k">$100,000 - $500,000</option>
                          <option value="500k-1m">$500,000 - $1M</option>
                          <option value="1m+">$1M+</option>
                        </select>
                      </div>

                      {/* Use Case */}
                      <div>
                        <label
                          htmlFor="useCase"
                          className="block text-sm font-medium text-gray-700 mb-2"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          Primary use case
                        </label>
                        <select
                          id="useCase"
                          name="useCase"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1aa478] focus:border-transparent"
                        >
                          <option value="">Select a use case</option>
                          <option value="ecommerce">E-commerce</option>
                          <option value="saas">SaaS & Subscriptions</option>
                          <option value="marketplace">Marketplace</option>
                          <option value="retail">Retail / POS</option>
                          <option value="restaurant">Restaurant</option>
                          <option value="fintech">Fintech</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      {/* Message */}
                      <div>
                        <label
                          htmlFor="message"
                          className="block text-sm font-medium text-gray-700 mb-2"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          Tell us about your needs (optional)
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          rows={4}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1aa478] focus:border-transparent resize-none"
                          placeholder="Tell us more about your payment needs..."
                        />
                      </div>

                      {/* Consent */}
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="consent"
                          name="consent"
                          required
                          className="mt-1 h-4 w-4 text-[#1aa478] focus:ring-[#1aa478] border-gray-300 rounded"
                        />
                        <label
                          htmlFor="consent"
                          className="text-sm text-gray-600"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          I agree to receive communications from everpay and understand that I can opt out at any time.
                          View our{" "}
                          <a href="/privacy-policy" className="text-[#1aa478] hover:underline">
                            Privacy Policy
                          </a>
                          .
                        </label>
                      </div>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        size="lg"
                        disabled={isSubmitting}
                        className="w-full bg-[#1aa478] hover:bg-[#158f64] text-white rounded-full shadow-lg text-base font-semibold disabled:opacity-50"
                      >
                        {isSubmitting ? "Submitting..." : "Request Demo"}
                      </Button>

                      <p className="text-xs text-center text-gray-500" style={{ fontFamily: "Inter, sans-serif" }}>
                        By submitting this form, you agree to our{" "}
                        <a href="/terms" className="text-[#1aa478] hover:underline">
                          Terms of Service
                        </a>
                      </p>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2
              className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Frequently asked questions
            </h2>
            <div className="space-y-6">
              {[
                {
                  question: "How long does the demo take?",
                  answer:
                    "A typical demo lasts 30-45 minutes. We'll tailor it to your specific needs and use cases, so the length may vary.",
                },
                {
                  question: "What should I prepare for the demo?",
                  answer:
                    "Come with questions about your payment needs! It helps to have an idea of your transaction volume, business model, and any specific integration requirements.",
                },
                {
                  question: "Will I see pricing during the demo?",
                  answer:
                    "Yes! We'll discuss pricing options based on your transaction volume and business needs. Our team will work with you to find the best plan for your company.",
                },
                {
                  question: "Can I bring my technical team?",
                  answer:
                    "We encourage having your technical team join the demo so they can ask questions about our APIs, integrations, and technical capabilities.",
                },
                {
                  question: "What happens after the demo?",
                  answer:
                    "After the demo, you'll receive a follow-up email with resources, documentation, and next steps. Our team will be available to answer any additional questions.",
                },
              ].map((faq, index) => (
                <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                  <h3
                    className="text-lg font-semibold text-gray-900 mb-2"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    {faq.question}
                  </h3>
                  <p className="text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <CTASection />
      <SiteFooter />
    </div>
  )
}
