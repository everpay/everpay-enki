import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

const verticals = [
  { title: "Restaurants", subtitle: "Fine dining to food trucks", description: "Table management, KDS integration, split checks, tip handling, and online ordering — all from one system.", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=500&fit=crop", stats: "35% faster table turns", link: "/solutions/restaurant" },
  { title: "Retail", subtitle: "Boutiques to multi-location chains", description: "Barcode scanning, inventory sync across stores, purchase orders, and customer loyalty — built into every terminal.", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=500&fit=crop", stats: "22% higher AOV with kiosk", link: "/solutions/retail" },
  { title: "Services", subtitle: "Salons, clinics, and field ops", description: "Appointment booking, mobile invoicing, recurring payments, and staff scheduling in a single handheld device.", image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=500&fit=crop", stats: "85% less admin overhead", link: "/solutions/pos" },
]

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }
const itemVariants = {
  hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
}

export function IndustryVerticalsSection() {
  return (
    <section className="py-24 lg:py-32 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16"
        >
          <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-3 font-body">Industry Solutions</p>
          <h2 className="text-[32px] sm:text-[44px] lg:text-[52px] font-extrabold tracking-[-0.02em] mb-6 font-heading" style={{ lineHeight: 1.1 }}>
            Built for How You Work
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl font-body" style={{ textWrap: "pretty" as any }}>
            Whether you flip burgers or style hair, Everpay POS adapts to your workflow — not the other way around.
          </p>
        </motion.div>

        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} className="grid gap-8 lg:grid-cols-3">
          {verticals.map((v) => (
            <motion.div key={v.title} variants={itemVariants} className="group relative rounded-2xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-lg transition-shadow duration-300">
              <div className="relative h-64 overflow-hidden">
                <img src={v.image} alt={v.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5">
                  <span className="inline-block rounded-full bg-primary/90 px-3 py-1 text-xs font-medium text-primary-foreground mb-2 font-body">{v.stats}</span>
                  <h3 className="text-2xl font-bold text-white font-heading">{v.title}</h3>
                  <p className="text-sm text-white/80 font-body">{v.subtitle}</p>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-muted-foreground leading-relaxed mb-5 font-body">{v.description}</p>
                <Link to={v.link}>
                  <Button variant="ghost" size="sm" className="px-0 text-primary hover:text-primary/80 group/btn font-body">
                    Explore {v.title}
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 flex flex-col sm:flex-row items-start sm:items-center gap-6 rounded-2xl border border-border bg-card p-8"
        >
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-1 font-heading">Don't see your industry?</h3>
            <p className="text-sm text-muted-foreground font-body">Everpay POS serves 40+ verticals. Talk to our team to get a system tailored to your business.</p>
          </div>
          <Link to="/contact">
            <Button variant="outline" className="shrink-0 rounded-full active:scale-[0.97] transition-all">Contact Sales</Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
