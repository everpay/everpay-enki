import { SiteHeader } from "@/components/front/SiteHeader"
import { HeroSection } from "@/components/front/HeroSection"
import { StatsSection } from "@/components/front/StatsSection"
import { PaymentPartnersSection } from "@/components/front/PaymentPartnersCarousel"
import { FeaturesSection } from "@/components/front/FeaturesSection"
import { CheckoutProtectionSection } from "@/components/front/CheckoutProtectionSection"
import { BusinessTypesSection } from "@/components/front/BusinessTypesSection"
import { CTASection } from "@/components/front/CtaSection"
import { SiteFooter } from "@/components/front/SiteFooter"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main>
        <HeroSection />
        <StatsSection />
        <PaymentPartnersSection />
        <FeaturesSection />
        <CheckoutProtectionSection />
        <BusinessTypesSection />
        <CTASection />
      </main>
      <SiteFooter />
    </div>
  )
}
