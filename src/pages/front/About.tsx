import { SiteHeader } from "@/components/front/SiteHeader"
import { SiteFooter } from "@/components/front/SiteFooter"
import { Button } from "@/components/ui/button"
import {
  Globe,
  Users,
  ShieldCheck,
  Handshake,
  Zap,
  Headphones,
  Lock,
  BarChart3,
  Clock,
  Award,
  Heart,
  Target,
  TrendingUp,
  CheckCircle,
} from "lucide-react"

import { Link } from "react-router-dom"
import { useState } from "react"

const perks = [
  {
    icon: Zap,
    title: "Intuitive Onboarding",
    description:
      "With our intuitive dashboard and guided setup, you can start accepting payments across cards, wallets, and bank transfers in less than 10 minutes. No developer required for basic integrations -- just connect, configure, and go live.",
  },
  {
    icon: Headphones,
    title: "24/7 Dedicated Support",
    description:
      "You can count on our support team 24 hours a day, 7 days a week, all year round. Whether it is a technical question at 2 AM or a settlement inquiry on a holiday, we have your back every step of the way. Real humans, real answers, real fast.",
  },
  {
    icon: Lock,
    title: "Non-Custodial Approach",
    description:
      "We do not hold your funds. As a non-custodial payment processor, your money flows directly to your settlement account. Everpay routes, processes, and protects -- but you always maintain full ownership and control of every dollar.",
  },
  {
    icon: BarChart3,
    title: "Built-In Analytics & Reporting",
    description:
      "Use our platform's built-in real-time analytics dashboard to monitor transaction volume, approval rates, chargebacks, and revenue trends. Export reports, set custom alerts, and gain the insights you need to make smarter business decisions.",
  },
  {
    icon: Clock,
    title: "99.99% Uptime SLA",
    description:
      "Trust your payments on our cloud infrastructure hosted across multiple regions with redundant failover, providing a 99.99% uptime SLA -- known as one of the most reliable payment platforms on the market. Someone, somewhere, is always watching.",
  },
  {
    icon: Award,
    title: "Rewards & Incentives",
    description:
      "Expect volume-based pricing tiers, referral bonuses, early access to new products, and other merchant incentives that we roll out regularly. Loyalty matters to us, and we make sure it pays off for you too.",
  },
]

export default function AboutPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  })

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero -- Our Values */}
        <section className="relative bg-white pt-24 pb-20 md:pt-32 md:pb-28">
          <div className="container mx-auto px-6">
            <div className="max-w-[800px] mx-auto text-center">
              <h1
                className="text-4xl md:text-[56px] lg:text-[64px] font-extrabold text-gray-900 leading-[1.08] tracking-tight mb-8"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                Our Values
              </h1>
              <p
                className="text-lg md:text-xl text-gray-500 max-w-[660px] mx-auto leading-relaxed"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Collaborating with Everpay, both on a partnership level or a customer level, means believing in what
                we are passionate about and siding with our core values. We invite you to discover what makes us
                tick and what we care about the most.
              </p>
            </div>
          </div>
        </section>

        {/* Value 1 -- Growing Together */}
        <section className="py-24 bg-[#f8faf9]">
          <div className="container mx-auto px-6">
            <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-16 items-center">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#1aa478]/10 flex items-center justify-center mb-8">
                  <Handshake className="h-7 w-7 text-[#1aa478]" />
                </div>
                <h2
                  className="text-3xl md:text-[42px] font-bold text-gray-900 mb-8 leading-[1.15]"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  Growing together<br />
                  <span className="text-[#1aa478]">through partnership</span>
                </h2>
                <p
                  className="text-gray-500 text-[17px] leading-[1.75] mb-6"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  We strongly believe in the power of relationships. Connecting and working closely with merchants,
                  acquirers, card networks, and technology partners across every sector of the payments industry is
                  extremely important to us. It allows us to release our full potential, expand our scale, and grow
                  our community inside and outside the company.
                </p>
                <p
                  className="text-gray-500 text-[17px] leading-[1.75]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  The only way the digital commerce industry will reach mass adoption and serve every business --
                  from a single-location restaurant to a global marketplace -- is when we unite and work together.
                  That is what partnership means at Everpay: shared goals, shared growth, shared success.
                </p>
              </div>
              <div className="relative h-[420px] rounded-3xl overflow-hidden shadow-lg">
                <img
                  src="/placeholder.jpg"
                  alt="Team collaborating on payment solutions"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Value 2 -- We Care About People */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-16 items-center">
              <div className="relative h-[420px] rounded-3xl overflow-hidden shadow-lg md:order-first">
                <img
                  src="/mobile-card-reader.jpg"
                  alt="Customer using Everpay payment terminal"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#1aa478]/10 flex items-center justify-center mb-8">
                  <Heart className="h-7 w-7 text-[#1aa478]" />
                </div>
                <h2
                  className="text-3xl md:text-[42px] font-bold text-gray-900 mb-8 leading-[1.15]"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  We care<br />
                  <span className="text-[#1aa478]">about people</span>
                </h2>
                <p
                  className="text-gray-500 text-[17px] leading-[1.75] mb-6"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Our payments world is digital and fascinating. But it exists for the sake of real businesses
                  and the betterment of commerce for everyone. So it is only logical to base our approach on making
                  people the center of our strategy. We aim to set a higher standard for you and our partners --
                  one built on empathy, transparency, and responsiveness.
                </p>
                <p
                  className="text-gray-500 text-[17px] leading-[1.75]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  If you have questions that need answers, you can count on us at any time of day. Our support
                  team doesn't use scripts -- they understand payments, your business model, and the urgency
                  behind every inquiry. Because behind every transaction is a person, and behind every merchant
                  account is someone's livelihood.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Value 3 -- Accountability */}
        <section className="py-24 bg-[#f8faf9]">
          <div className="container mx-auto px-6">
            <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-16 items-center">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#1aa478]/10 flex items-center justify-center mb-8">
                  <Target className="h-7 w-7 text-[#1aa478]" />
                </div>
                <h2
                  className="text-3xl md:text-[42px] font-bold text-gray-900 mb-8 leading-[1.15]"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  We are all accountable<br />
                  <span className="text-[#1aa478]">for our future</span>
                </h2>
                <p
                  className="text-gray-500 text-[17px] leading-[1.75] mb-6"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Our industry demands we stay up-to-date with the quickly changing needs and wants of our
                  merchants. Doing things right is excellent, but being first in line to break new ground is
                  better. We are proud to innovate -- for you, for us, for the future of commerce.
                </p>
                <p
                  className="text-gray-500 text-[17px] leading-[1.75]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  With Everpay, you are walking in stride with the latest payment technology trends -- from
                  tokenized checkout to AI-driven fraud prevention to real-time cross-border settlements. We
                  invest in research and development not because it looks good on paper, but because the merchants
                  of tomorrow deserve infrastructure built today. Every product we ship, every feature we release,
                  is a bet on the future we are building together.
                </p>
              </div>
              <div className="relative h-[420px] rounded-3xl overflow-hidden shadow-lg">
                <img
                  src="/countertop-pos-terminal.jpg"
                  alt="Modern payment technology"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Value 4 -- Trust */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-16 items-center">
              <div className="relative h-[420px] rounded-3xl overflow-hidden shadow-lg md:order-first">
                <img
                  src="/tablet-pos-system.jpg"
                  alt="Secure payment processing"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#1aa478]/10 flex items-center justify-center mb-8">
                  <ShieldCheck className="h-7 w-7 text-[#1aa478]" />
                </div>
                <h2
                  className="text-3xl md:text-[42px] font-bold text-gray-900 mb-8 leading-[1.15]"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  Trust leads<br />
                  <span className="text-[#1aa478]">to more trust</span>
                </h2>
                <p
                  className="text-gray-500 text-[17px] leading-[1.75] mb-6"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  We know how invested you are in your business and how important it is to trust your payments
                  in good hands. Great! Then from the moment you join our platform, we are on trust-based terms.
                  PCI DSS Level 1 certified, encrypted end-to-end, and monitored around the clock by dedicated
                  security operations teams.
                </p>
                <p
                  className="text-gray-500 text-[17px] leading-[1.75]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  As long as we launch our relationship from mutual trust, we can only grow to earn even more
                  of it. Every settlement delivered on time, every dispute handled fairly, every uptime minute
                  maintained -- it all compounds. Trust is not a feature we ship; it is the foundation everything
                  else is built on.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Value 5 -- Long-Term Relationships */}
        <section className="py-24 bg-[#f8faf9]">
          <div className="container mx-auto px-6">
            <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-16 items-center">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#1aa478]/10 flex items-center justify-center mb-8">
                  <TrendingUp className="h-7 w-7 text-[#1aa478]" />
                </div>
                <h2
                  className="text-3xl md:text-[42px] font-bold text-gray-900 mb-8 leading-[1.15]"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  We prefer long-term<br />
                  <span className="text-[#1aa478]">relationships</span>
                </h2>
                <p
                  className="text-gray-500 text-[17px] leading-[1.75] mb-6"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Stick around for the full ride. If you pop in and out, you will not experience all the benefits
                  we offer and you will miss out on new ones that unlock all the time. Volume-based pricing tiers,
                  dedicated account managers, early access to beta features, and custom integration support --
                  these are reserved for merchants who grow with us.
                </p>
                <p
                  className="text-gray-500 text-[17px] leading-[1.75]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Learn how we work, enjoy our easy-to-use platform, tell us what you need, and watch us work
                  to match your expectations. We have seen merchants go from processing a few hundred transactions
                  a month to millions -- and we were there at every stage, adapting our platform to support their
                  growth. That is what long-term means to us.
                </p>
              </div>
              <div className="relative h-[420px] rounded-3xl overflow-hidden shadow-lg">
                <img
                  src="/modern-pos-terminal-payment-system.jpg"
                  alt="Growing business with Everpay"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Value 6 -- Global Mindset */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-16 items-center">
              <div className="relative h-[420px] rounded-3xl overflow-hidden shadow-lg md:order-first">
                <img
                  src="/placeholder.jpg"
                  alt="Global payments network"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#1aa478]/10 flex items-center justify-center mb-8">
                  <Globe className="h-7 w-7 text-[#1aa478]" />
                </div>
                <h2
                  className="text-3xl md:text-[42px] font-bold text-gray-900 mb-8 leading-[1.15]"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  Global mindset<br />
                  <span className="text-[#1aa478]">and reach</span>
                </h2>
                <p
                  className="text-gray-500 text-[17px] leading-[1.75] mb-6"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Although Everpay is headquartered in the United States with teams across multiple regions,
                  we live and work worldwide. Our distributed infrastructure spans data centers in North America,
                  Latin America, Europe, and Asia-Pacific -- ensuring low-latency payment processing no matter
                  where your customers are located.
                </p>
                <p
                  className="text-gray-500 text-[17px] leading-[1.75]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Chances are one of us is working somewhere at all times. Partly the reason for our 99.99%
                  uptime SLA. Someone, somewhere, is always watching over your transactions. With support for
                  150+ countries, 100+ currencies, and every major local payment method -- from PIX in Brazil
                  to Alipay in China -- Everpay makes the world your marketplace.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The Everpay Experience -- Perks Grid */}
        <section className="py-24 bg-[#f8faf9]">
          <div className="container mx-auto px-6">
            <div className="max-w-[660px] mx-auto text-center mb-16">
              <h2
                className="text-3xl md:text-[42px] font-bold text-gray-900 mb-6"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                The Everpay Experience
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                Enjoy your time on Everpay. Get to know all the perks and how to maximize on benefits.
                Here is everything you unlock when you partner with us.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1100px] mx-auto">
              {perks.map((perk, index) => (
                <div
                  key={index}
                  className="bg-white rounded-3xl p-10 border border-gray-100 hover:shadow-xl hover:border-[#1aa478]/20 transition-all duration-300 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#1aa478]/10 flex items-center justify-center mb-6 group-hover:bg-[#1aa478]/15 transition-colors">
                    <perk.icon className="h-6 w-6 text-[#1aa478]" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>
                    {perk.title}
                  </h3>
                  <p className="text-gray-500 text-[15px] leading-[1.7]" style={{ fontFamily: "Inter, sans-serif" }}>
                    {perk.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* By the Numbers */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-[660px] mx-auto text-center mb-16">
              <h2
                className="text-3xl md:text-[42px] font-bold text-gray-900 mb-6"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                Everpay by the Numbers
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                Our platform powers commerce for thousands of businesses across the globe.
                Here is a snapshot of what we have built together with our merchants.
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-[1000px] mx-auto">
              {[
                { value: "150+", label: "Countries supported", sublabel: "Global payment coverage" },
                { value: "100+", label: "Currencies accepted", sublabel: "Local payment methods" },
                { value: "99.99%", label: "Uptime SLA", sublabel: "Always-on reliability" },
                { value: "24/7", label: "Support availability", sublabel: "Real humans, real fast" },
              ].map((stat, index) => (
                <div key={index} className="text-center p-6">
                  <p
                    className="text-4xl md:text-5xl font-extrabold text-[#1aa478] mb-3"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-gray-900 font-semibold text-base mb-1" style={{ fontFamily: "Manrope, sans-serif" }}>
                    {stat.label}
                  </p>
                  <p className="text-gray-400 text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
                    {stat.sublabel}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Merchants Choose Everpay */}
        <section className="py-24 bg-[#f8faf9]">
          <div className="container mx-auto px-6">
            <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-16 items-start">
              <div>
                <h2
                  className="text-3xl md:text-[42px] font-bold text-gray-900 mb-8 leading-[1.15]"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  Why merchants choose<br />
                  <span className="text-[#1aa478]">Everpay</span>
                </h2>
                <p
                  className="text-gray-500 text-[17px] leading-[1.75] mb-8"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Everpay is not just another payment processor. We are a full-stack payments platform designed
                  for businesses that want to grow without worrying about the plumbing. From your first transaction
                  to your millionth, our infrastructure scales with you.
                </p>
                <p
                  className="text-gray-500 text-[17px] leading-[1.75]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Our first-rate innovation and cutting-edge security protect your revenue on an industry-leading
                  platform. Whether you are a startup processing your first orders or an enterprise handling
                  cross-border settlements at scale, Everpay adapts to your needs -- not the other way around.
                </p>
              </div>
              <div className="space-y-6">
                {[
                  {
                    title: "One integration, every payment method",
                    desc: "Accept cards, wallets, bank transfers, BNPL, and local payment methods through a single API. No need to stitch together multiple providers.",
                  },
                  {
                    title: "Transparent, predictable pricing",
                    desc: "No hidden fees, no surprise charges, no long-term contracts. You see exactly what you pay for, and our volume-based tiers reward your growth.",
                  },
                  {
                    title: "Built-in compliance and security",
                    desc: "PCI DSS Level 1, end-to-end encryption, 3D Secure 2.0, and real-time fraud monitoring come standard. Security is not an add-on -- it is the foundation.",
                  },
                  {
                    title: "Fast, reliable settlements",
                    desc: "Get your funds when you need them. Everpay offers next-day and same-day settlement options so your cash flow keeps pace with your business.",
                  },
                  {
                    title: "Dedicated account management",
                    desc: "Every merchant gets access to a real human who understands your business. Not a chatbot, not a ticket queue -- a partner who picks up the phone.",
                  },
                ].map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <CheckCircle className="h-5 w-5 text-[#1aa478]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-1" style={{ fontFamily: "Manrope, sans-serif" }}>
                        {item.title}
                      </h3>
                      <p className="text-gray-500 text-[15px] leading-[1.65]" style={{ fontFamily: "Inter, sans-serif" }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Become a Merchant CTA */}
        <section className="py-24 bg-[#0A2F2F]">
          <div className="container mx-auto px-6">
            <div className="max-w-[720px] mx-auto text-center">
              <h2
                className="text-3xl md:text-[42px] font-bold text-white mb-6 leading-[1.15]"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                Become a merchant
              </h2>
              <p
                className="text-gray-400 text-lg leading-relaxed max-w-[600px] mx-auto mb-10"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Thank you for your interest in Everpay! We are grateful for the opportunity to show you why
                Everpay is the right choice for your business. Non-custodial, reliable, easy to navigate,
                and customer-forward payments are at the heart of our service. Our first-rate innovation and
                cutting-edge technology protect your revenue on an industry-leading platform. Join us.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a href="https://app.everpayinc.com/sign-up" target="_blank" rel="noopener noreferrer">
                  <Button
                    size="lg"
                    className="bg-[#1aa478] hover:bg-[#158f68] text-white rounded-full px-10 h-13 text-base font-semibold shadow-none min-w-[220px]"
                  >
                    Get started free
                  </Button>
                </a>
                <Link to="/contact">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white/20 bg-transparent text-white hover:bg-white/10 rounded-full px-10 h-13 text-base font-semibold shadow-none min-w-[220px]"
                  >
                    Get in touch
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
