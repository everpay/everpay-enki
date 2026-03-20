import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

export function CTASection() {
  return (
    <section className="py-20 md:py-28 bg-[#0A2F2F]">
      <div className="container mx-auto px-6 text-center">
        <h2
          className="text-3xl md:text-[44px] font-extrabold text-white leading-tight mb-5"
          style={{ fontFamily: "Manrope, sans-serif" }}
        >
          Ready to grow your business?
        </h2>
        <p
          className="text-lg text-white/60 mb-10 max-w-lg mx-auto leading-relaxed"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Get a free demo and see how Everpay can help you accept payments globally, prevent fraud, and increase revenue.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/demo">
            <Button
              size="lg"
              className="bg-[#1aa478] hover:bg-[#158f68] text-white rounded-full px-8 h-12 text-base font-semibold shadow-none min-w-[200px]"
            >
              Get a free demo
            </Button>
          </Link>
          <Link to="/contact">
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white/20 bg-transparent text-white hover:bg-white/10 rounded-full px-8 h-12 text-base font-semibold shadow-none min-w-[200px]"
            >
              Contact sales
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
