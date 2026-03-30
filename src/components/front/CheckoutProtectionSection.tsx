import { motion } from "framer-motion"
import { Star } from "lucide-react"

const testimonials = [
  { quote: "Everpay transformed our payment operations. We've seen a 40% increase in successful transactions since switching.", name: "Sarah Chen", title: "CTO, UrbanMarket" },
  { quote: "The fraud protection alone has saved us over $200K. And the integration was incredibly smooth.", name: "Marcus Rivera", title: "Head of Payments, FlowCommerce" },
  { quote: "We went from 3 payment providers to just Everpay. Simpler, cheaper, and our conversion rate is up 18%.", name: "Aisha Patel", title: "VP Operations, ShopWave" },
  { quote: "Their support team is incredible. Available 24/7 and deeply knowledgeable about global payment regulations.", name: "James O'Brien", title: "CEO, QuickShip Logistics" },
  { quote: "Expanding into Latin America was seamless with Everpay. PIX, Boleto, OXXO - all just worked from day one.", name: "Lucia Fernandez", title: "Growth Lead, Tienda Digital" },
  { quote: "The dashboard gives us real-time visibility into every transaction across 12 countries. Game changer.", name: "David Kim", title: "CFO, NexGen Retail" },
]

export function CheckoutProtectionSection() {
  return (
    <section className="py-20 md:py-28 bg-secondary/30">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-14"
        >
          <h2 className="text-[32px] md:text-[44px] lg:text-[52px] font-extrabold text-foreground leading-[1.1] tracking-[-0.02em] mb-5 font-heading">
            See why businesses trust Everpay
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto font-body">
            Over 500 businesses have switched to Everpay for faster, more reliable payment processing.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              className="bg-card rounded-2xl p-6 border border-border hover:shadow-md transition-shadow"
            >
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-foreground/80 text-[15px] leading-relaxed mb-5 font-body">{`"${t.quote}"`}</p>
              <div>
                <p className="text-sm font-semibold text-foreground font-heading">{t.name}</p>
                <p className="text-sm text-muted-foreground font-body">{t.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
