import { SiteHeader } from "@/components/front/SiteHeader"
import { SiteFooter } from "@/components/front/SiteFooter"

export default function CookiePolicyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
            <div className="prose prose-lg">
              <p className="text-gray-600 mb-6">Last updated: October 20, 2023</p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">What Are Cookies?</h2>
                <p className="text-gray-600">
                  Cookies are small text files that are placed on your device when you visit our website. They help us
                  provide you with a better experience by remembering your preferences, analyzing site usage, and
                  assisting with our marketing efforts.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Types of Cookies We Use</h2>

                <h3 className="text-xl font-semibold mb-2">Essential Cookies</h3>
                <p className="text-gray-600 mb-4">
                  These cookies are necessary for the website to function properly. They enable basic functions like
                  page navigation and access to secure areas of the website.
                </p>

                <h3 className="text-xl font-semibold mb-2">Performance Cookies</h3>
                <p className="text-gray-600 mb-4">
                  These cookies help us understand how visitors interact with our website by collecting and reporting
                  information anonymously.
                </p>

                <h3 className="text-xl font-semibold mb-2">Functionality Cookies</h3>
                <p className="text-gray-600 mb-4">
                  These cookies allow the website to remember choices you make and provide enhanced, more personal
                  features.
                </p>

                <h3 className="text-xl font-semibold mb-2">Marketing Cookies</h3>
                <p className="text-gray-600 mb-4">
                  These cookies track your online activity to help advertisers deliver more relevant advertising or to
                  limit how many times you see an ad.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Managing Cookies</h2>
                <p className="text-gray-600">
                  You can control and/or delete cookies as you wish. You can delete all cookies that are already on your
                  computer and you can set most browsers to prevent them from being placed. However, if you do this, you
                  may have to manually adjust some preferences every time you visit our website.
                </p>
              </section>
            </div>
          </div>
        </div>
        
      </main>
     <SiteFooter />
    </div>
  )
}
