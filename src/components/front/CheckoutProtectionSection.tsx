import { Star } from "lucide-react"

const testimonials = [
  {
    quote: "Everpay transformed our payment operations. We've seen a 40% increase in successful transactions since switching.",
    name: "Sarah Chen",
    title: "CTO, UrbanMarket",
  },
  {
    quote: "The fraud protection alone has saved us over $200K. And the integration was incredibly smooth.",
    name: "Marcus Rivera",
    title: "Head of Payments, FlowCommerce",
  },
  {
    quote: "We went from 3 payment providers to just Everpay. Simpler, cheaper, and our conversion rate is up 18%.",
    name: "Aisha Patel",
    title: "VP Operations, ShopWave",
  },
  {
    quote: "Their support team is incredible. Available 24/7 and deeply knowledgeable about global payment regulations.",
    name: "James O'Brien",
    title: "CEO, QuickShip Logistics",
  },
  {
    quote: "Expanding into Latin America was seamless with Everpay. PIX, Boleto, OXXO - all just worked from day one.",
    name: "Lucia Fernandez",
    title: "Growth Lead, Tienda Digital",
  },
  {
    quote: "The dashboard gives us real-time visibility into every transaction across 12 countries. Game changer.",
    name: "David Kim",
    title: "CFO, NexGen Retail",
  },
]

export function CheckoutProtectionSection() {
  return (
    <section className="py-20 md:py-28 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-14">
          <h2
            className="text-3xl md:text-[40px] font-extrabold text-gray-900 leading-tight mb-4"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            See why businesses trust Everpay
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
            Over 500 businesses have switched to Everpay for faster, more reliable payment processing.
          </p>
        </div>

        {/* Testimonial grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-[#1aa478] text-[#1aa478]" />
                ))}
              </div>
              <p className="text-gray-700 text-[15px] leading-relaxed mb-5" style={{ fontFamily: "Inter, sans-serif" }}>
                {`"${t.quote}"`}
              </p>
              <div>
                <p className="text-sm font-semibold text-gray-900" style={{ fontFamily: "Manrope, sans-serif" }}>
                  {t.name}
                </p>
                <p className="text-sm text-gray-400">{t.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
