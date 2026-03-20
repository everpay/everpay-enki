import { Suspense } from "react"
import dynamic from "next/dynamic"

// Dynamically import the carousel with no SSR to prevent hydration issues
const PaymentPartnersCarouselNoSSR = dynamic(
  () => import("@/components/payment-partners-carousel").then((mod) => mod.PaymentPartnersCarousel),
  { ssr: false },
)

export function DynamicCarousel() {
  return (
    <Suspense fallback={<div className="w-full py-12 bg-white"></div>}>
      <PaymentPartnersCarouselNoSSR />
    </Suspense>
  )
}
