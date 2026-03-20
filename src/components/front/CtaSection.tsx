import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

export function CTASection() {
  return (
    <section className="py-20 md:py-28 bg-[hsl(172,60%,10%)]">
      <div className="container mx-auto px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl md:text-[44px] font-extrabold text-white leading-tight mb-5 font-heading"
        >
          Ready to grow your business?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg text-white/60 mb-10 max-w-lg mx-auto leading-relaxed font-body"
        >
          Get a free demo and see how Everpay can help you accept payments globally, prevent fraud, and increase revenue.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link to="/demo">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 h-12 text-base font-semibold shadow-none min-w-[200px] active:scale-[0.97] transition-all"
            >
              Get a free demo
            </Button>
          </Link>
          <Link to="/contact">
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white/20 bg-transparent text-white hover:bg-white/10 rounded-full px-8 h-12 text-base font-semibold shadow-none min-w-[200px] active:scale-[0.97] transition-all"
            >
              Contact sales
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
