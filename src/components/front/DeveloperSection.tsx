import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

const codeSnippet = `curl https://api.everpayinc.com/v1/payments \\
  -H "Authorization: Bearer sk_live_..." \\
  -d amount=4999 \\
  -d currency=usd \\
  -d payment_method=pm_card_visa \\
  -d description="Order #1847"`

const features = [
  { title: "RESTful API", desc: "Clean, predictable endpoints with comprehensive documentation." },
  { title: "Webhooks", desc: "Real-time event notifications for every payment lifecycle change." },
  { title: "SDKs & Libraries", desc: "Official libraries for Node.js, Python, PHP, Ruby, and Go." },
  { title: "Sandbox Mode", desc: "Test your integration with realistic test data before going live." },
]

export function DeveloperSection() {
  return (
    <section className="py-24 md:py-32 bg-[hsl(172,60%,10%)]">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 font-body">
              Developer First
            </p>
            <h2 className="text-[32px] md:text-[44px] lg:text-[52px] font-extrabold text-white leading-[1.1] tracking-[-0.02em] mb-6 font-heading">
              Built for developers. Designed for business.
            </h2>
            <p className="text-lg md:text-xl text-white/60 leading-relaxed mb-10 max-w-lg font-body">
              Accept your first payment in minutes, not weeks. Our API is built on familiar REST conventions with clear documentation and predictable behavior.
            </p>

            <div className="grid grid-cols-2 gap-5 mb-10">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                >
                  <h4 className="text-sm font-bold text-white mb-1 font-heading">{f.title}</h4>
                  <p className="text-xs text-white/40 leading-relaxed font-body">{f.desc}</p>
                </motion.div>
              ))}
            </div>

            <Link to="/docs">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-7 h-11 text-[15px] font-semibold shadow-none gap-2 active:scale-[0.97] transition-all">
                Read the docs
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="rounded-2xl bg-[hsl(172,50%,14%)] border border-white/5 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <span className="ml-3 text-xs text-white/30 font-mono">terminal</span>
              </div>
              <pre className="p-6 text-sm text-primary/80 font-mono leading-relaxed overflow-x-auto">
                <code>{codeSnippet}</code>
              </pre>
            </div>

            <div className="mt-4 rounded-2xl bg-[hsl(172,50%,14%)] border border-white/5 p-6">
              <p className="text-xs text-white/30 font-mono mb-3">Response</p>
              <pre className="text-xs text-white/50 font-mono leading-relaxed">
{`{
  "id": "pay_3Mh8qN2eZvKYlo",
  "status": "succeeded",
  "amount": 4999,
  "currency": "usd",
  "created": 1711234567
}`}
              </pre>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
