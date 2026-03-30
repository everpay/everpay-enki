import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

const stories = [
  { company: "UrbanMarket", industry: "E-commerce", stat: "+40%", statLabel: "increase in successful transactions", quote: "Everpay transformed our payment operations. We consolidated from 3 providers to one and saw results immediately.", person: "Sarah Chen", role: "CTO" },
  { company: "FlowCommerce", industry: "SaaS", stat: "$200K+", statLabel: "saved in fraud losses annually", quote: "The fraud protection alone justified the switch. Integration took 2 days, not the 2 months we expected.", person: "Marcus Rivera", role: "Head of Payments" },
  { company: "ShopWave", industry: "Retail", stat: "+18%", statLabel: "checkout conversion improvement", quote: "We went from 3 payment providers to just Everpay. Simpler, cheaper, and our conversion rate speaks for itself.", person: "Aisha Patel", role: "VP Operations" },
]

export function EnterpriseProofSection() {
  return (
    <section className="py-24 md:py-32 bg-secondary/30">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-end md:justify-between mb-14 gap-4"
        >
          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 font-body">Customer Stories</p>
            <h2 className="text-[32px] md:text-[44px] lg:text-[52px] font-extrabold text-foreground leading-[1.1] tracking-[-0.02em] font-heading">
              Powering businesses of all sizes.
            </h2>
          </div>
          <Link to="/blog">
            <Button variant="outline" className="rounded-full px-6 h-10 text-[15px] font-semibold border-border text-foreground hover:bg-card gap-2 active:scale-[0.97] transition-all">
              All stories
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {stories.map((s, i) => (
            <motion.div
              key={s.company}
              initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="bg-card rounded-2xl border border-border p-8 flex flex-col hover:shadow-lg transition-[box-shadow] duration-200"
            >
              <div className="mb-6">
                <span className="text-3xl font-extrabold text-primary tabular-nums font-heading">{s.stat}</span>
                <p className="text-sm text-muted-foreground mt-1 font-body">{s.statLabel}</p>
              </div>
              <p className="text-[15px] text-foreground/80 leading-relaxed mb-8 flex-1 font-body">"{s.quote}"</p>
              <div className="border-t border-border pt-5">
                <p className="text-sm font-bold text-foreground font-heading">{s.person}</p>
                <p className="text-xs text-muted-foreground font-body">{s.role}, {s.company}</p>
                <span className="inline-block mt-2 text-xs font-medium bg-secondary text-secondary-foreground rounded-full px-2.5 py-0.5 font-body">
                  {s.industry}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
