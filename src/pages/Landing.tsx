import { SiteHeader } from "@/components/front/SiteHeader"
import { HeroSection } from "@/components/front/HeroSection"
import { StatsSection } from "@/components/front/StatsSection"
import { PaymentPartnersSection } from "@/components/front/PaymentPartnersCarousel"
import { FeaturesSection } from "@/components/front/FeaturesSection"
import { GlobalReachSection } from "@/components/front/GlobalReachSection"
import { DeveloperSection } from "@/components/front/DeveloperSection"
import { SecurityComplianceSection } from "@/components/front/SecurityComplianceSection"
import { IntegrationsSection } from "@/components/front/IntegrationsSection"
import { CheckoutProtectionSection } from "@/components/front/CheckoutProtectionSection"
import { EnterpriseProofSection } from "@/components/front/EnterpriseProofSection"
import { BusinessTypesSection } from "@/components/front/BusinessTypesSection"
import { PlatformSection } from "@/components/front/PlatformSection"
import { CTASection } from "@/components/front/CtaSection"
import { SiteFooter } from "@/components/front/SiteFooter"
import { CookieNotice } from "@/components/front/CookieNotice"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main>
        <HeroSection />
        <StatsSection />
        <PaymentPartnersSection />
        <FeaturesSection />
        <GlobalReachSection />
        <BusinessTypesSection />
        <DeveloperSection />
        <SecurityComplianceSection />
        <IntegrationsSection />
        <EnterpriseProofSection />
        <CheckoutProtectionSection />
        <PlatformSection />
        <CTASection />
      </main>
      <SiteFooter />
      <CookieNotice />
    </div>
  )
}
