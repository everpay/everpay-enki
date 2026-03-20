import { useState } from "react"
import { ChevronDown } from "lucide-react"

const values = [
  {
    title: "Your growth is our only metric.",
    description:
      "We measure our success by yours. Every feature we build, every optimization we ship, is designed to help you accept more payments and grow faster. We don't charge hidden fees or lock you into contracts — we earn your business every month.",
  },
  {
    title: "Transparent pricing, no surprises.",
    description:
      "Payment processing is complicated enough. Our pricing is simple: flat rates with no hidden fees, no surprise charges, and no long-term contracts. You see exactly what you pay and why.",
  },
  {
    title: "You own your data and your customers.",
    description:
      "Your transaction data, customer information, and payment history belong to you. If you ever decide to leave Everpay, you take everything with you. We believe the best way to keep customers is to make it easy for them to leave.",
  },
]

export function ValuesSection() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section className="py-20 md:py-28 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-3xl md:text-[40px] font-extrabold text-gray-900 leading-tight mb-4"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Three beliefs that guide our company
          </h2>
          <p className="text-gray-500 text-lg mb-12" style={{ fontFamily: "Inter, sans-serif" }}>
            Understand the principles behind every decision we make.
          </p>

          <div className="space-y-0">
            {values.map((value, index) => (
              <div
                key={index}
                className="border-t border-gray-200 last:border-b"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                  className="w-full flex items-start justify-between py-6 text-left group"
                >
                  <div className="flex items-start gap-4 pr-4">
                    <span
                      className="flex-shrink-0 text-sm font-bold text-[#1aa478] mt-0.5"
                      style={{ fontFamily: "Manrope, sans-serif" }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3
                      className="text-lg md:text-xl font-bold text-gray-900 group-hover:text-[#1aa478] transition-colors"
                      style={{ fontFamily: "Manrope, sans-serif" }}
                    >
                      {value.title}
                    </h3>
                  </div>
                  <ChevronDown
                    className={`flex-shrink-0 w-5 h-5 text-gray-400 mt-1 transition-transform duration-200 ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openIndex === index && (
                  <div className="pb-6 pl-10">
                    <p
                      className="text-gray-500 text-base leading-relaxed max-w-2xl"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {value.description}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
