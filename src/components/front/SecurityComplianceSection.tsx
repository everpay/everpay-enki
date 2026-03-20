import { motion } from "framer-motion"
import { Shield, Lock, Eye, FileCheck, Server, AlertTriangle } from "lucide-react"

const items = [
  {
    icon: Shield,
    title: "PCI DSS Level 1",
    desc: "The highest level of security certification in the payments industry, validated annually by a QSA.",
  },
  {
    icon: Lock,
    title: "End-to-End Encryption",
    desc: "All card data is encrypted in transit and at rest. Tokenization ensures sensitive data never touches your servers.",
  },
  {
    icon: Eye,
    title: "3D Secure 2.0",
    desc: "Frictionless strong customer authentication that satisfies PSD2 and SCA requirements globally.",
  },
  {
    icon: FileCheck,
    title: "SOC 2 Type II",
    desc: "Independent audit verifying our controls for security, availability, and confidentiality of customer data.",
  },
  {
    icon: Server,
    title: "99.99% Uptime SLA",
    desc: "Redundant infrastructure across multiple availability zones with automatic failover and disaster recovery.",
  },
  {
    icon: AlertTriangle,
    title: "Real-Time Fraud Monitoring",
    desc: "Machine learning models analyze every transaction in milliseconds to detect and prevent fraudulent activity.",
  },
]

export function SecurityComplianceSection() {
  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <p
            className="text-sm font-semibold text-[#1aa478] uppercase tracking-wider mb-4"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Security & Compliance
          </p>
          <h2
            className="text-3xl md:text-[44px] font-extrabold text-gray-900 leading-tight mb-5"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Enterprise-grade security, built in.
          </h2>
          <p
            className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Your customers' data is protected by the same infrastructure trusted by the world's largest financial institutions.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl border border-gray-100 p-7 hover:shadow-lg hover:border-[#1aa478]/15 transition-[box-shadow,border-color] duration-200"
            >
              <div className="w-11 h-11 rounded-xl bg-[#1aa478]/10 flex items-center justify-center mb-5">
                <item.icon className="w-5 h-5 text-[#1aa478]" />
              </div>
              <h3
                className="text-base font-bold text-gray-900 mb-2"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                {item.title}
              </h3>
              <p
                className="text-sm text-gray-500 leading-relaxed"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
