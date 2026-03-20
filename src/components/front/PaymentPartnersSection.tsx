import { useEffect, useRef } from "react"

export function PaymentPartnersCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const partners = ["Visa", "Mastercard", "American Express", "PayPal", "Apple Pay", "Google Pay", "Stripe", "Square"]

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    let scrollPosition = 0
    const scrollSpeed = 1

    const scroll = () => {
      scrollPosition += scrollSpeed
      if (scrollPosition >= scrollContainer.scrollWidth / 2) {
        scrollPosition = 0
      }
      scrollContainer.scrollLeft = scrollPosition
    }

    const intervalId = setInterval(scroll, 30)

    return () => clearInterval(intervalId)
  }, [])

  return (
    <section className="bg-muted/30 py-12 overflow-hidden animate-fade-in">
      <div className="container mb-8">
        <div className="text-center mb-12">
          <p className="text-sm font-medium mb-8" style={{ color: "#6b7280" }}>
            TRUSTED BY LEADING COMPANIES WORLDWIDE
          </p>
        </div>
        <h2 className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider animate-fade-in-up">
          Trusted Payment Partners
        </h2>
      </div>
      <div ref={scrollRef} className="flex gap-12 overflow-x-hidden" style={{ scrollBehavior: "auto" }}>
        {[...partners, ...partners].map((partner, index) => (
          <div
            key={index}
            className="flex-shrink-0 flex items-center justify-center px-8 hover:scale-110 transition-transform"
          >
            <span className="text-2xl font-bold text-muted-foreground/60 hover:text-muted-foreground transition-colors">
              {partner}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
