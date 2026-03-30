import { motion } from "framer-motion"

const stats = [
  { value: "99.99%", label: "Uptime guarantee" },
  { value: "135+", label: "Currencies supported" },
  { value: "1K+", label: "Active merchants" },
  { value: "<200ms", label: "Average response time" },
]

export function StatsSection() {
  return (
    <section className="py-16 bg-white border-y border-border">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <div className="text-4xl lg:text-5xl font-extrabold text-foreground mb-2 font-heading tabular-nums tracking-tight">
                {stat.value}
              </div>
              <div className="text-base text-muted-foreground font-body">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
