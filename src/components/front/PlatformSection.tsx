import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowRight, Rocket, Building2 } from "lucide-react"

export function PlatformSection() {
  return (
    <section className="py-24 md:py-32 bg-secondary/30">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-[40px] font-extrabold text-foreground leading-tight mb-5 font-heading">
            The backbone of modern payments
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed font-body">
            From checkout to settlement—everything you need to run and scale your business.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="bg-card rounded-2xl border border-border p-8 hover:shadow-lg transition-[box-shadow] duration-200"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <Rocket className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3 font-heading">Startups & SMBs</h3>
            <p className="text-muted-foreground text-[15px] leading-relaxed mb-6 font-body">
              Get up and running in minutes with transparent pricing, no setup fees, and no long-term contracts.
            </p>
            <ul className="space-y-2 mb-8">
              {["No monthly minimums", "Pay-as-you-go pricing", "Free sandbox environment", "Same-day onboarding"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-foreground/80 font-body">
                  <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/pricing">
              <Button variant="outline" className="rounded-full px-6 h-10 text-[15px] font-semibold border-border gap-2 active:scale-[0.97] transition-all">
                View pricing
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[hsl(172,60%,10%)] rounded-2xl p-8 hover:shadow-lg transition-[box-shadow] duration-200"
          >
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 font-heading">Enterprise</h3>
            <p className="text-white/60 text-[15px] leading-relaxed mb-6 font-body">
              Custom pricing, dedicated support, and enterprise-grade SLAs. Work with our solutions team to architect the perfect payment stack.
            </p>
            <ul className="space-y-2 mb-8">
              {["Dedicated account manager", "Custom interchange++ pricing", "Multi-acquirer routing", "On-premise deployment options"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-white/70 font-body">
                  <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/contact">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 h-10 text-[15px] font-semibold shadow-none gap-2 active:scale-[0.97] transition-all">
                Contact sales
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
