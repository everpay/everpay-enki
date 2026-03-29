import { SiteHeader } from "@/components/front/SiteHeader"
import { SiteFooter } from "@/components/front/SiteFooter"
import { CTASection } from "@/components/front/CtaSection"
import { Link } from "react-router-dom"

export default function PrivacyPolicyPage() {
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
              Privacy Policy
            </h1>
            <p className="text-gray-500 text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
              Last updated: March 1, 2026
            </p>
            <div className="flex gap-4 mt-6">
              <Link to="/terms" className="text-sm text-[#1aa478] hover:underline font-medium">Terms & Conditions</Link>
              <Link to="/cookie-policy" className="text-sm text-[#1aa478] hover:underline font-medium">Cookie Policy</Link>
              <Link to="/aml-policy" className="text-sm text-[#1aa478] hover:underline font-medium">AML Policy</Link>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-4xl mx-auto prose prose-gray prose-lg">

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              Everpay's Commitment to Privacy
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay Corporation and its subsidiaries <strong>("we", "us", "Everpay")</strong> are committed to maintaining the accuracy, confidentiality, and security of Personal Information. We respect rights under applicable privacy laws and only collect, use, and disclose Personal Information in accordance with those laws.
            </p>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              This Privacy Statement describes the Personal Information we collect, use, and disclose in the course of providing services to our merchants, partners, and other customers, including payment processing services, value-added services, or hardware and hardware support services, as well as information we collect from prospective customers, applicants, and website visitors.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              1. Privacy Management Program
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay maintains a comprehensive privacy management program (the <strong>"Privacy Management Program"</strong>) applicable to Everpay and its subsidiaries, complete with policies, practices and standards addressing information security, and the collection, use, disclosure, storage, and destruction of Personal Information held by Everpay. This Privacy Management Program includes:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2" style={{ fontFamily: "Inter, sans-serif" }}>
              <li>Appropriate safeguards to protect the Personal Information that Everpay collects, stores, and uses.</li>
              <li>Established processes for the maintenance of appropriate data management including classification, record keeping and disposal/destruction systems for Personal Information.</li>
              <li>Established processes to receive and respond to complaints or inquiries about our handling of Personal Information.</li>
              <li>Clearly established roles and responsibilities for the protection of Personal Information, and an accountability framework.</li>
              <li>Annual employee privacy awareness training.</li>
              <li>Regular assessments, audits, and revisions of our privacy practices to ensure they meet or exceed applicable legislative requirements, internal policies, industry standards and best practices.</li>
              <li>A process for the maintenance of a privacy incident management and reporting methodology for incidents involving the unauthorized collection, use or disclosure of Personal Information.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Our Chief Privacy Officer has been delegated the responsibility of ensuring Everpay's compliance with applicable privacy legislation. The Chief Privacy Officer oversees the Privacy Management Program and is responsible for the governance and management of matters relating to privacy and Personal Information at Everpay.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              2. What Personal Information We Collect
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              From Existing and Prospective Merchants, Partners, and Customers
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay may collect the following Personal Information from existing merchants, prospective merchants, partners, and other customers, to open and manage accounts, and to provide various products and services:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2" style={{ fontFamily: "Inter, sans-serif" }}>
              <li>Names, roles or positions</li>
              <li>Financial information</li>
              <li>Mailing addresses, email addresses, telephone numbers</li>
              <li>Birth dates</li>
              <li>Banking information</li>
              <li>Recordings of calls to our support center for quality control and training purposes</li>
              <li>Information about complaints</li>
              <li>Certain other information that Everpay may collect with appropriate consent</li>
            </ul>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              We may obtain consent to collect personal and credit information from a credit reporting agency (including credit score). In limited circumstances, Everpay may seek consent to collect social insurance numbers to confirm identities with credit reporting agencies.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              As a Service Provider
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              When acting as a service provider to merchants, partners, or other customers, Everpay may have access to the Personal Information of their end-users (e.g., their payment card data). In such circumstances, Everpay relies on its merchants, partners, and other customers to ensure that they have the necessary authority and consent required by applicable privacy laws to provide their end-user's Personal Information to Everpay.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              From Website Visitors
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay also collects information from visitors to our websites. These practices are described in our <Link to="/cookie-policy" className="text-[#1aa478] hover:underline">Cookie Policy</Link>.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              3. How We Use Personal Information
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              We may use Personal Information to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2" style={{ fontFamily: "Inter, sans-serif" }}>
              <li>Provide, deliver and improve our products and services</li>
              <li>Verify identities and conduct due diligence, including complying with "know your customer" requirements under applicable laws</li>
              <li>Administer merchant accounts and relationships</li>
              <li>Process transactions and facilitate payment processing</li>
              <li>Detect, prevent, and respond to fraud, abuse, security incidents and other harmful activity</li>
              <li>Comply with legal obligations, resolve disputes, and enforce our agreements</li>
              <li>Communicate with you about your account, transactions, and provide customer support</li>
              <li>Conduct research and analytics to improve our services</li>
              <li>Market our products and services, subject to your right to opt-out</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              4. When We Share Personal Information
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay may share Personal Information with:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2" style={{ fontFamily: "Inter, sans-serif" }}>
              <li><strong>Service providers and partners</strong> who assist us in providing products and services, subject to appropriate contractual safeguards.</li>
              <li><strong>Payment card networks</strong> (e.g., Visa, Mastercard) to facilitate transaction processing and dispute resolution.</li>
              <li><strong>Government and regulatory authorities</strong> when required by law, regulation, or legal process.</li>
              <li><strong>Law enforcement</strong> when necessary to protect against fraud, unauthorized transactions, or other illegal activities.</li>
              <li><strong>Credit reporting agencies</strong> to obtain or verify credit information.</li>
              <li><strong>Financial institutions</strong> to facilitate payment processing and fund settlement.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay may also disclose Personal Information in connection with a proposed or completed merger, acquisition, sale (including as part of insolvency or bankruptcy proceedings) involving all or part of Everpay, as part of a corporate reorganization, or in relation to other changes in corporate control.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              5. Where We Process Personal Information
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              In providing services to merchants, partners, and other customers, Personal Information may be collected, stored, accessed, used or disclosed by Everpay or our service providers outside of the home province or state of the individual to which the information belongs, and in countries outside of the United States and Canada (e.g., the United Kingdom, the European Union, India, or the Philippines), for any of the purposes identified above. Everpay will continue to maintain protection of Personal Information in accordance with this Privacy Statement.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              6. How We Safeguard Personal Information
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay has a dedicated Information Security team responsible for the implementation of physical, technical, and administrative safeguards to protect Everpay's information assets, including Personal Information. Everpay maintains policies and standards which provide direction for our information security practices, including by establishing clear roles and responsibilities for the protection of information.
            </p>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay's information security policies and standards align with relevant industry standards and frameworks including the Payment Card Industry (PCI) Standards, the National Institute of Standards and Technology Cyber Security Framework (NIST CSF), and other information security requirements specific to Everpay's operations.
            </p>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay maintains its Payment Card Industry Data Security Standard (PCI DSS) compliant Level 1 service provider status, and our compliance is reported to all major debit and credit card associations on an annual basis.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              7. Device Fingerprinting &amp; Behavioral Biometrics
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              To protect against fraud, unauthorized access, and financial crime, Everpay may collect and process technical and behavioral information from your device.
            </p>
            <p className="text-gray-600 leading-relaxed font-semibold" style={{ fontFamily: "Inter, sans-serif" }}>
              This includes:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2" style={{ fontFamily: "Inter, sans-serif" }}>
              <li>Device identifiers and browser characteristics (such as user agent, screen resolution, and system configuration)</li>
              <li>Network information (such as IP address and approximate location)</li>
              <li>Interaction data (such as mouse movements, click patterns, and typing cadence)</li>
            </ul>
            <p className="text-gray-600 leading-relaxed font-semibold" style={{ fontFamily: "Inter, sans-serif" }}>
              This information is used solely for:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2" style={{ fontFamily: "Inter, sans-serif" }}>
              <li>Fraud detection and prevention</li>
              <li>Security monitoring</li>
              <li>Risk assessment and compliance obligations</li>
            </ul>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay does not use this data for advertising or profiling unrelated to security purposes.
            </p>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              All such data is processed in accordance with applicable data protection laws, including GDPR where applicable.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              8. Cookies, Interest-Based Advertising, and Website Data
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              For detailed information about our use of cookies, web beacons, and similar technologies, please refer to our <Link to="/cookie-policy" className="text-[#1aa478] hover:underline">Cookie Policy</Link>.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              9. Privacy Choices and Rights
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              Marketing Communications
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              If you are an Everpay merchant, partner, other customer, have made an inquiry with us, have been referred to us by one of our partners, or have opted to receive marketing, promotional, and other commercial messages from Everpay, we may send you electronic messages (such as emails or text messages). If you prefer not to receive these types of electronic messages you may opt-out by clicking the "Unsubscribe" link contained in any such message.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              Right to Access and Portability
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              If Everpay has your Personal Information, you may request to access, update, or rectify that information. You can also make a data portability request that we send your Personal Information to you or another service provider, in a structured, commonly used, and machine-readable format, if it is technically feasible. This only applies to Personal Information you have provided to us and is processed by us using automated means.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              Withdrawing Consent
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              You have a right to withdraw consent for the collection, use, and disclosure of your Personal Information at any time, subject to legal and contractual restrictions, and on providing Everpay with reasonable notice. If you choose to withdraw your consent, Everpay may be unable to offer you some or all of our products and services.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              9. Updates to This Privacy Statement
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay will update this Privacy Statement from time to time to reflect changes in our Personal Information practices. Any changes to our Privacy Statement are effective as of the modification date noted above, unless otherwise stated.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              10. Questions, Concerns or Complaints
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              If you have a question, concern or complaint related to this Privacy Statement, Everpay's Personal Information processing practices, or wish to exercise applicable rights relating to Everpay's collection, use or disclosure of your Personal Information, please contact Everpay's Privacy Office at:
            </p>
            <div className="bg-gray-50 rounded-xl p-6 mt-4 not-prose" style={{ fontFamily: "Inter, sans-serif" }}>
              <p className="font-semibold text-gray-900 mb-2">Everpay Chief Privacy Officer</p>
              <p className="text-gray-600 text-sm">Everpay Corporation</p>
              <p className="text-gray-600 text-sm">Toronto, ON, Canada</p>
              <p className="text-gray-600 text-sm mt-2">
                Email: <a href="mailto:privacy@everpayinc.com" className="text-[#1aa478] hover:underline">privacy@everpayinc.com</a>
              </p>
            </div>
          </div>
        </div>
      </main>
      <CTASection />
      <SiteFooter />
    </div>
  )
}
