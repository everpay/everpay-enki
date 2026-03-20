import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

const stories = [
  {
    company: "UrbanMarket",
    industry: "E-commerce",
    stat: "+40%",
    statLabel: "increase in successful transactions",
    quote: "Everpay transformed our payment operations. We consolidated from 3 providers to one and saw results immediately.",
    person: "Sarah Chen",
    role: "CTO",
  },
  {
    company: "FlowCommerce",
    industry: "SaaS",
    stat: "$200K+",
    statLabel: "saved in fraud losses annually",
    quote: "The fraud protection alone justified the switch. Integration took 2 days, not the 2 months we expected.",
    person: "Marcus Rivera",
    role: "Head of Payments",
  },
  {
    company: "ShopWave",
    industry: "Retail",
    stat: "+18%",
    statLabel: "checkout conversion improvement",
    quote: "We went from 3 payment providers to just Everpay. Simpler, cheaper, and our conversion rate speaks for itself.",
    person: "Aisha Patel",
    role: "VP Operations",
  },
]

export function EnterpriseProofSection() {
  return (
    <section className="py-24 md:py-32 bg-[#f7f8fa]">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-end md:justify-between mb-14 gap-4"
        >
          <div>
            <p
              className="text-sm font-semibold text-[#1aa478] uppercase tracking-wider mb-4"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Customer Stories
            </p>
            <h2
              className="text-3xl md:text-[40px] font-extrabold text-gray-900 leading-tight"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Powering businesses of all sizes.
            </h2>
          </div>
          <Link to="/blog">
            <Button
              variant="outline"
              className="rounded-full px-6 h-10 text-[15px] font-semibold border-gray-200 text-gray-700 hover:bg-white gap-2"
            >
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
              className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col hover:shadow-lg transition-[box-shadow] duration-200"
            >
              {/* Stats header */}
              <div className="mb-6">
                <span
                  className="text-3xl font-extrabold text-[#1aa478] tabular-nums"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  {s.stat}
                </span>
                <p className="text-sm text-gray-500 mt-1">{s.statLabel}</p>
              </div>

              {/* Quote */}
              <p
                className="text-[15px] text-gray-700 leading-relaxed mb-8 flex-1"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                "{s.quote}"
              </p>

              {/* Attribution */}
              <div className="border-t border-gray-100 pt-5">
                <p
                  className="text-sm font-bold text-gray-900"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  {s.person}
                </p>
                <p className="text-xs text-gray-400">
                  {s.role}, {s.company}
                </p>
                <span className="inline-block mt-2 text-xs font-medium bg-gray-50 text-gray-500 rounded-full px-2.5 py-0.5">
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
