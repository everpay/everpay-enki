import { useEffect, useRef } from "react"


export function PaymentPartnersSection() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const paymentMethods = [
    { name: "Visa", image: "/logos/visa.svg" },
    { name: "Mastercard", image: "/logos/mastercard.svg" },
    { name: "American Express", image: "/logos/american-express.svg" },
    { name: "Discover", image: "/logos/discover.svg" },
    { name: "PayPal", image: "/logos/paypal.jpg" },
    { name: "Apple Pay", image: "/logos/apple-pay.svg" },
    { name: "Google Pay", image: "/logos/google-pay.svg" },
    { name: "JCB", image: "/logos/jcb.svg" },
    { name: "UnionPay", image: "/logos/unionpay.svg" },
    { name: "Stripe", image: "/logos/stripe.jpg" },
    { name: "Square", image: "/logos/square.jpg" },
    { name: "Alipay", image: "/logos/alipay.jpg" },
    { name: "WeChat Pay", image: "/logos/wechat-pay.jpg" },
    { name: "PIX", image: "/logos/pix.jpg" },
    { name: "Mercado Pago", image: "/logos/mercado-pago.jpg" },
    { name: "PagSeguro", image: "/logos/pagseguro.jpg" },
    { name: "PayU", image: "/logos/payu.jpg" },
    { name: "Boleto", image: "/logos/boleto.jpg" },
    { name: "OXXO", image: "/logos/oxxo.jpg" },
    { name: "Klarna", image: "/logos/klarna.jpg" },
    { name: "Affirm", image: "/logos/affirm.jpg" },
    { name: "Afterpay", image: "/logos/afterpay.jpg" },
    { name: "Venmo", image: "/logos/venmo.jpg" },
    { name: "Cash App", image: "/logos/cashapp.jpg" },
    { name: "Zelle", image: "/logos/zelle.jpg" },
    { name: "Samsung Pay", image: "/logos/samsung-pay.jpg" },
    { name: "Crypto", image: "/logos/crypto.svg" },
  ]

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    let scrollPosition = 0
    const scrollSpeed = 0.5

    const scroll = () => {
      scrollPosition += scrollSpeed
      if (scrollPosition >= scrollContainer.scrollWidth / 2) {
        scrollPosition = 0
      }
      scrollContainer.scrollLeft = scrollPosition
    }

    const intervalId = setInterval(scroll, 20)

    return () => clearInterval(intervalId)
  }, [])

  return (
    <section className="py-16 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Trusted Payment Methods Worldwide
          </p>
        </div>
        <div ref={scrollRef} className="flex gap-12 overflow-x-hidden" style={{ scrollBehavior: "auto" }}>
          {[...paymentMethods, ...paymentMethods].map((method, index) => (
            <div
              key={`${method.name}-${index}`}
              className="flex-shrink-0 flex items-center justify-center hover:scale-110 transition-transform duration-300"
            >
              <div className="relative w-32 h-16 transition-all duration-300">
                <img
                  src={method.image || "/placeholder.svg"}
                  alt={method.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  className="object-contain p-2"
                  sizes="128px"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
