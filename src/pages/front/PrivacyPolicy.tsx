import { SiteHeader } from "@/components/front/SiteHeader"
import { SiteFooter } from "@/components/front/SiteFooter"

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
            <div className="prose prose-lg">
              <p className="text-gray-600 mb-6">Last updated: August 20, 2025</p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                <p className="text-gray-600">
                  Everpay Corporation ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains
                  how we collect, use, disclose, and safeguard your information when you use our payment processing
                  services and visit our website.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
                <h3 className="text-xl font-semibold mb-2">2.1 Personal Information</h3>
                <p className="text-gray-600 mb-4">We collect information that you provide directly to us, including:</p>
                <ul className="list-disc pl-6 mb-4 text-gray-600">
                  <li>Name and contact information</li>
                  <li>Business information</li>
                  <li>Payment information</li>
                  <li>Communication preferences</li>
                </ul>

                <h3 className="text-xl font-semibold mb-2">2.2 Automatically Collected Information</h3>
                <p className="text-gray-600 mb-4">When you use our services, we automatically collect:</p>
                <ul className="list-disc pl-6 mb-4 text-gray-600">
                  <li>Device information</li>
                  <li>Usage data</li>
                  <li>Location information</li>
                  <li>Cookies and similar technologies</li>
                </ul>
              </section>

              {/* Additional sections... */}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
