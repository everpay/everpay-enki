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
    <section className="py-24 md:py-32 bg-[#0A2F2F]">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left — text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <p
              className="text-sm font-semibold text-[#1aa478] uppercase tracking-wider mb-4"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Developer First
            </p>
            <h2
              className="text-3xl md:text-[40px] font-extrabold text-white leading-tight mb-5"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Built for developers. Designed for business.
            </h2>
            <p
              className="text-lg text-white/60 leading-relaxed mb-10 max-w-lg"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
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
                  <h4
                    className="text-sm font-bold text-white mb-1"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    {f.title}
                  </h4>
                  <p className="text-xs text-white/40 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>

            <Link to="/docs">
              <Button className="bg-[#1aa478] hover:bg-[#158f68] text-white rounded-full px-7 h-11 text-[15px] font-semibold shadow-none gap-2">
                Read the docs
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>

          {/* Right — code block */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="rounded-2xl bg-[#0d3d3d] border border-white/5 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <span className="ml-3 text-xs text-white/30 font-mono">terminal</span>
              </div>
              <pre className="p-6 text-sm text-[#1aa478]/80 font-mono leading-relaxed overflow-x-auto">
                <code>{codeSnippet}</code>
              </pre>
            </div>

            {/* Response preview */}
            <div className="mt-4 rounded-2xl bg-[#0d3d3d] border border-white/5 p-6">
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
