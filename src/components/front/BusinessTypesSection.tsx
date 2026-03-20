import { CreditCard, Globe, Smartphone, ShieldCheck, BarChart3, Repeat } from "lucide-react"

const products = [
  {
    icon: CreditCard,
    title: "Online Payments",
    description: "Accept credit cards, debit cards, and digital wallets with a single integration. Optimized checkout that converts.",
    href: "/online-payments",
  },
  {
    icon: Globe,
    title: "Global Payment Methods",
    description: "Support 135+ currencies and local payment methods like PIX, Boleto, OXXO, Alipay, and more.",
    href: "/payments",
  },
  {
    icon: Smartphone,
    title: "Mobile & In-App Payments",
    description: "Apple Pay, Google Pay, and native SDKs for iOS and Android. Seamless mobile checkout experiences.",
    href: "/solutions/mobile-payments",
  },
  {
    icon: ShieldCheck,
    title: "Fraud Prevention",
    description: "AI-powered fraud detection with real-time scoring. Block bad actors without slowing down good customers.",
    href: "/fraud-prevention",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reporting",
    description: "Real-time dashboards, transaction insights, and settlement reports. Full visibility into your payment operations.",
    href: "/about",
  },
  {
    icon: Repeat,
    title: "Recurring Billing",
    description: "Subscriptions, invoicing, and smart retry logic. Maximize recurring revenue and reduce churn.",
    href: "/solutions/saas-platforms",
  },
]

export function BusinessTypesSection() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2
            className="text-3xl md:text-[40px] font-extrabold text-gray-900 leading-tight mb-4"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Everything you need to get paid
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
            One platform with all the tools to accept payments, prevent fraud, and grow your business globally.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {products.map((product, index) => (
            <a
              key={index}
              href={product.href}
              className="group block rounded-2xl border border-gray-100 bg-white p-7 hover:shadow-lg hover:border-[#1aa478]/20 transition-all duration-200"
            >
              <div className="w-11 h-11 rounded-xl bg-[#1aa478]/10 flex items-center justify-center mb-5">
                <product.icon className="w-5 h-5 text-[#1aa478]" />
              </div>
              <h3
                className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[#1aa478] transition-colors"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                {product.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                {product.description}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
