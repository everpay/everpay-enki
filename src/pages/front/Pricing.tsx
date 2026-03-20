import { SiteHeader } from "@/components/front/SiteHeader"
import { SiteFooter } from "@/components/front/SiteFooter"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      price: "$0",
      description: "Perfect for side projects and testing",
      features: [
        "Up to $10,000 in monthly volume",
        "2.9% + 30¢ per transaction",
        "Basic fraud protection",
        "Email support",
        "Standard reporting",
      ],
    },
    {
      name: "Professional",
      price: "$99",
      description: "For growing businesses",
      popular: true,
      features: [
        "Up to $100,000 in monthly volume",
        "2.7% + 30¢ per transaction",
        "Advanced fraud protection",
        "Priority support",
        "Advanced analytics",
        "Custom branding",
        "Multi-currency support",
      ],
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large-scale operations",
      features: [
        "Unlimited monthly volume",
        "Custom pricing",
        "Dedicated fraud protection",
        "24/7 phone support",
        "Custom integrations",
        "Dedicated account manager",
        "SLA guarantee",
        "White-label solution",
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-white via-green-50 to-white animate-fade-in">
          <div className="container mx-auto px-4 text-center">
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Simple, transparent pricing
            </h1>
            <p
              className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Choose the plan that's right for your business. All plans include our core payment processing features.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20 animate-fade-in">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
                <Card
                  key={index}
                  className={`relative rounded-2xl ${
                    plan.popular ? "border-2 border-[#1aa478] shadow-2xl scale-105" : "border-2 border-gray-200"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#1aa478] text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle
                      className="text-2xl font-bold mb-2 text-gray-900"
                      style={{ fontFamily: "Manrope, sans-serif" }}
                    >
                      {plan.name}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>
                      {plan.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="mb-8">
                      <div className="flex items-baseline">
                        <span
                          className="text-5xl font-bold text-gray-900"
                          style={{ fontFamily: "Manrope, sans-serif" }}
                        >
                          {plan.price}
                        </span>
                        {plan.price !== "Custom" && <span className="ml-2 text-gray-600">/month</span>}
                      </div>
                    </div>

                    <ul className="space-y-4">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <Check className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0 text-[#1aa478]" />
                          <span className="text-sm text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <a
                      href="https://app.everpayinc.com/sign-up"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button
                        className={`w-full rounded-full ${
                          plan.popular
                            ? "bg-[#1aa478] hover:bg-[#158f64] text-white"
                            : "bg-gray-900 hover:bg-gray-800 text-white"
                        }`}
                        size="lg"
                      >
                        Get Started
                      </Button>
                    </a>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-gray-50 animate-fade-in">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2
              className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Frequently asked questions
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>
                  Can I change plans later?
                </h3>
                <p className="text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll
                  prorate any charges.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>
                  What payment methods do you accept?
                </h3>
                <p className="text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>
                  We accept all major credit cards, debit cards, and digital wallets including Apple Pay and Google Pay.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>
                  Is there a setup fee?
                </h3>
                <p className="text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>
                  No, there are no setup fees for any of our plans. You only pay the monthly subscription fee and
                  transaction fees.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
