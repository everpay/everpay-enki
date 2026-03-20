import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Monitor, Smartphone, LayoutGrid, ChefHat, CreditCard, Wifi, ArrowRight } from "lucide-react"

const products = [
  {
    title: "Countertop POS",
    description: "Full-featured touchscreen terminals for high-volume environments. Accept chip, tap, swipe, and mobile wallet payments with sub-2s processing.",
    image: "https://live.staticflickr.com/65535/52563428857_7a6a0d3c2e_b.jpg",
    icon: Monitor,
    specs: ["15\" HD touchscreen", "Built-in receipt printer", "Dual-band WiFi + 4G LTE"],
  },
  {
    title: "Self-Order Kiosk",
    description: "Reduce wait times and increase average order value by 22%. Customers browse, customize, and pay — all without staff intervention.",
    image: "https://live.staticflickr.com/65535/52089015588_5d5f6e0f9b_b.jpg",
    icon: LayoutGrid,
    specs: ["21\" interactive display", "ADA-compliant height", "Integrated card reader"],
  },
  {
    title: "Handheld POS",
    description: "Tableside ordering and pay-at-table in a compact device. Perfect for full-service restaurants, outdoor events, and delivery drivers.",
    image: "https://live.staticflickr.com/65535/51893672984_fb9e6a14a5_b.jpg",
    icon: Smartphone,
    specs: ["6\" ruggedized screen", "12-hour battery", "NFC + chip + magstripe"],
  },
  {
    title: "Kitchen Display System",
    description: "Eliminate paper tickets. Orders flow directly from POS to kitchen screens with priority queuing and bump-bar support.",
    image: "https://live.staticflickr.com/65535/52457832798_9a7e1f5a2b_b.jpg",
    icon: ChefHat,
    specs: ["Grease-resistant display", "Real-time order routing", "Multi-station sync"],
  },
  {
    title: "Smart Card Reader",
    description: "Compact Bluetooth reader that pairs with any phone or tablet. Accept contactless, chip, and mobile wallets anywhere.",
    image: "https://live.staticflickr.com/65535/52372108638_e2c5f8e3a6_b.jpg",
    icon: CreditCard,
    specs: ["Bluetooth 5.0", "USB-C charging", "EMV L1/L2 certified"],
  },
  {
    title: "Connected Hub",
    description: "Central management console that syncs all your devices, tracks inventory, and pushes menu updates across locations in real time.",
    image: "https://live.staticflickr.com/65535/52608907844_be2c8a1f1d_b.jpg",
    icon: Wifi,
    specs: ["Cloud-based dashboard", "Multi-location support", "Role-based access"],
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
}

export function PosProductSuiteSection() {
  return (
    <section className="py-24 lg:py-32 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-3">
            Hardware &amp; Devices
          </p>
          <h2
            className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl mb-5"
            style={{ lineHeight: 1.1 }}
          >
            Point-of-Sale That Moves<br className="hidden sm:block" /> As Fast As You Do
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto" style={{ textWrap: "pretty" as any }}>
            From countertop terminals to self-order kiosks, every Everpay device is built for speed, security, and seamless integration with your stack.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {products.map((product) => {
            const Icon = product.icon
            return (
              <motion.div
                key={product.title}
                variants={itemVariants}
                className="group relative rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300"
              >
                {/* Image */}
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/90 text-primary-foreground">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <h3 className="text-lg font-semibold text-white drop-shadow-md">{product.title}</h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {product.description}
                  </p>
                  <ul className="space-y-2 mb-5">
                    {product.specs.map((spec) => (
                      <li key={spec} className="flex items-center gap-2 text-sm text-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        {spec}
                      </li>
                    ))}
                  </ul>
                  <Link to="/solutions/pos">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-0 text-primary hover:text-primary/80 group/btn"
                    >
                      Learn more
                      <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 text-center"
        >
          <Link to="/demo">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Book a Hardware Demo
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
