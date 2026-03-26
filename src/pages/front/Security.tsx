import { SiteHeader } from "@/components/front/SiteHeader"
import { SiteFooter } from "@/components/front/SiteFooter"
import { CTASection } from "@/components/front/CtaSection"
import { Button } from "@/components/ui/button"
import { Shield, Lock, CheckCircle, FileCheck, Server, Eye, Globe, ClipboardCheck } from "lucide-react"
import { Link } from "react-router-dom"

const securityPillars = [
  {
    title: "Enterprise-Grade Security",
    description: "PCI DSS, encryption, fraud monitoring",
    icon: Shield,
  },
  {
    title: "Global Compliance",
    description: "Network rules, regulatory alignment, audit-ready",
    icon: Globe,
  },
  {
    title: "Reliable Operations",
    description: "High availability, redundancy, real-time monitoring",
    icon: Server,
  },
]

const securityFeatures = [
  {
    title: "PCI DSS Compliance",
    description: "Our systems are fully aligned with PCI Data Security Standards to safeguard cardholder data.",
    icon: Shield,
  },
  {
    title: "Encryption & Data Protection",
    description: "Sensitive data is encrypted in transit and at rest, with strict access controls across our platform.",
    icon: Lock,
  },
  {
    title: "Fraud Prevention & Monitoring",
    description: "Advanced transaction monitoring and intelligent risk controls help detect and prevent fraudulent activity in real time.",
    icon: Eye,
  },
  {
    title: "Multi-Layered Security Architecture",
    description: "From network firewalls to secure APIs, Everpay is built with defense in depth for maximum resilience.",
    icon: FileCheck,
  },
]

const operationalFeatures = [
  {
    title: "High Availability & Redundancy",
    description: "Our cloud-based platform is designed to minimize downtime and ensure continuous payment processing.",
  },
  {
    title: "Disaster Recovery",
    description: "Robust backup and recovery procedures protect critical systems and data across multiple regions.",
  },
  {
    title: "Transparent Reporting & Auditability",
    description: "Centralized logging and reporting enable merchants and regulators to monitor activity and support compliance requirements.",
  },
]

const complianceFeatures = [
  {
    title: "Network Compliance",
    description: "Adheres to Visa, Mastercard, and other major card network requirements.",
  },
  {
    title: "Regulatory Awareness",
    description: "Designed to integrate with licensed financial institutions, acquirers, and local regulatory frameworks.",
  },
  {
    title: "Ongoing Reviews & Certifications",
    description: "Regular security assessments and audits to maintain the highest industry standards.",
  },
]

export default function SecurityPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-[#0A2F2F] text-white py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
                Secure Payments, Trusted Everywhere
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
                Everpay protects merchants, their customers, and partner institutions with enterprise-grade security, 
                compliance, and operational reliability — all on a unified payments platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-[#1aa478] hover:bg-[#158f68] text-white">
                  Learn More About Security
                </Button>
                <Link to="/demo">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white bg-transparent text-white hover:bg-white/10"
                  >
                    Request a Demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Why Merchants Trust Everpay */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              Why Merchants Trust Everpay
            </h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
              At Everpay, trust and security are at the core of everything we do. We know that payments are mission-critical, 
              so we design our platform to protect merchants, their customers, and partner institutions.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {securityPillars.map((pillar, index) => (
                <div key={index} className="p-8 border rounded-xl bg-white shadow-sm text-center hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 mx-auto mb-6 bg-[#1aa478]/10 rounded-full flex items-center justify-center">
                    <pillar.icon className="h-8 w-8 text-[#1aa478]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>{pillar.title}</h3>
                  <p className="text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>{pillar.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security You Can Rely On */}
        <section className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              Security You Can Rely On
            </h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
              Our platform is built from the ground up with security as a foundational principle.
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              {securityFeatures.map((feature, index) => (
                <div key={index} className="p-6 bg-white rounded-xl shadow-sm flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-[#1aa478]/10 rounded-lg flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-[#1aa478]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>{feature.title}</h3>
                    <p className="text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Operational Reliability */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              Operational Reliability
            </h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
              Built for continuous uptime and seamless payment processing at scale.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {operationalFeatures.map((feature, index) => (
                <div key={index} className="p-6 border rounded-xl bg-white shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-[#1aa478]" />
                    <h3 className="text-lg font-semibold" style={{ fontFamily: "Manrope, sans-serif" }}>{feature.title}</h3>
                  </div>
                  <p className="text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Compliance & Regulatory Alignment */}
        <section className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              Compliance & Regulatory Alignment
            </h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay is designed to operate within the requirements of regulated payment ecosystems. Our platform aligns 
              with industry standards and network rules to support compliant, secure, and transparent payment operations.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {complianceFeatures.map((feature, index) => (
                <div key={index} className="p-6 border rounded-xl bg-white shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <ClipboardCheck className="h-5 w-5 text-[#1aa478]" />
                    <h3 className="text-lg font-semibold" style={{ fontFamily: "Manrope, sans-serif" }}>{feature.title}</h3>
                  </div>
                  <p className="text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Partner CTA */}
        <section className="bg-[#0A2F2F] text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              A Trusted Payments Partner
            </h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay isn't just a payments platform — we are a trusted partner, enabling secure, compliant, 
              and reliable payment operations worldwide.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/demo">
                <Button size="lg" className="bg-[#1aa478] hover:bg-[#158f68] text-white">
                  Request a Demo
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="border-white bg-transparent text-white hover:bg-white/10">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <CTASection />
      <SiteFooter />
    </div>
  )
}
