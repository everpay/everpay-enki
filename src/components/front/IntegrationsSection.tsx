import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"

const integrations = [
  { name: "Shopify", category: "E-commerce" },
  { name: "BigCommerce", category: "E-commerce" },
  { name: "WooCommerce", category: "E-commerce" },
  { name: "Magento", category: "E-commerce" },
  { name: "QuickBooks", category: "Accounting" },
  { name: "Xero", category: "Accounting" },
  { name: "Salesforce", category: "CRM" },
  { name: "HubSpot", category: "CRM" },
  { name: "Zapier", category: "Automation" },
  { name: "Slack", category: "Notifications" },
  { name: "NetSuite", category: "ERP" },
  { name: "SAP", category: "ERP" },
]

export function IntegrationsSection() {
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
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 font-body">Integrations</p>
          <h2 className="text-[32px] md:text-[44px] lg:text-[52px] font-extrabold text-foreground leading-[1.1] tracking-[-0.02em] mb-6 font-heading">
            Works with the tools you already use.
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed font-body">
            Connect Everpay to your existing stack in minutes. Pre-built integrations for the most popular platforms.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
          {integrations.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center rounded-2xl border border-border bg-secondary/30 p-6 hover:bg-card hover:shadow-md hover:border-primary/15 transition-all duration-200 text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-sm font-bold text-primary font-heading">{item.name.charAt(0)}</span>
              </div>
              <p className="text-sm font-semibold text-foreground font-heading">{item.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5 font-body">{item.category}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <Link to="/partners" className="inline-flex items-center gap-2 text-primary font-semibold text-[15px] hover:underline font-body">
            View all integrations
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
