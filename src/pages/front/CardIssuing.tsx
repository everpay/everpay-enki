import { SiteHeader } from "@/components/front/SiteHeader"
import { SiteFooter } from "@/components/front/SiteFooter"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

import { 
  CreditCard, 
  Shield, 
  Zap, 
  Globe, 
  Smartphone, 
  BarChart3, 
  Lock, 
  Settings, 
  CheckCircle,
  ArrowRight,
  Wallet,
  Building2,
  ShoppingBag,
  Users,
  TrendingUp,
  Clock
} from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Instant Virtual Cards",
    description: "Issue virtual cards instantly to your customers or employees. Cards are ready to use within seconds for online purchases, subscriptions, and digital wallets."
  },
  {
    icon: CreditCard,
    title: "Custom Physical Cards",
    description: "Design and issue branded physical cards with your logo and colors. Offer your customers a premium, tangible payment experience that reinforces your brand."
  },
  {
    icon: Settings,
    title: "Dynamic Spend Controls",
    description: "Set spending limits, restrict merchant categories, enable or disable international transactions, and manage card settings in real-time through our API or dashboard."
  },
  {
    icon: Shield,
    title: "Advanced Fraud Protection",
    description: "Built-in fraud detection and prevention tools including 3D Secure, real-time transaction monitoring, and instant card freezing capabilities."
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Track spending patterns, transaction volumes, and card usage with comprehensive reporting and analytics tools built into your dashboard."
  },
  {
    icon: Globe,
    title: "Global Acceptance",
    description: "Cards are accepted at millions of merchants worldwide. Support for multiple currencies and seamless international transactions."
  }
]

const useCases = [
  {
    icon: ShoppingBag,
    title: "Expense Management",
    description: "Empower your team with corporate cards that have built-in spending limits and real-time expense tracking. Eliminate reimbursement hassles and gain instant visibility into company spending.",
    benefits: ["Automated expense categorization", "Receipt capture and matching", "Policy enforcement at point of sale"]
  },
  {
    icon: Users,
    title: "Customer Rewards Programs",
    description: "Launch branded prepaid or rewards cards that drive customer loyalty. Enable cashback, points accumulation, and exclusive merchant offers directly on the card.",
    benefits: ["Customizable reward structures", "White-label card designs", "Customer spending insights"]
  },
  {
    icon: Wallet,
    title: "Payouts & Disbursements",
    description: "Instantly pay contractors, vendors, or affiliates with virtual or physical cards. Eliminate the delays and costs associated with traditional payment methods.",
    benefits: ["Instant fund availability", "No bank account required", "Multi-currency support"]
  },
  {
    icon: Building2,
    title: "Fleet & Travel Management",
    description: "Issue cards specifically for fuel purchases, travel expenses, or on-the-road costs. Get detailed transaction data and control spending by merchant category.",
    benefits: ["Fuel-only card restrictions", "Real-time location tracking", "Detailed L3 transaction data"]
  }
]

const stats = [
  { value: "50M+", label: "Cards Issued" },
  { value: "$10B+", label: "Transaction Volume" },
  { value: "99.99%", label: "Platform Uptime" },
  { value: "150+", label: "Countries Supported" }
]

const processSteps = [
  {
    step: "01",
    title: "Integrate Our API",
    description: "Connect to our RESTful API with comprehensive documentation and sandbox environment. Most merchants integrate within days, not weeks."
  },
  {
    step: "02",
    title: "Configure Your Program",
    description: "Design your card program through our dashboard. Set spending rules, customize card designs, and configure reward structures."
  },
  {
    step: "03",
    title: "Issue Cards",
    description: "Start issuing virtual cards instantly or order custom physical cards. Each card is linked to your program settings automatically."
  },
  {
    step: "04",
    title: "Manage & Scale",
    description: "Monitor transactions, manage cards, and scale your program with our enterprise-grade infrastructure designed for growth."
  }
]

export default function CardIssuingPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main>
        {/* Hero Section */}
        <section className="relative bg-[#0A2F2F] text-white py-24 md:py-32 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-72 h-72 bg-[#1aa478] rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#1aa478] rounded-full blur-3xl" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-[#1aa478] font-medium mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
                  Card Issuing Platform
                </p>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight" style={{ fontFamily: "Manrope, sans-serif" }}>
                  Issue Cards.<br />
                  <span className="text-[#1aa478]">Control Spending.</span><br />
                  Grow Revenue.
                </h1>
                <p className="text-xl text-gray-300 mb-8 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                  Launch virtual and physical card programs for your merchants and customers. 
                  Build expense management, rewards programs, or payouts with our powerful card issuing infrastructure.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/demo">
                    <Button size="lg" className="bg-[#1aa478] hover:bg-[#158f68] text-white rounded-full px-8 h-12 text-base font-semibold">
                      Start Issuing Cards
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/contact">
                    <Button variant="outline" size="lg" className="border-white/30 bg-transparent text-white hover:bg-white/10 rounded-full px-8 h-12 text-base font-semibold">
                      Talk to Sales
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=800&q=80"
                    alt="Card issuing platform dashboard"
                    width={800}
                    height={600}
                    className="w-full h-auto"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1aa478]/10 rounded-full flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-[#1aa478]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Card Issued</p>
                      <p className="text-xs text-gray-500">Virtual Visa ending 4242</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <p className="text-4xl md:text-5xl font-bold text-[#1aa478] mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>
                    {stat.value}
                  </p>
                  <p className="text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <p className="text-sm font-medium text-[#1aa478] mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
                Platform Capabilities
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
                Everything You Need to Issue and Manage Cards
              </h2>
              <p className="text-lg text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>
                From instant virtual card creation to custom physical cards with your branding, 
                our platform provides all the tools merchants need to launch successful card programs.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-[#1aa478]/10 rounded-xl flex items-center justify-center mb-6">
                    <feature.icon className="h-6 w-6 text-[#1aa478]" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <p className="text-sm font-medium text-[#1aa478] mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
                Use Cases
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
                Built for Merchants of All Types
              </h2>
              <p className="text-lg text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>
                Whether you're building expense management tools, loyalty programs, or payout solutions, 
                our card issuing platform adapts to your unique business needs.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {useCases.map((useCase, index) => (
                <div key={index} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 bg-[#1aa478]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <useCase.icon className="h-6 w-6 text-[#1aa478]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>
                        {useCase.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                        {useCase.description}
                      </p>
                    </div>
                  </div>
                  <div className="pl-16">
                    <ul className="space-y-2">
                      {useCase.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-center gap-2 text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>
                          <CheckCircle className="h-4 w-4 text-[#1aa478] flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <p className="text-sm font-medium text-[#1aa478] mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
                How It Works
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
                Launch Your Card Program in Days, Not Months
              </h2>
              <p className="text-lg text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>
                Our streamlined integration process and comprehensive documentation 
                get you from signup to issuing cards faster than any other platform.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {processSteps.map((step, index) => (
                <div key={index} className="relative">
                  <div className="text-6xl font-bold text-gray-100 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                    {step.description}
                  </p>
                  {index < processSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 right-0 w-8">
                      <ArrowRight className="h-6 w-6 text-gray-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="py-24 bg-[#0A2F2F] text-white">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-[#1aa478] font-medium mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
                  Enterprise-Grade Security
                </p>
                <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
                  Bank-Level Security for Every Card
                </h2>
                <p className="text-lg text-gray-300 mb-8 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                  Every card issued through Everpay is protected by industry-leading security measures. 
                  From PCI DSS Level 1 compliance to real-time fraud monitoring, we ensure your card 
                  program is secure at every level.
                </p>
                <ul className="space-y-4">
                  {[
                    "PCI DSS Level 1 certified infrastructure",
                    "3D Secure 2.0 for online transactions",
                    "Real-time fraud detection and prevention",
                    "Instant card freezing and controls",
                    "Tokenization for secure data storage",
                    "24/7 transaction monitoring"
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-[#1aa478] flex-shrink-0" />
                      <span className="text-gray-300" style={{ fontFamily: "Inter, sans-serif" }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80"
                  alt="Secure card infrastructure"
                  width={800}
                  height={600}
                  className="rounded-2xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* API Preview Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="bg-gray-900 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <pre className="text-sm text-gray-300 overflow-x-auto">
{`// Create a virtual card
const card = await everpay.cards.create({
  type: 'virtual',
  cardholder_name: 'John Doe',
  spending_limit: {
    amount: 5000,
    interval: 'monthly'
  },
  merchant_categories: ['travel', 'office'],
  metadata: {
    department: 'Engineering',
    employee_id: 'EMP-12345'
  }
});

// Card created successfully
{
  id: 'card_1234567890',
  last4: '4242',
  exp_month: 12,
  exp_year: 2027,
  status: 'active',
  ...
}`}
                  </pre>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <p className="text-sm font-medium text-[#1aa478] mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
                  Developer-First
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
                  Simple, Powerful APIs
                </h2>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                  Our RESTful APIs and webhooks make it easy to integrate card issuing into your 
                  existing systems. Comprehensive documentation, SDKs for popular languages, 
                  and a full sandbox environment help you get started quickly.
                </p>
                <ul className="space-y-4 mb-8">
                  {[
                    "RESTful API with JSON responses",
                    "Webhooks for real-time event notifications",
                    "SDKs for Node.js, Python, Ruby, and more",
                    "Interactive API documentation",
                    "Full sandbox environment for testing"
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-[#1aa478] flex-shrink-0" />
                      <span className="text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/contact">
                  <Button className="bg-[#1aa478] hover:bg-[#158f68] text-white rounded-full px-6 h-11 text-base font-semibold">
                    View API Documentation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-[#1aa478]">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              Ready to Launch Your Card Program?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
              Join thousands of merchants already using Everpay to issue cards, 
              manage spending, and unlock new revenue streams.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/demo">
                <Button size="lg" className="bg-white text-[#1aa478] hover:bg-gray-100 rounded-full px-8 h-12 text-base font-semibold">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="border-white bg-transparent text-white hover:bg-white/10 rounded-full px-8 h-12 text-base font-semibold">
                  Schedule a Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
