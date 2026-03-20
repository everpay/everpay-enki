;

import { useState } from "react";
import { SiteHeader } from "@/components/front/SiteHeader";
import { SiteFooter } from "@/components/front/SiteFooter";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
;
import { Link } from "react-router-dom";

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-white via-green-50 to-white py-20 md:py-32 text-gray-900 overflow-hidden animate-fade-in">
          <div className="container mx-auto px-4 py-12 md:py-20">
            <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                  Intelligent payments for the modern business
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  Accept payments anywhere, analyze transactions in real-time,
                  and accelerate your business growth with our comprehensive
                  payment solutions.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <a
                    href="https://app.everpayinc.com/sign-up"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      size="lg"
                      className="bg-[#4CAF50] hover:bg-[#45a049] w-full sm:w-[180px] h-[48px] rounded-lg text-base font-medium"
                    >
                      Get started
                    </Button>
                  </a>

                  <Link to="/contact">
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-2 border-[#4CAF50] text-[#4CAF50] hover:bg-[#4CAF50]/10 w-full sm:w-[180px] h-[48px] rounded-lg text-base font-medium"
                    >
                      Contact sales
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="relative h-[300px] md:h-[400px] rounded-lg overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d"
                  alt="Modern payment system"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="border-b sticky top-0 bg-white z-50">
          <div className="container mx-auto px-4">
            <div className="flex overflow-x-auto">
              {["Overview", "Features", "Pricing"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  className={`px-6 py-4 text-lg font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.toLowerCase()
                      ? "text-black border-b-2 border-black"
                      : "text-gray-600 hover:text-black"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Overview Tab */}
        <div className={activeTab === "overview" ? "block" : "hidden"}>
          {/* Features Grid */}
          <section className="py-12 md:py-20">
            <div className="container mx-auto px-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {[
                  {
                    title: "In-Person Payments",
                    description:
                      "Accept all major cards, contactless, and mobile payments with our secure terminals.",
                    image:
                      "https://images.unsplash.com/photo-1556740758-90de374c12ad",
                  },
                  {
                    title: "Online Payments",
                    description:
                      "Seamlessly integrate payments into your website or mobile app with our APIs.",
                    image:
                      "https://images.unsplash.com/photo-1556740714-a8395b3bf30e",
                  },
                  {
                    title: "Mobile Payments",
                    description:
                      "Turn any smartphone into a payment terminal with our mobile card reader.",
                    image:
                      "https://images.unsplash.com/photo-1556741533-6e6a62bd8b49",
                  },
                ].map((feature, index) => (
                  <div key={index} className="relative group overflow-hidden rounded-lg">
                    <div className="relative h-[250px] md:h-[300px]">
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-0 p-6 text-white">
                        <h3 className="text-xl font-semibold mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-gray-200">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Benefits Section */}
          <section className="bg-gray-50 py-12 md:py-20 animate-fade-in">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">
                  Everything you need to succeed
                </h2>
                <p className="text-gray-600">
                  Our payment solutions come with powerful features designed to
                  help your business thrive.
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {[
                  {
                    title: "Next-Day Deposits",
                    description:
                      "Get your funds the next business day with our fast settlement process.",
                  },
                  {
                    title: "Fraud Prevention",
                    description:
                      "Advanced AI-powered fraud detection to protect your business.",
                  },
                  {
                    title: "Real-Time Analytics",
                    description:
                      "Track sales, refunds, and disputes with detailed reporting.",
                  },
                  {
                    title: "Multi-Currency Support",
                    description:
                      "Accept payments in 135+ currencies with automatic conversion.",
                  },
                  {
                    title: "24/7 Support",
                    description:
                      "Expert help available around the clock when you need it.",
                  },
                  {
                    title: "Developer-Friendly",
                    description:
                      "Robust APIs and SDKs for custom integration needs.",
                  },
                ].map((benefit, index) => (
                  <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="h-12 w-12 rounded-lg bg-[#4CAF50]/10 flex items-center justify-center mb-4">
                      <Check className="h-6 w-6 text-[#4CAF50]" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Features Tab */}
        <div className={activeTab === "features" ? "block" : "hidden"}>
          <section className="py-12 md:py-20 animate-fade-in">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold mb-12">Payment Features</h2>
                <div className="space-y-12">
                  {[
                    {
                      title: "Smart Payment Processing",
                      description:
                        "Intelligent routing and automatic retries ensure the highest possible success rates for your transactions.",
                      features: [
                        "Automatic card updates",
                        "Intelligent routing",
                        "Retry logic",
                        "Risk management",
                      ],
                    },
                    {
                      title: "Global Coverage",
                      description:
                        "Accept payments from customers anywhere in the world with support for multiple currencies and payment methods.",
                      features: [
                        "135+ currencies",
                        "Local payment methods",
                        "Automatic currency conversion",
                        "Regional tax compliance",
                      ],
                    },
                    {
                      title: "Developer Tools",
                      description:
                        "Comprehensive APIs and SDKs make it easy to integrate payments into your applications.",
                      features: [
                        "RESTful APIs",
                        "Client libraries",
                        "Webhooks",
                        "Testing environment",
                      ],
                    },
                  ].map((section, index) => (
                    <div key={index} className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-2xl font-semibold mb-4">
                          {section.title}
                        </h3>
                        <p className="text-gray-600 mb-6">
                          {section.description}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <ul className="space-y-4">
                          {section.features.map((feature, featureIndex) => (
                            <li
                              key={featureIndex}
                              className="flex items-center gap-3"
                            >
                              <Check className="h-5 w-5 text-[#4CAF50]" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Pricing Tab */}
        <div className={activeTab === "pricing" ? "block" : "hidden"}>
          <section className="py-12 md:py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold mb-6">
                  Simple, transparent pricing
                </h2>
                <p className="text-xl text-gray-600 mb-12">
                  No hidden fees. No long-term contracts. Just straightforward
                  pricing that scales with your business.
                </p>
                <div className="grid md:grid-cols-2 gap-8">
                  {[
                    {
                      title: "Card-Present",
                      rate: "1.9% + $0.10",
                      description: "For in-person payments",
                      features: [
                        "All major credit cards",
                        "Contactless payments",
                        "Mobile wallets",
                        "Next-day deposits",
                      ],
                    },
                    {
                      title: "Card-Not-Present",
                      rate: "2.9% + $0.30",
                      description: "For online payments",
                      features: [
                        "Online payments",
                        "Recurring billing",
                        "Payment links",
                        "Invoice payments",
                      ],
                    },
                  ].map((plan, index) => (
                    <div key={index} className="border rounded-lg p-8">
                      <h3 className="text-2xl font-semibold mb-2">
                        {plan.title}
                      </h3>
                      <div className="text-3xl font-bold text-[#4CAF50] mb-2">
                        {plan.rate}
                      </div>
                      <p className="text-gray-600 mb-6">{plan.description}</p>
                      <ul className="space-y-4">
                        {plan.features.map((feature, featureIndex) => (
                          <li
                            key={featureIndex}
                            className="flex items-center gap-3"
                          >
                            <Check className="h-5 w-5 text-[#4CAF50]" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* CTA Section */}
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="bg-[#0A2F2F] rounded-2xl text-white p-8 md:p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Ready to get started?
              </h2>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of businesses using Everpay to process millions
                in payments every day.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a
                  href="https://app.everpayinc.com/sign-up"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="lg" className="bg-[#4CAF50] hover:bg-[#45a049]">
                    Create account
                  </Button>
                </a>
                <Link to="/contact">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white text-white hover:bg-white/10"
                  >
                    Talk to sales
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
