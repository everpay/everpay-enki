import { SiteHeader } from "@/components/front/SiteHeader"
import { SiteFooter } from "@/components/front/SiteFooter"
import { CTASection } from "@/components/front/CtaSection"
import { Button } from "@/components/ui/button"
import { Check, ArrowRight, CreditCard, Shield, BarChart3, Zap, Globe, RefreshCw } from "lucide-react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"

const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  visible: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  }),
}

const paymentPricing = [
  {
    title: "Cards & wallets",
    description: "Accept Visa, Mastercard, Amex, Apple Pay, Google Pay and more.",
    rate: "2.9% + 30¢",
    detail: "per successful transaction",
    extras: [
      { label: "+0.5%", note: "for manually entered cards" },
      { label: "+1.5%", note: "for international cards" },
      { label: "+1%", note: "if currency conversion is required" },
    ],
  },
  {
    title: "ACH & bank transfers",
    description: "Low-cost bank debits and transfers for US customers.",
    rate: "0.8%",
    detail: "$5.00 cap per transaction",
    extras: [
      { label: "$4.00", note: "ACH credit transfers" },
      { label: "$1.00", note: "for failed ACH debits" },
    ],
  },
  {
    title: "Alternative methods",
    description: "Buy now pay later, regional wallets, and more.",
    rate: "From 5.99% + 30¢",
    detail: "varies by method",
    extras: [
      { label: "Klarna", note: "5.99% + 30¢" },
      { label: "PayPal", note: "3.49% + 49¢" },
    ],
  },
]

const includedFeatures = [
  {
    icon: Globe,
    title: "Global coverage",
    bullets: ["195+ countries and territories", "135+ currencies supported", "Local acquiring in 40+ countries"],
  },
  {
    icon: Shield,
    title: "Fraud prevention",
    bullets: ["Machine-learning fraud detection", "3D Secure authentication", "Address and CVC verification"],
  },
  {
    icon: Zap,
    title: "Checkout optimization",
    bullets: ["Hosted checkout pages", "Embeddable payment forms", "One-click checkout with Link"],
  },
  {
    icon: BarChart3,
    title: "Revenue tools",
    bullets: ["Real-time analytics dashboard", "Automated reconciliation", "Custom reporting and exports"],
  },
]

const faqs = [
  {
    q: "Are there setup fees or monthly minimums?",
    a: "No. Standard pricing has no setup fees, monthly fees, or hidden costs. You only pay per-transaction fees when you process payments.",
  },
  {
    q: "How does IC+ pricing work?",
    a: "Interchange-plus pricing passes through the exact interchange rate set by card networks, plus a fixed markup. This is typically more cost-effective for businesses processing over $100K/month.",
  },
  {
    q: "Can I switch between Standard and Custom plans?",
    a: "Yes. You can start on Standard pricing and move to Custom as your business grows. Contact our sales team to discuss volume-based pricing.",
  },
  {
    q: "What payment methods are included?",
    a: "Standard pricing includes cards (Visa, Mastercard, Amex, Discover, JCB), digital wallets (Apple Pay, Google Pay), bank transfers, and buy-now-pay-later options.",
  },
  {
    q: "Do you offer in-person payment processing?",
    a: "Yes. In-person card-present transactions are charged at 2.7% + 5¢ per successful tap, dip, or swipe using our POS terminals.",
  },
  {
    q: "Is there a fee for refunds?",
    a: "There is no fee to issue a refund. However, the original transaction fee is not returned when a refund is processed.",
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main>
        {/* Hero — Stripe-style: two cards side by side */}
        <section className="pt-24 pb-20 md:pt-32 md:pb-28 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 overflow-hidden relative">
          {/* Subtle gradient accent */}
          <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#1aa478]/10 to-transparent pointer-events-none" />

          <div className="container mx-auto px-6 relative z-10">
            <motion.h1
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              custom={0} variants={fadeUp}
              className="text-4xl md:text-5xl lg:text-[56px] font-extrabold text-white leading-[1.08] tracking-tight mb-5 max-w-2xl"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Pricing built for businesses of all sizes
            </motion.h1>
            <motion.p
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              custom={1} variants={fadeUp}
              className="text-lg text-white/50 max-w-xl mb-14 leading-relaxed"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Pay-as-you-go or custom packaging — no setup fees, no monthly fees, no hidden costs.
            </motion.p>

            <div className="grid md:grid-cols-2 gap-5 max-w-4xl">
              {/* Standard card */}
              <motion.div
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                custom={2} variants={fadeUp}
                className="bg-white rounded-2xl p-8 md:p-10 flex flex-col"
              >
                <h2
                  className="text-2xl font-bold text-gray-900 mb-2"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  Standard
                </h2>
                <p className="text-sm text-gray-500 mb-8 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                  Access a complete payments platform with simple, pay-as-you-go pricing.
                </p>

                <div className="mb-8">
                  <span className="text-[40px] font-extrabold text-gray-900 tracking-tight" style={{ fontFamily: "Manrope, sans-serif", lineHeight: 1.1 }}>
                    2.9% + 30¢
                  </span>
                  <p className="text-sm text-gray-500 mt-1">per successful transaction for domestic cards</p>
                </div>

                <div className="mt-auto">
                  <Link to="/signup">
                    <Button className="w-full bg-[#1aa478] hover:bg-[#158f64] text-white rounded-full h-12 text-base font-semibold">
                      Get started <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </motion.div>

              {/* Custom card */}
              <motion.div
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                custom={3} variants={fadeUp}
                className="bg-gray-800 rounded-2xl p-8 md:p-10 flex flex-col"
              >
                <h2
                  className="text-2xl font-bold text-white mb-2"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  Custom
                </h2>
                <p className="text-sm text-white/50 mb-8 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                  Design a custom package for large volume or unique business models.
                </p>

                <ul className="space-y-3 mb-8">
                  {["IC+ pricing", "Volume discounts", "Multi-product discounts", "Dedicated account manager"].map(
                    (item) => (
                      <li key={item} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-[#1aa478]/20 flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3 text-[#1aa478]" />
                        </div>
                        <span className="text-sm text-white/80">{item}</span>
                      </li>
                    )
                  )}
                </ul>

                <div className="mt-auto">
                  <Link to="/contact">
                    <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 rounded-full h-12 text-base font-semibold bg-transparent">
                      Contact sales <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Per-product pricing breakdown */}
        <section className="py-20 md:py-28 bg-white">
          <div className="container mx-auto px-6 max-w-5xl">
            <motion.h2
              initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
              custom={0} variants={fadeUp}
              className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Standard pricing
            </motion.h2>
            <motion.p
              initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
              custom={1} variants={fadeUp}
              className="text-gray-500 mb-12 max-w-lg"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Transparent per-transaction fees. No hidden charges.
            </motion.p>

            <div className="grid gap-5">
              {paymentPricing.map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
                  custom={idx + 2} variants={fadeUp}
                  className="border border-gray-200 rounded-2xl p-6 md:p-8 hover:border-[#1aa478]/40 transition-colors duration-300"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CreditCard className="h-5 w-5 text-[#1aa478]" />
                        <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: "Manrope, sans-serif" }}>
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-500 ml-8" style={{ fontFamily: "Inter, sans-serif" }}>
                        {item.description}
                      </p>
                    </div>

                    <div className="md:text-right ml-8 md:ml-0">
                      <span className="text-2xl font-extrabold text-gray-900 tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>
                        {item.rate}
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">{item.detail}</p>
                    </div>
                  </div>

                  {item.extras.length > 0 && (
                    <div className="mt-5 ml-8 flex flex-wrap gap-3">
                      {item.extras.map((extra) => (
                        <span
                          key={extra.label}
                          className="inline-flex items-center gap-1.5 text-xs bg-gray-50 text-gray-600 px-3 py-1.5 rounded-full border border-gray-100"
                        >
                          <span className="font-semibold text-gray-900">{extra.label}</span>
                          {extra.note}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Included features grid */}
        <section className="py-20 md:py-28 bg-gray-50">
          <div className="container mx-auto px-6 max-w-5xl">
            <motion.h2
              initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
              custom={0} variants={fadeUp}
              className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Included with every account
            </motion.h2>
            <motion.p
              initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
              custom={1} variants={fadeUp}
              className="text-gray-500 mb-14 max-w-lg"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              No additional fees for these core capabilities.
            </motion.p>

            <div className="grid sm:grid-cols-2 gap-8">
              {includedFeatures.map((feature, idx) => (
                <motion.div
                  key={feature.title}
                  initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
                  custom={idx + 2} variants={fadeUp}
                  className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#1aa478]/10 flex items-center justify-center">
                      <feature.icon className="h-5 w-5 text-[#1aa478]" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: "Manrope, sans-serif" }}>
                      {feature.title}
                    </h3>
                  </div>
                  <ul className="space-y-2.5">
                    {feature.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-center gap-2.5">
                        <Check className="h-4 w-4 text-[#1aa478] flex-shrink-0" />
                        <span className="text-sm text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>
                          {bullet}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* In-person pricing callout */}
        <section className="py-20 md:py-28 bg-white">
          <div className="container mx-auto px-6 max-w-5xl">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
              custom={0} variants={fadeUp}
              className="bg-gray-950 rounded-3xl p-8 md:p-14 flex flex-col md:flex-row md:items-center gap-8"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <RefreshCw className="h-5 w-5 text-[#1aa478]" />
                  <span className="text-xs font-bold uppercase tracking-widest text-[#1aa478]">In-person payments</span>
                </div>
                <h3
                  className="text-2xl md:text-3xl font-extrabold text-white mb-3"
                  style={{ fontFamily: "Manrope, sans-serif", lineHeight: 1.15 }}
                >
                  2.7% + 5¢
                </h3>
                <p className="text-sm text-white/50 leading-relaxed max-w-md" style={{ fontFamily: "Inter, sans-serif" }}>
                  Per successful tap, dip, or swipe. Accept payments at your counter, curbside, or on the go with Everpay POS terminals.
                </p>
              </div>
              <Link to="/solutions/pos">
                <Button className="bg-[#1aa478] hover:bg-[#158f64] text-white rounded-full h-12 px-8 text-base font-semibold whitespace-nowrap">
                  Explore POS <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 md:py-28 bg-gray-50">
          <div className="container mx-auto px-6 max-w-3xl">
            <motion.h2
              initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
              custom={0} variants={fadeUp}
              className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-12"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Frequently asked questions
            </motion.h2>

            <div className="space-y-0 divide-y divide-gray-200">
              {faqs.map((faq, idx) => (
                <motion.details
                  key={idx}
                  initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
                  custom={idx + 1} variants={fadeUp}
                  className="group py-6"
                >
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <h3
                      className="text-base font-semibold text-gray-900 pr-4"
                      style={{ fontFamily: "Manrope, sans-serif" }}
                    >
                      {faq.q}
                    </h3>
                    <span className="text-gray-400 group-open:rotate-45 transition-transform duration-200 text-xl font-light flex-shrink-0">
                      +
                    </span>
                  </summary>
                  <p className="text-sm text-gray-600 mt-3 leading-relaxed pr-8" style={{ fontFamily: "Inter, sans-serif" }}>
                    {faq.a}
                  </p>
                </motion.details>
              ))}
            </div>
          </div>
        </section>

        <CTASection />
      </main>

      <SiteFooter />
    </div>
  )
}
