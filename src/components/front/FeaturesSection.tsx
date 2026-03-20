import { useState } from "react"
import { Globe, ShieldCheck, Zap, Repeat } from "lucide-react"

const features = [
  {
    number: "1",
    tab: "Global Reach",
    title: "Accept payments in 135+ currencies worldwide",
    description:
      "With Everpay, your business instantly supports cards, wallets, bank transfers, and local payment methods across every major market. No extra integrations needed.",
    icon: Globe,
    highlights: ["Visa, Mastercard, Amex, Discover", "Apple Pay, Google Pay, PayPal", "PIX, OXXO, Boleto, Alipay"],
  },
  {
    number: "2",
    tab: "More Conversions",
    title: "Increase checkout success rates by up to 20%",
    description:
      "Our smart routing engine and localized payment experiences help you capture more revenue from every transaction. Less friction, more sales.",
    icon: Zap,
    highlights: ["Smart payment routing", "Localized checkout experience", "One-click payments"],
  },
  {
    number: "3",
    tab: "Fraud Protection",
    title: "AI-powered fraud prevention that protects your revenue",
    description:
      "Real-time transaction monitoring, machine learning risk scoring, and 3D Secure authentication keep your business safe without blocking good customers.",
    icon: ShieldCheck,
    highlights: ["Real-time monitoring", "ML-based risk scoring", "3D Secure 2.0"],
  },
  {
    number: "4",
    tab: "Repeat Business",
    title: "Turn one-time buyers into repeat customers",
    description:
      "Tokenized cards, subscription billing, and smart retry logic ensure your recurring revenue flows smoothly and customers keep coming back.",
    icon: Repeat,
    highlights: ["Card tokenization", "Subscription management", "Smart retry logic"],
  },
]

export function FeaturesSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = features[activeIndex]

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2
            className="text-3xl md:text-[40px] font-extrabold text-gray-900 leading-tight mb-4"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            With Everpay, you get more sales,{" "}
            <br className="hidden md:block" />
            more reach, more repeat customers
          </h2>
        </div>

        {/* Numbered tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-14">
          {features.map((feature, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-full text-sm font-semibold transition-all duration-200 ${
                index === activeIndex
                  ? "bg-[#1aa478] text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                  index === activeIndex ? "bg-white/20 text-white" : "bg-white text-gray-500"
                }`}
              >
                {feature.number}
              </span>
              {feature.tab}
            </button>
          ))}
        </div>

        {/* Feature content */}
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3
                className="text-2xl md:text-3xl font-bold text-gray-900 mb-5 leading-snug"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                {active.title}
              </h3>
              <p
                className="text-gray-500 text-base leading-relaxed mb-8"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {active.description}
              </p>
              <ul className="space-y-3">
                {active.highlights.map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1aa478]/10 flex items-center justify-center">
                      <svg className="w-3 h-3 text-[#1aa478]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-full max-w-sm bg-gray-50 rounded-3xl p-10 flex items-center justify-center">
                <active.icon className="w-32 h-32 text-[#1aa478]/20" strokeWidth={1} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
