import { motion } from "framer-motion"
import { CreditCard, Globe, Smartphone, ShieldCheck, BarChart3, Repeat } from "lucide-react"

const products = [
  { icon: CreditCard, title: "Online Payments", description: "Accept credit cards, debit cards, and digital wallets with a single integration. Optimized checkout that converts.", href: "/online-payments" },
  { icon: Globe, title: "Global Payment Methods", description: "Support 135+ currencies and local payment methods like PIX, Boleto, OXXO, Alipay, and more.", href: "/payments" },
  { icon: Smartphone, title: "Mobile & In-App Payments", description: "Apple Pay, Google Pay, and native SDKs for iOS and Android. Seamless mobile checkout experiences.", href: "/solutions/mobile-payments" },
  { icon: ShieldCheck, title: "Fraud Prevention", description: "AI-powered fraud detection with real-time scoring. Block bad actors without slowing down good customers.", href: "/fraud-prevention" },
  { icon: BarChart3, title: "Analytics & Reporting", description: "Real-time dashboards, transaction insights, and settlement reports. Full visibility into your payment operations.", href: "/about" },
  { icon: Repeat, title: "Recurring Billing", description: "Subscriptions, invoicing, and smart retry logic. Maximize recurring revenue and reduce churn.", href: "/solutions/saas-platforms" },
]

export function BusinessTypesSection() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-[32px] md:text-[44px] lg:text-[52px] font-extrabold text-foreground leading-[1.1] tracking-[-0.02em] mb-5 font-heading">
            Everything you need to get paid
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto font-body">
            One platform with all the tools to accept payments, prevent fraud, and grow your business globally.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {products.map((product, index) => (
            <motion.a
              key={index}
              href={product.href}
              initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
              className="group block rounded-2xl border border-border bg-card p-7 hover:shadow-lg hover:border-primary/20 transition-all duration-200"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <product.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors font-heading">
                {product.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-body">{product.description}</p>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
