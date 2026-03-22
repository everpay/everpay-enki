import type React from "react"

import { useState } from "react"
import { trackFormSubmission } from "@/lib/posthog-events"
import { SiteHeader } from "@/components/front/SiteHeader"
import { SiteFooter } from "@/components/front/SiteFooter"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Phone, MapPin } from "lucide-react"


export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [inquiryType, setInquiryType] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitMessage(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      first_name: formData.get("firstName") as string,
      last_name: formData.get("lastName") as string,
      email: formData.get("email") as string,
      company: (formData.get("company") as string) || undefined,
      inquiry_type: inquiryType,
      message: formData.get("message") as string,
    }

    trackFormSubmission('contact_form', 6, { inquiry_type: inquiryType });
    const result = { success: true, message: 'Thank you! We will be in touch shortly.' }

    setSubmitMessage({
      type: result.success ? "success" : "error",
      message: result.message,
    })

    setIsSubmitting(false)

    if (result.success) {
      e.currentTarget.reset()
      setInquiryType("")
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-white via-green-50 to-white py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1
                className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in-up"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                Get in Touch
              </h1>
              <p
                className="text-lg md:text-xl text-gray-600 animate-fade-in-up animation-delay-200"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Have questions about our products or services? We're here to help.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Options */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="text-center p-8 rounded-2xl border-2 border-gray-200 hover:border-[#1aa478] transition-all duration-300 hover:shadow-xl animate-fade-in-up">
                <Mail className="w-12 h-12 text-[#1aa478] mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>
                  Email Us
                </h3>
                <p className="text-gray-600 mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
                  For general inquiries and support
                </p>
                <a
                  href="mailto:hello@everpayinc.com"
                  className="text-[#1aa478] hover:underline font-medium"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  hello@everpayinc.com
                </a>
              </div>
              <div className="text-center p-8 rounded-2xl border-2 border-gray-200 hover:border-[#1aa478] transition-all duration-300 hover:shadow-xl animate-fade-in-up animation-delay-200">
                <Phone className="w-12 h-12 text-[#1aa478] mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>
                  Call Us
                </h3>
                <p className="text-gray-600 mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
                  Mon-Fri, 9am-6pm EST
                </p>
                <a
                  href="tel:+18765254398"
                  className="text-[#1aa478] hover:underline font-medium"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  1-876-525-4398
                </a>
              </div>
              <div className="text-center p-8 rounded-2xl border-2 border-gray-200 hover:border-[#1aa478] transition-all duration-300 hover:shadow-xl animate-fade-in-up animation-delay-400">
                <MapPin className="w-12 h-12 text-[#1aa478] mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>
                  Visit Us
                </h3>
                <p className="text-gray-600 mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
                  Our headquarters
                </p>
                <address className="text-[#1aa478] not-italic font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
                  4711 Yonge Street, 10th Floor
                  <br />
                  Toronto, ON, M2N 6K8, CA
                </address>
              </div>
            </div>

            {/* Contact Form */}
            <div className="max-w-2xl mx-auto animate-fade-in-up animation-delay-600">
              <h2
                className="text-3xl md:text-4xl font-bold text-center mb-8"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                Send Us a Message
              </h2>

              {submitMessage && (
                <div
                  className={`mb-6 p-4 rounded-lg ${submitMessage.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
                >
                  {submitMessage.message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6 bg-gray-50 p-8 rounded-2xl shadow-lg">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
                      First Name *
                    </label>
                    <Input type="text" name="firstName" placeholder="John" required className="rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
                      Last Name *
                    </label>
                    <Input type="text" name="lastName" placeholder="Doe" required className="rounded-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
                    Email *
                  </label>
                  <Input type="email" name="email" placeholder="john@example.com" required className="rounded-full" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
                    Company
                  </label>
                  <Input type="text" name="company" placeholder="Your company name" className="rounded-full" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
                    Inquiry Type *
                  </label>
                  <Select value={inquiryType} onValueChange={setInquiryType} required>
                    <SelectTrigger className="rounded-full">
                      <SelectValue placeholder="Select an inquiry type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales Inquiry</SelectItem>
                      <SelectItem value="support">Technical Support</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
                    Message *
                  </label>
                  <Textarea name="message" placeholder="How can we help you?" className="h-32 rounded-2xl" required />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full shadow-lg disabled:opacity-50"
                  size="lg"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
