import { SiteHeader } from "@/components/front/SiteHeader"
import { SiteFooter } from "@/components/front/SiteFooter"
import { Button } from "@/components/ui/button"
import {
  DollarSign,
  Zap,
  Clock,
  ShieldCheck,
  TrendingUp,
  Users,
  CheckCircle,
  ArrowRight,
  BarChart3,
  RefreshCw,
  Banknote,
  Star,
  ChevronDown,
} from "lucide-react"
import { Link } from "react-router-dom"

import { useState } from "react"

const trustBadges = [
  { icon: Star, label: "A+ Rating", sub: "on Better Business Bureau" },
  { icon: Users, label: "Over 10,000", sub: "businesses funded through Everpay" },
]

const highlights = [
  {
    icon: Zap,
    title: "Speed First",
    description:
      "Get funded in less than 24 hours. We move at the speed of your business so you never miss a growth window.",
  },
  {
    icon: DollarSign,
    title: "Offers On Your Terms",
    description:
      "One size doesn't fit all. We always provide multiple offers so you can choose what works best for your cash flow.",
  },
  {
    icon: ShieldCheck,
    title: "Equity Free",
    description:
      "Don't give away a stake in your business just to keep up. Everpay Capital is revenue-based financing, not an equity investment.",
  },
  {
    icon: Users,
    title: "Personalized Support",
    description:
      "Every call matters to our dedicated team. You'll have direct access to real people who understand your business.",
  },
]

const testimonials = [
  {
    quote:
      "Everpay Capital simplified our cash flow by automating everything: easy to request, set it and forget it payments -- quick and fast!",
    name: "Sarah M.",
    title: "Founder, Greenleaf Goods",
  },
  {
    quote:
      "The process is very straightforward and easy to navigate. I had funds in my account within a day of final approval.",
    name: "Adam B.",
    title: "CEO, Spectrum Digital",
  },
  {
    quote:
      "Applied, got our offer, and had cash in our bank account within 24 hours. The team was very professional and helped me deploy the cash to effectively grow our business.",
    name: "Nick J.",
    title: "Founder, Coastal Commerce",
  },
  {
    quote:
      "Everpay Capital offered the perfect solution with revenue-based financing to secure the capital we needed to invest in inventory and pay it back at a reasonable time frame once we made sales.",
    name: "Jeremy K.",
    title: "Founder, Kindfolk Supply",
  },
]

const customerStats = [
  { value: "+73%", label: "Customer revenue growth 180 days after funding" },
  { value: "75%", label: "of customers who come back for a second round" },
]

const eligibility = [
  "Have a registered business entity (LLC, S-Corp, C-Corp, etc.)",
  "At least $3,000 in average monthly sales processed through Everpay",
  "No minimum months in business required",
  "Selling through one of our supported platforms or directly via Everpay",
]

const steps = [
  {
    step: "01",
    time: "1 min",
    title: "Get your initial estimate",
    description:
      "With just a few quick questions, we'll provide an estimate for how much funding you could get. No commitment, no credit check.",
  },
  {
    step: "02",
    time: "5 mins",
    title: "Securely connect your store",
    description:
      "Connect your store with the highest security and privacy standards. We'll review your sales history to create a customized offer.",
  },
  {
    step: "03",
    time: "<24 hrs",
    title: "Receive your funds",
    description:
      "You know your business best, so we'll provide multiple offers. Choose the one that works, and receive funds in as little as 24 hours.",
  },
]

const useCases = [
  {
    title: "Stock up on inventory",
    description:
      "Purchase inventory ahead of peak seasons without draining your cash reserves. Stay stocked and ready to sell.",
    icon: BarChart3,
  },
  {
    title: "Scale your marketing",
    description:
      "Invest in customer acquisition campaigns that drive measurable revenue growth. More visibility, more sales.",
    icon: TrendingUp,
  },
  {
    title: "Expand operations",
    description:
      "Open new locations, hire key staff, or upgrade equipment. Put capital to work where it has the biggest impact.",
    icon: Users,
  },
  {
    title: "Manage cash flow",
    description:
      "Bridge the gap between expenses and incoming payments. Keep operations running smoothly through any season.",
    icon: Banknote,
  },
]

const faqs = [
  {
    question: "Do I have to be an eCommerce business to apply?",
    answer:
      "While we primarily work with eCommerce and online sellers, Everpay Capital is available to any merchant processing payments through Everpay. This includes online stores, marketplaces, subscription businesses, and brick-and-mortar retailers using Everpay's payment solutions.",
  },
  {
    question: "What can I use my funds on?",
    answer:
      "As the owner of your business, you know your business best. Use your funds on inventory, shipping and logistics, marketing spend, hiring, equipment, or anything else that would help grow your business and drive sales. We're always happy to strategize with you!",
  },
  {
    question: "How do I repay?",
    answer:
      "Your payments sync with your sales -- you'll never have to worry about your ability to repay during a slower month. You pay us when you receive sales deposits. A small percentage of each deposit goes toward your balance automatically.",
  },
  {
    question: "How do you determine my offer?",
    answer:
      "We evaluate your sales history, cash flow needs, and existing debt positions to make you an offer that fits your cash flow capability. We structure your financing to ensure you're not putting your business at risk with too much debt. That's why we always provide multiple offers.",
  },
  {
    question: "How long does it take to get pre-qualified?",
    answer:
      "Signing up and connecting your store takes only a few minutes and allows us to get you a pre-qualification offer. In just a few more minutes, you complete the qualification process by connecting your bank. Most merchants are pre-qualified within minutes.",
  },
  {
    question: "Is there a commitment?",
    answer:
      "Any Everpay merchant can sign up, connect their store, and receive a pre-qualified offer with zero obligation. You're not locked into anything until you formally accept an offer.",
  },
  {
    question: "How fast will I receive my funds?",
    answer:
      "We know business moves fast, and so do we. Once you complete the qualification process and accept your offer, we'll have your cash in your bank account within hours. ACH processing times can vary, but most merchants receive funds within 24 hours.",
  },
  {
    question: "Will applying affect my credit score?",
    answer:
      "No. Everpay Capital does not require a personal credit check. We're a modern lender that bases our lending decisions on your business performance data and Everpay processing history. Your personal credit score is never affected.",
  },
  {
    question: "Can I pay off my balance early?",
    answer:
      "Yes. You can make additional payments or pay the entire balance at any time with no early repayment penalty. There are no hidden fees, period.",
  },
]

export default function FundingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-white pt-20 pb-24 md:pt-28 md:pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1aa478]/5 via-transparent to-transparent" />
          <div className="container mx-auto px-6 relative">
            <div className="max-w-[820px] mx-auto text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#1aa478]/20 bg-[#1aa478]/5 px-4 py-1.5 mb-8">
                <DollarSign className="h-4 w-4 text-[#1aa478]" />
                <span className="text-sm font-semibold text-[#1aa478]" style={{ fontFamily: "Inter, sans-serif" }}>
                  Everpay Capital
                </span>
              </div>

              <h1
                className="text-4xl md:text-[56px] lg:text-[64px] font-extrabold text-gray-900 leading-[1.08] tracking-tight mb-6"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                Funding at the{" "}
                <span className="text-[#1aa478]">speed</span> of your business
              </h1>

              <p
                className="text-lg md:text-xl text-gray-500 max-w-[620px] mx-auto mb-10 leading-relaxed"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Get the capital you need to grow -- without the hassle of traditional loans.
                Apply in minutes, get funded in hours, and repay automatically as a percentage of your sales.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Link to="/demo">
                  <Button
                    size="lg"
                    className="bg-[#1aa478] hover:bg-[#158f68] text-white rounded-full px-8 h-12 text-base font-semibold shadow-none min-w-[200px]"
                  >
                    Get funded
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-gray-200 bg-transparent text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-full px-8 h-12 text-base font-semibold shadow-none min-w-[200px]"
                  >
                    Talk to our team
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Trust badges */}
        <section className="py-12 bg-gray-50 border-y border-gray-100">
          <div className="container mx-auto px-6">
            <p
              className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-8"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Merchants trust Everpay
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-12">
              {trustBadges.map((badge, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1aa478]/10 flex items-center justify-center">
                    <badge.icon className="h-5 w-5 text-[#1aa478]" />
                  </div>
                  <div>
                    <span className="text-lg font-bold text-gray-900" style={{ fontFamily: "Manrope, sans-serif" }}>
                      {badge.label}
                    </span>
                    <p className="text-sm text-gray-500" style={{ fontFamily: "Inter, sans-serif" }}>{badge.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Highlights */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {highlights.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-lg hover:border-[#1aa478]/20 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#1aa478]/10 flex items-center justify-center mb-5">
                    <item.icon className="h-6 w-6 text-[#1aa478]" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>
                    {item.title}
                  </h3>
                  <p className="text-gray-500 text-[15px] leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Customer Stats + Testimonials */}
        <section className="py-24 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="max-w-[700px] mx-auto text-center mb-16">
              <h2
                className="text-3xl md:text-[42px] font-bold text-gray-900 leading-tight mb-4"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                {"Don't just take our "}
                <span className="text-[#1aa478]">word</span> for it
              </h2>
              <p className="text-gray-500 text-lg" style={{ fontFamily: "Inter, sans-serif" }}>
                See what our merchants have to say about Everpay Capital.
              </p>
            </div>

            {/* Stats row */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-12 mb-16">
              {customerStats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div
                    className="text-5xl md:text-6xl font-extrabold text-[#1aa478] mb-2"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    {stat.value}
                  </div>
                  <p className="text-gray-500 text-sm max-w-[260px] mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Testimonials grid */}
            <div className="grid md:grid-cols-2 gap-6 max-w-[900px] mx-auto">
              {testimonials.map((t, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm"
                >
                  <p className="text-gray-700 text-[15px] leading-relaxed mb-6 italic" style={{ fontFamily: "Inter, sans-serif" }}>
                    {`"${t.quote}"`}
                  </p>
                  <div>
                    <p className="text-sm font-bold text-gray-900" style={{ fontFamily: "Manrope, sans-serif" }}>{t.name}</p>
                    <p className="text-sm text-gray-400" style={{ fontFamily: "Inter, sans-serif" }}>{t.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who We Fund */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-[960px] mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2
                    className="text-3xl md:text-[42px] font-bold text-gray-900 leading-tight mb-6"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    Who we <span className="text-[#1aa478]">fund</span>
                  </h2>
                  <p className="text-gray-500 text-base mb-8 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                    Flexible minimum requirements for merchants of all sizes. No personal credit check required.
                  </p>
                  <ul className="space-y-4 mb-8">
                    {eligibility.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-[#1aa478] mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-[15px] leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/demo">
                    <Button className="bg-[#1aa478] hover:bg-[#158f68] text-white rounded-full px-8 h-11 text-[15px] font-semibold shadow-none">
                      Get funded
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <div className="relative h-[400px] rounded-2xl overflow-hidden">
                  <img
                    src="/modern-pos-terminal-payment-system.jpg"
                    alt="Business owner reviewing funding options"
                    className="absolute inset-0 w-full h-full object-cover"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="max-w-[600px] mx-auto text-center mb-16">
              <h2
                className="text-3xl md:text-[42px] font-bold text-gray-900 leading-tight mb-4"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                Getting funded is easy
              </h2>
              <p className="text-gray-500 text-lg" style={{ fontFamily: "Inter, sans-serif" }}>
                Apply in minutes. Get funded in hours.
              </p>
            </div>
            <div className="max-w-[900px] mx-auto">
              <div className="space-y-0">
                {steps.map((step, index) => (
                  <div key={index} className="relative flex gap-8 pb-14 last:pb-0">
                    {index < steps.length - 1 && (
                      <div className="absolute left-[27px] top-[56px] bottom-0 w-px bg-[#1aa478]/20" />
                    )}
                    <div className="flex-shrink-0 w-14 h-14 rounded-full bg-[#1aa478] text-white flex items-center justify-center text-lg font-bold">
                      {step.step}
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: "Manrope, sans-serif" }}>
                          {step.title}
                        </h3>
                        <span className="inline-flex items-center rounded-full bg-[#1aa478]/10 px-3 py-0.5 text-xs font-semibold text-[#1aa478]">
                          <Clock className="h-3 w-3 mr-1" />
                          {step.time}
                        </span>
                      </div>
                      <p className="text-gray-500 text-base leading-relaxed max-w-[500px]" style={{ fontFamily: "Inter, sans-serif" }}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-[600px] mx-auto text-center mb-16">
              <h2
                className="text-3xl md:text-[42px] font-bold text-gray-900 leading-tight mb-4"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                You know your business best
              </h2>
              <p className="text-gray-500 text-lg" style={{ fontFamily: "Inter, sans-serif" }}>
                Use your funds on inventory, marketing, logistics, or anything else that drives growth.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-[900px] mx-auto">
              {useCases.map((item, index) => (
                <div
                  key={index}
                  className="flex gap-5 p-6 rounded-2xl border border-gray-100 bg-white hover:shadow-md hover:border-[#1aa478]/20 transition-all duration-300"
                >
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#1aa478]/10 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-[#1aa478]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-1" style={{ fontFamily: "Manrope, sans-serif" }}>
                      {item.title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="max-w-[600px] mx-auto text-center mb-16">
              <h2
                className="text-3xl md:text-[42px] font-bold text-gray-900 leading-tight mb-4"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                Frequently asked questions
              </h2>
            </div>
            <div className="max-w-[760px] mx-auto divide-y divide-gray-200">
              {faqs.map((faq, index) => (
                <div key={index} className="py-5">
                  <button
                    className="flex justify-between items-center w-full text-left"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    aria-expanded={openFaq === index}
                  >
                    <span
                      className="text-base font-semibold text-gray-900 pr-4"
                      style={{ fontFamily: "Manrope, sans-serif" }}
                    >
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                        openFaq === index ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openFaq === index && (
                    <p
                      className="mt-3 text-gray-500 text-[15px] leading-relaxed pr-8"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {faq.answer}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <p className="text-gray-500 text-sm mb-3" style={{ fontFamily: "Inter, sans-serif" }}>
                Have a different question?
              </p>
              <Link to="/contact">
                <Button
                  variant="outline"
                  className="border-2 border-gray-200 bg-transparent text-gray-700 hover:bg-gray-50 rounded-full px-6 h-10 text-sm font-semibold shadow-none"
                >
                  Get in touch with us
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 bg-[#0A2F2F]">
          <div className="container mx-auto px-6 text-center">
            <h2
              className="text-3xl md:text-[42px] font-bold text-white leading-tight mb-4"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Ready to get funded?
            </h2>
            <p
              className="text-gray-400 text-lg mb-10 max-w-[500px] mx-auto"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Join thousands of merchants who have used Everpay Capital to grow their business.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/demo">
                <Button
                  size="lg"
                  className="bg-[#1aa478] hover:bg-[#158f68] text-white rounded-full px-8 h-12 text-base font-semibold shadow-none min-w-[200px]"
                >
                  Get funded
                </Button>
              </Link>
              <Link to="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/20 bg-transparent text-white hover:bg-white/10 rounded-full px-8 h-12 text-base font-semibold shadow-none min-w-[200px]"
                >
                  Talk to our team
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
