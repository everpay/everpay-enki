import { SiteHeader } from "@/components/front/SiteHeader"
import { SiteFooter } from "@/components/front/SiteFooter"
import { CTASection } from "@/components/front/CtaSection"
import { Button } from "@/components/ui/button"
import { Shield, LineChart, Brain, CheckCircle } from 'lucide-react'

import { Link } from "react-router-dom"

const fraudFeatures = [
  {
    title: "AI-Powered Detection",
    description: "Machine learning algorithms that adapt to new fraud patterns in real-time",
    icon: Brain,
    features: ["Behavioral biometrics", "Pattern recognition", "Anomaly detection", "Risk scoring"],
  },
  {
    title: "Real-time Monitoring",
    description: "24/7 transaction monitoring with instant alerts and automated responses",
    icon: LineChart,
    features: [
      "Live transaction screening",
      "Instant notifications",
      "Automated rules engine",
      "Custom alert thresholds",
    ],
  },
  {
    title: "Advanced Authentication",
    description: "Multi-layer authentication methods to verify legitimate users",
    icon: Shield,
    features: ["3D Secure 2.0", "Two-factor authentication", "Device fingerprinting", "IP intelligence"],
  },
]

const stats = [
  { value: "99.9%", label: "Fraud detection rate" },
  { value: "<0.1%", label: "False positive rate" },
  { value: "100ms", label: "Average response time" },
  { value: "24/7", label: "Real-time monitoring" },
]

const featureImages = [
  "https://images.unsplash.com/photo-1550751827-4bd374c3f1f5?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=600&fit=crop",
]

export default function FraudPreventionPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-white via-green-50 to-white py-20 md:py-32 animate-fade-in">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl animate-fade-in-up">
              <h1 className="text-4xl font-bold mb-6">Fraud Prevention & Risk Management</h1>
              <p className="text-xl opacity-90 mb-8 animate-fade-in-up animation-delay-200">
                Protect your business with advanced fraud detection and prevention systems powered by machine learning.
              </p>
              <div className="flex gap-4 animate-fade-in-up animation-delay-400">
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-105 transition-transform"
                >
                  Start Protection
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:scale-105 transition-transform"
                >
                  View Demo
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center animate-zoom-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="text-4xl font-bold text-accent mb-2">{stat.value}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="space-y-20">
              {fraudFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="grid md:grid-cols-2 gap-12 items-center animate-fade-in-up"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className={index % 2 === 1 ? "md:order-2" : ""}>
                    <feature.icon className="size-12 text-accent mb-6 animate-bounce-in" />
                    <h2 className="text-3xl font-bold mb-4">{feature.title}</h2>
                    <p className="text-muted-foreground mb-6">{feature.description}</p>
                    <ul className="space-y-3">
                      {feature.features.map((item, itemIndex) => (
                        <li
                          key={itemIndex}
                          className="flex items-center gap-2 animate-fade-in-left"
                          style={{ animationDelay: `${index * 200 + itemIndex * 100}ms` }}
                        >
                          <CheckCircle className="size-5 text-accent" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div
                    className={`relative h-[400px] rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow animate-fade-in ${index % 2 === 1 ? "md:order-1" : ""}`}
                  >
                    <img
                      src={featureImages[index] || "/placeholder.svg?height=400&width=600"}
                      alt={feature.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Risk Scoring Section */}
        <section className="bg-muted py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12 animate-fade-in-up">
              <h2 className="text-3xl font-bold mb-4">Intelligent Risk Scoring</h2>
              <p className="text-muted-foreground animate-fade-in-up animation-delay-200">
                Our advanced risk scoring engine analyzes hundreds of data points in real-time to accurately detect and
                prevent fraud.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "User Behavior Analysis",
                  items: ["Device fingerprinting", "Typing patterns", "Navigation behavior", "Purchase history"],
                },
                {
                  title: "Transaction Analysis",
                  items: ["Velocity checks", "Amount patterns", "Geographic location", "Time of transaction"],
                },
                {
                  title: "Network Analysis",
                  items: ["IP reputation", "Proxy detection", "Device networks", "Account linkages"],
                },
              ].map((category, index) => (
                <div
                  key={index}
                  className="bg-card p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow animate-fade-in-up"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <h3 className="text-xl font-semibold mb-4">{category.title}</h3>
                  <ul className="space-y-3">
                    {category.items.map((item, itemIndex) => (
                      <li
                        key={itemIndex}
                        className="flex items-center gap-2 animate-fade-in-left"
                        style={{ animationDelay: `${index * 200 + itemIndex * 100}ms` }}
                      >
                        <CheckCircle className="size-4 text-accent" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="bg-primary rounded-2xl text-primary-foreground p-8 md:p-12 animate-fade-in-up">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-4 animate-fade-in-up">Ready to protect your business?</h2>
                  <p className="opacity-90 mb-6 animate-fade-in-up animation-delay-200">
                    Start protecting your business with our advanced fraud prevention system today.
                  </p>
                  <div className="flex gap-4 animate-fade-in-up animation-delay-400">
                   <Link to="/signup">
                    <Button
                      size="lg"
                      className="bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-105 transition-transform"
                    >
                      Get Started
                    </Button>
                   </Link>
                    <Link to="/contact">
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:scale-105 transition-transform"
                    >
                      Contact Sales
                    </Button>
                    </Link>
                  </div>
                </div>
                <div className="relative h-[300px] rounded-lg overflow-hidden shadow-lg animate-fade-in-right animation-delay-600">
                  <img
                    src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop"
                    alt="Fraud Prevention"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <CTASection />
      <SiteFooter />
    </div>
  )
}
