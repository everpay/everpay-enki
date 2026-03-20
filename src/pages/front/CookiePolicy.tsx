import { SiteHeader } from "@/components/front/SiteHeader"
import { SiteFooter } from "@/components/front/SiteFooter"
import { Link } from "react-router-dom"

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="max-w-4xl mx-auto mb-16">
            <p className="text-sm font-medium text-[#1aa478] mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
              Legal Information
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              Cookie Policy
            </h1>
            <p className="text-gray-500 text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
              Last updated: March 1, 2026
            </p>
            <div className="flex gap-4 mt-6">
              <Link to="/privacy-policy" className="text-sm text-[#1aa478] hover:underline font-medium">Privacy Policy</Link>
              <Link to="/terms" className="text-sm text-[#1aa478] hover:underline font-medium">Terms & Conditions</Link>
              <Link to="/aml-policy" className="text-sm text-[#1aa478] hover:underline font-medium">AML Policy</Link>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-4xl mx-auto prose prose-gray prose-lg">
            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              What Are Cookies?
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay Corporation and its subsidiaries <strong>("we", "us", "Everpay")</strong> use automatic data collection tools including cookies and web beacons (e.g., tracking pixels) on our websites. Web beacons allow us to determine whether a user accessed content on a webpage. A cookie is a small piece of data that a website may store on your computer that a website may later retrieve to recognize a user's computer or device when they return. As explained below, some cookies are set by Everpay while others are set by third parties on our behalf. For privacy purposes, Everpay uses the term "cookie" to refer to all of the technologies described above (including web beacons).
            </p>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Cookies may also be used by Everpay on its portals or in its products, and on Everpay-hosted payment solutions (including on Everpay Checkout, Everpay POS products and services, Everpay Online, and the Everpay Dashboard).
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              Types of Cookies We Use
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay uses cookies for the following purposes:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              Strictly Necessary Cookies
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              These are cookies that are required for the operation of our websites. They include, for example, cookies that enable you to log into secure areas of our website, maintain your session state, and process payment transactions securely. Without these cookies, our services cannot function properly.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              Functionality Cookies
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              These cookies are used to recognize you when you return to our websites. These cookies also help us better understand your browsing habits and behaviors so that we can personalize your experience on our website (for example, by remembering your choice of language, region, or currency preference) and show you content that is relevant to you.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              Analytical / Performance Cookies
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay may use third-party cookies such as Google Analytics to help us gather and analyze information about the areas visited on our websites (e.g., the pages most read, time spent, search terms and other engagement data) to evaluate and improve the user experience and the websites. For more information or to opt-out using the Google Analytics opt-out browser add-on, see{" "}
              <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className="text-[#1aa478] hover:underline">
                "How Google uses information from sites or apps that use our services"
              </a>.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              Advertising / Marketing Cookies
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              These cookies help us make the advertising displayed to you more relevant to your interests and help us measure the effectiveness of our advertising on other websites. Everpay works with third parties such as advertising networks that use their own cookies on our website and other websites to build a profile of your interests and provide you with tailored ads across the Internet. This common marketing practice is typically referred to as interest-based or online behavioural advertising. These advertising networks may collect information about your activity on our websites and other websites to make predictions about your preferences and deliver ads that are relevant to you on other websites (including on social media platforms). This information may also be used to evaluate our online advertising campaigns.
            </p>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              For more information about interest-based advertising and to understand your options, including how you can opt-out of receiving interest-based ads from third-party advertising companies participating in the Digital Advertising Alliance of Canada (DAAC) Self-Regulatory Program for Online Interest-Based Advertising, please visit the DAAC website at:{" "}
              <a href="http://youradchoices.ca/choices" target="_blank" rel="noopener noreferrer" className="text-[#1aa478] hover:underline">
                http://youradchoices.ca/choices
              </a>.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              Other Cookies
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              As part of a product or service that we offer to merchants, partners, and other customers, we, or our third parties, may also use cookies for risk management tools, fraud prevention services, or other add-on services offered by Everpay.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              How to Adjust Your Cookie Preferences
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              When you first visit an Everpay website, a cookie notice will appear and require you to determine which cookies you wish to allow. You can adjust your cookie preferences at any time by clearing your browser cookies and revisiting our website.
            </p>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              You can customize your cookie preferences by enabling or disabling categories of cookies, or you can choose not to accept cookies by adjusting your browser settings. Should you choose not to accept cookies, some areas of the websites or our services may not function properly or optimally.
            </p>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              If you opt-out of interest-based advertising on our website, you will still see ads from us but the ads may be less relevant to you and your interests. In addition, various tracking technologies may still collect data for other purposes, including for analytics. To successfully opt-out, you must have cookies enabled in your web browser (see your browser's instructions for information on cookies and how to enable them). Your opt-out only applies to the web browser you use so you must opt-out of each web browser on each computer you use. Once you opt-out, if you delete your browser's saved cookies, you will need to opt-out again.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              Website Data
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay collects the Internet Protocol (IP) addresses of all visitors to our websites and other information such as page requests, browser type, operating system and average time spent on our website. We use this information to help us understand our website activity and to improve our websites.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              Questions About Our Cookie Policy
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              If you have questions or concerns about this Cookie Policy or Everpay's use of cookies, please contact our Privacy Office at{" "}
              <a href="mailto:privacy@everpayinc.com" className="text-[#1aa478] hover:underline">privacy@everpayinc.com</a>.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
