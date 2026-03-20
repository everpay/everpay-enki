import { SiteHeader } from "@/components/front/SiteHeader"
import { SiteFooter } from "@/components/front/SiteFooter"
import { Link } from "react-router-dom"

export default function AmlPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="max-w-4xl mx-auto mb-16">
            <p className="text-sm font-medium text-[#1aa478] mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
              Legal & Compliance
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              Anti-Money Laundering Policy
            </h1>
            <p className="text-gray-500 text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
              Last updated: March 1, 2026
            </p>
            <div className="flex gap-4 mt-6">
              <Link to="/terms" className="text-sm text-[#1aa478] hover:underline font-medium">Terms & Conditions</Link>
              <Link to="/privacy-policy" className="text-sm text-[#1aa478] hover:underline font-medium">Privacy Policy</Link>
              <Link to="/cookie-policy" className="text-sm text-[#1aa478] hover:underline font-medium">Cookie Policy</Link>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-4xl mx-auto prose prose-gray prose-lg">
            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              1. Introduction and Policy Statement
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay Corporation ("Everpay," "we," "us," or "our") is committed to the highest standards of Anti-Money Laundering (AML) compliance and requires management, employees, and affiliates to adhere to these standards in preventing the use of our products and services for money laundering, terrorist financing, or other illegal activities.
            </p>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              This Anti-Money Laundering Policy (the "Policy") applies to all Everpay operations, employees, officers, directors, and third parties acting on behalf of Everpay. The purpose of this Policy is to establish a framework for compliance with all applicable AML laws and regulations, including but not limited to the Bank Secrecy Act (BSA), the USA PATRIOT Act, and other relevant federal and state regulations.
            </p>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay maintains a zero-tolerance policy towards money laundering and terrorist financing. We are committed to implementing and maintaining effective systems and controls to ensure full compliance with all applicable AML requirements.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              2. Regulatory Framework
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay operates in compliance with the following key regulations and guidelines:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2" style={{ fontFamily: "Inter, sans-serif" }}>
              <li><strong>Bank Secrecy Act (BSA):</strong> The primary U.S. anti-money laundering law, requiring financial institutions to assist government agencies in detecting and preventing money laundering.</li>
              <li><strong>USA PATRIOT Act:</strong> Expands the scope of BSA requirements to combat terrorist financing and requires enhanced due diligence for certain accounts and customers.</li>
              <li><strong>FinCEN Regulations:</strong> Financial Crimes Enforcement Network regulations governing suspicious activity reporting, currency transaction reporting, and customer due diligence.</li>
              <li><strong>OFAC Sanctions:</strong> Office of Foreign Assets Control requirements prohibiting transactions with sanctioned individuals, entities, and countries.</li>
              <li><strong>State Money Transmitter Laws:</strong> Applicable state-level regulations governing money transmission activities.</li>
              <li><strong>FATF Recommendations:</strong> International standards set by the Financial Action Task Force for combating money laundering and terrorist financing.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              3. AML Compliance Program
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay has established a comprehensive AML Compliance Program that includes the following key components:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              3.1 Designation of a Compliance Officer
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay has designated a qualified individual as the AML Compliance Officer who is responsible for overseeing the AML Compliance Program, ensuring adherence to regulatory requirements, and serving as the primary point of contact for regulatory matters. The Compliance Officer reports directly to senior management and has the authority to implement and enforce all aspects of this Policy.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              3.2 Written Policies and Procedures
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay maintains comprehensive written policies and procedures that are designed to ensure compliance with all applicable AML laws and regulations. These policies are reviewed and updated at least annually, or more frequently as required by changes in regulations or business operations.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              3.3 Independent Testing
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay conducts independent testing of its AML Compliance Program on a regular basis, at least annually, to evaluate the effectiveness of the program and identify areas for improvement. Independent testing is conducted by qualified personnel who are not involved in the day-to-day operation of the compliance program.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              3.4 Training Program
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              All Everpay employees receive AML training upon hiring and on an ongoing basis. Training covers the recognition and handling of suspicious transactions, customer identification procedures, regulatory requirements, and the consequences of non-compliance. Training is tailored to the specific roles and responsibilities of each employee.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              4. Customer Due Diligence (CDD)
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay implements robust Customer Due Diligence procedures to verify the identity of our customers and assess the risks associated with their business relationships.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              4.1 Customer Identification Program (CIP)
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Before establishing a business relationship, Everpay collects and verifies the following information for all customers:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2" style={{ fontFamily: "Inter, sans-serif" }}>
              <li><strong>For Individuals:</strong> Full legal name, date of birth, residential address, government-issued identification number (such as Social Security Number or passport number), and a valid government-issued photo identification document.</li>
              <li><strong>For Business Entities:</strong> Legal name, principal place of business, tax identification number (EIN), formation documents, ownership structure, and identification of beneficial owners owning 25% or more of the entity.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              4.2 Enhanced Due Diligence (EDD)
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              For customers that present a higher risk of money laundering or terrorist financing, Everpay applies Enhanced Due Diligence measures, which may include:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2" style={{ fontFamily: "Inter, sans-serif" }}>
              <li>Obtaining additional identification documentation</li>
              <li>Gathering information on the source of funds and source of wealth</li>
              <li>Conducting more detailed background checks</li>
              <li>Obtaining senior management approval for establishing or continuing the business relationship</li>
              <li>Implementing ongoing enhanced monitoring of the business relationship</li>
              <li>More frequent reviews of the customer relationship</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              4.3 Beneficial Ownership
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              In accordance with FinCEN's Customer Due Diligence Rule, Everpay identifies and verifies the identity of beneficial owners of legal entity customers. A beneficial owner is any individual who owns 25% or more of the equity interests of a legal entity customer, or who has significant responsibility to control, manage, or direct a legal entity customer.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              5. Sanctions Screening
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay screens all customers, beneficial owners, and transactions against applicable sanctions lists, including:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2" style={{ fontFamily: "Inter, sans-serif" }}>
              <li>OFAC Specially Designated Nationals (SDN) List</li>
              <li>OFAC Consolidated Sanctions List</li>
              <li>FinCEN 311 Special Measures List</li>
              <li>Other applicable government and international sanctions lists</li>
            </ul>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Screening is conducted at the time of customer onboarding and on an ongoing basis. Any potential matches are reviewed and escalated according to established procedures. Everpay prohibits transactions involving sanctioned individuals, entities, or countries.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              6. Transaction Monitoring and Suspicious Activity Reporting
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay maintains robust transaction monitoring systems designed to detect suspicious activity, including:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2" style={{ fontFamily: "Inter, sans-serif" }}>
              <li>Unusual transaction patterns or volumes inconsistent with the customer's profile</li>
              <li>Transactions with no apparent business or lawful purpose</li>
              <li>Transactions involving high-risk jurisdictions</li>
              <li>Structuring of transactions to avoid reporting thresholds</li>
              <li>Rapid movement of funds without apparent business reason</li>
              <li>Transactions inconsistent with the customer's stated business purpose</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              6.1 Suspicious Activity Reports (SARs)
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              When Everpay identifies suspicious activity, we file a Suspicious Activity Report (SAR) with FinCEN within 30 calendar days of the initial detection of facts that may constitute a basis for filing a SAR. Everpay maintains records of all SARs filed and any supporting documentation for a period of five years.
            </p>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay employees are prohibited from disclosing to any person involved in the transaction that a SAR has been filed (the "SAR confidentiality rule"). Violation of this rule may result in civil and criminal penalties.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              7. Record Keeping
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay maintains comprehensive records in accordance with applicable regulatory requirements, including:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2" style={{ fontFamily: "Inter, sans-serif" }}>
              <li>Customer identification records for at least five years after the account is closed</li>
              <li>Transaction records for at least five years from the date of the transaction</li>
              <li>Suspicious Activity Reports and supporting documentation for at least five years from the date of filing</li>
              <li>AML training records for at least five years</li>
              <li>Independent testing reports and supporting documentation</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              8. Prohibited Activities
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay prohibits the use of its services for any of the following activities:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2" style={{ fontFamily: "Inter, sans-serif" }}>
              <li>Money laundering or terrorist financing</li>
              <li>Fraud, including identity theft and payment fraud</li>
              <li>Transactions involving illegal goods or services</li>
              <li>Transactions involving sanctioned individuals, entities, or countries</li>
              <li>Structuring transactions to evade reporting requirements</li>
              <li>Any activity that violates applicable laws or regulations</li>
              <li>Transactions involving Politically Exposed Persons (PEPs) without appropriate enhanced due diligence</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              9. Risk Assessment
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay conducts periodic risk assessments to identify and assess money laundering and terrorist financing risks associated with our products, services, customers, and geographic locations. Risk assessments inform the development and implementation of appropriate controls and are updated at least annually or when significant changes occur in our business operations or regulatory environment.
            </p>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Our risk assessment methodology considers the following factors:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2" style={{ fontFamily: "Inter, sans-serif" }}>
              <li>Types of products and services offered</li>
              <li>Customer types and risk profiles</li>
              <li>Geographic locations of customers and transactions</li>
              <li>Transaction volumes and values</li>
              <li>Delivery channels used</li>
              <li>Third-party relationships</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              10. Third-Party Relationships
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay conducts due diligence on third parties who perform services on our behalf that relate to our AML obligations. We ensure that third parties maintain appropriate AML programs and comply with applicable regulations. Third-party relationships are subject to ongoing monitoring and periodic review.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              11. Cooperation with Law Enforcement
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay cooperates fully with law enforcement agencies and regulatory authorities in their efforts to combat money laundering and terrorist financing. We respond promptly to subpoenas, summonses, and other lawful requests for information. Everpay also participates in information-sharing programs as permitted by applicable law.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              12. Whistleblower Protection
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay encourages employees to report suspected violations of this Policy or applicable AML laws and regulations. Employees who report violations in good faith are protected from retaliation. Reports may be made to the AML Compliance Officer, through our internal reporting channels, or directly to regulatory authorities.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              13. Penalties for Non-Compliance
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Violations of this Policy may result in disciplinary action, up to and including termination of employment. In addition, violations of AML laws and regulations may result in significant civil and criminal penalties, including fines and imprisonment. Everpay takes compliance seriously and expects all employees to adhere to this Policy and applicable laws.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              14. Policy Review and Updates
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              This Policy is reviewed and updated at least annually, or more frequently as required by changes in regulations, business operations, or identified risks. Updates are communicated to all employees, and training is provided as necessary to ensure understanding of any changes.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              15. Contact Information
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              If you have questions about this Policy or wish to report suspected money laundering or other illegal activity, please contact:
            </p>
            <div className="bg-gray-50 p-6 rounded-xl mt-4">
              <p className="text-gray-900 font-semibold" style={{ fontFamily: "Manrope, sans-serif" }}>
                Everpay Compliance Department
              </p>
              <p className="text-gray-600 mt-2" style={{ fontFamily: "Inter, sans-serif" }}>
                Email: compliance@everpayinc.com
              </p>
              <p className="text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>
                For urgent matters: support@everpayinc.com
              </p>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
