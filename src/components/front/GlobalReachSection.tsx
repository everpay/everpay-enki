import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"

const regions = [
  { name: "North America", methods: ["Visa", "Mastercard", "Amex", "Apple Pay", "Google Pay"], currencies: "USD, CAD, MXN", flag: "🇺🇸" },
  { name: "Europe", methods: ["SEPA", "iDEAL", "Bancontact", "Klarna", "Sofort"], currencies: "EUR, GBP, CHF, SEK", flag: "🇪🇺" },
  { name: "Latin America", methods: ["PIX", "Boleto", "OXXO", "Mercado Pago", "PSE"], currencies: "BRL, ARS, CLP, COP", flag: "🇧🇷" },
  { name: "Asia Pacific", methods: ["Alipay", "WeChat Pay", "GrabPay", "PayPay", "UPI"], currencies: "CNY, JPY, SGD, INR", flag: "🇸🇬" },
  { name: "Middle East & Africa", methods: ["M-Pesa", "Fawry", "STCPay", "MTN MoMo", "Airtel Money"], currencies: "AED, ZAR, KES, NGN", flag: "🇦🇪" },
]

export function GlobalReachSection() {
  return (
    <section className="py-24 md:py-32 bg-secondary/30">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mb-16"
        >
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 font-body">
            Global Coverage
          </p>
          <h2 className="text-3xl md:text-[44px] font-extrabold text-foreground leading-tight mb-5 font-heading">
            One integration, every market.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl font-body">
            Accept 135+ currencies and hundreds of local payment methods across six continents. Our smart routing automatically selects the best payment path for each transaction.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {regions.map((region, i) => (
            <motion.div
              key={region.name}
              initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="bg-card rounded-2xl border border-border p-7 hover:shadow-lg hover:border-primary/20 transition-[box-shadow,border-color] duration-200"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{region.flag}</span>
                <h3 className="text-lg font-bold text-foreground font-heading">{region.name}</h3>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {region.methods.map((m) => (
                  <span key={m} className="inline-block text-xs font-medium bg-secondary text-secondary-foreground rounded-full px-2.5 py-1 font-body">
                    {m}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground font-medium tabular-nums font-body">{region.currencies}</p>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: regions.length * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              to="/payments"
              className="group flex flex-col items-center justify-center h-full min-h-[180px] bg-primary/5 rounded-2xl border border-primary/10 p-7 hover:bg-primary/10 transition-colors"
            >
              <span className="text-primary font-bold text-lg mb-2 font-heading">View all payment methods</span>
              <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
