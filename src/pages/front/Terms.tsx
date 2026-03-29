import { SiteHeader } from "@/components/front/SiteHeader"
import { SiteFooter } from "@/components/front/SiteFooter"
import { CTASection } from "@/components/front/CtaSection"
import { Link } from "react-router-dom"

export default function TermsPage() {
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
              Terms & Conditions
            </h1>
            <p className="text-gray-500 text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
              Last updated: March 1, 2026
            </p>
            <div className="flex gap-4 mt-6">
              <Link to="/privacy-policy" className="text-sm text-[#1aa478] hover:underline font-medium">Privacy Policy</Link>
              <Link to="/cookie-policy" className="text-sm text-[#1aa478] hover:underline font-medium">Cookie Policy</Link>
              <Link to="/aml-policy" className="text-sm text-[#1aa478] hover:underline font-medium">AML Policy</Link>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-4xl mx-auto prose prose-gray prose-lg">
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              This Terms of Service Agreement (the "Agreement") is between you, which refers to the individual or entity who visits our Website or uses our Services (both defined below), including Website visitors, current or prospective customers of Everpay (collectively, "Merchants") and end customers of Merchants ("End Users") (individually and collectively, "you" or "your"), and Everpay Corporation, its subsidiaries, affiliates, agents, and assigns (collectively, "Everpay", "we", "us", or "our"). This Agreement sets forth the terms and conditions for your use of Everpay's website, available at www.everpayinc.com ("Website"), Everpay's technology platform (the "Platform"), and the products and services offered, operated or made available by Everpay through the Website, Platform, and/or web and mobile applications, including but not limited to your use of any of the: Everpay's developer sandbox environment (the "Sandbox"), the Everpay-developed user interface ("Everpay Dashboard"), and application programming interfaces ("APIs") (collectively, the "Services").
            </p>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              The Website and Services are owned and operated by Everpay and are being provided to you expressly subject to this Agreement and other terms provided to you prior to using our Website and Services, as applicable. By accessing, browsing and/or using the Website or Services, you acknowledge that you have read, understood, and agree to be bound by the terms of this Agreement and to comply with all applicable laws and regulations. The terms and conditions of this Agreement form an essential basis of the bargain between you and Everpay, and this Agreement governs your use of the Website and Services.
            </p>
            <p className="text-gray-600 leading-relaxed font-semibold" style={{ fontFamily: "Inter, sans-serif" }}>
              THIS AGREEMENT ALSO INCLUDES, AMONG OTHER THINGS, A BINDING ARBITRATION PROVISION THAT CONTAINS A CLASS ACTION WAIVER. PLEASE REFER TO SECTION 16 BELOW FOR MORE INFORMATION.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              1. Acceptance of Agreement
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Please carefully review this Agreement before using the Website or Services, or accessing any data therein. If you do not agree to these terms, you may not access or use the Website or Services. To use Everpay's Website, or Services, you must be of legal age to form a binding contract with Everpay and not prohibited by law from using the Website or Services. If you are under 13 years old, you must obtain parental consent before using the Website and Services. By providing personal information to Everpay through the Website or Services, you confirm that you are either over 13 years old or have obtained necessary parental consent. Parents have the right to review, access, and delete their child's personal information by contacting us at privacy@everpayinc.com. Please see our Privacy Policy for more information on Everpay's use of data and your rights.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              2. Modification of This Agreement
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay reserves the right to amend this Agreement at any time and will notify you of any such changes by posting the revised Agreement on the Website. You should check this Agreement on the Website periodically for changes. All changes shall be effective upon posting, and we will also revise the "last updated" date stated above. Your continued use of the Website or Services after any change to this Agreement constitutes your agreement to be bound by any such changes. Everpay may terminate, suspend, change, or restrict access to all or any part of the Website or Services at any time without notice or liability in its sole discretion, subject to applicable law.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              3. Electronic Disclosure and Consent
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              This Electronic Disclosure and Consent to Use Electronic Records, Communications and Signatures ("Consent") allows Everpay, on behalf of itself, and/or as service provider to the financial institution providing the financial services, to provide you and also each additional account owner, authorized signer, authorized representative, delegate, and/or user, as applicable, identified on any Services that you apply for, use, or access, with electronic Communications regarding or associated with your use of our Website and/or Services. By accepting the terms of this Consent, you agree that you are willing and able to receive Communications in electronic form, and consent to receive Communications in electronic form and provide signatures electronically.
            </p>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              If you do not give your consent to receive Communications in electronic form and provide electronic signatures, you will not have access to our Services, including access to our Platform, APIs, and/or web and mobile applications, and will not be able to open an account. If you withdraw your consent to electronic Communications at any point after providing consent hereunder, we reserve the right to terminate the Services and your account.
            </p>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              "Communications" covered by this Consent include, but are not limited to, this Agreement, disclosures, notices, agreements, fee schedules, policies (including privacy policies), statements, records (including transaction and payment records), documents, tax documents, and other information related to the Services we provide to you and/or that are required to be delivered to you by law, or that you sign and submit or agree to at our request.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              Delivery Methods
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              We will deliver Communications to you electronically, either through our Website, Platform, mobile app, text or SMS messages, or through electronic mail. If we do not deliver Communications to you through the above manners, we will tell you where you can go to receive such Communications. We may be required by law to deliver certain Communications to you on paper even though you have consented to receive it electronically.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              Hardware and Software Requirements
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              By providing your consent here, you are confirming that you have access to the computer hardware and software needed to access these electronic Communications, including but not limited to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2" style={{ fontFamily: "Inter, sans-serif" }}>
              <li>A mobile device with a recent device operating system that supports email, text or SMS messages and attachments.</li>
              <li>Access to a method of displaying and storing electronic Communications.</li>
              <li>Access to a method of displaying and storing PDF files.</li>
              <li>A valid email address and access to that email account.</li>
              <li>A current version of a web browser that we support, including but not limited to: Google Chrome, Microsoft Edge, Mozilla Firefox, and Apple Safari.</li>
              <li>An internet connection.</li>
              <li>An internet-ready device (including a computer, tablet, mobile phone, or other similar device).</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              4. Privacy Policy
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay maintains a Privacy Policy, available at <Link to="/privacy-policy" className="text-[#1aa478] hover:underline">https://www.everpayinc.com/privacy-policy</Link>, which details what data we collect, and how we collect it and use it. Our Privacy Policy is fully incorporated into this Agreement. We reserve the right to update the Privacy Policy at any time at our discretion, and that any changes made to our Privacy Policy are effective when the updates are live on the Website.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              5. License
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay hereby grants to you, for use of Services by you, including your authorized agents, contractors, and employees, a revocable, non-transferable, non-exclusive, non-sub-licensable right and license (the "License") to access Everpay's Services and Platform (being software, data, and applications of Everpay to facilitate the Services) during the term of any agreement between you and Everpay. The Platform and Services shall be made available via online channels that may be provided to you from time to time in order to use the Services. Everpay's Platform and Services may be amended, enhanced or modified from time to time.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              6. Intellectual Property Rights
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              The Website, Platform, and the Services are owned and operated by Everpay. All content, visual interfaces, information, graphics, design, compilation, computer code, products, software, services, text, data, contents, names, trade names, trademarks, trade dress, service marks, layout, logos, designs, images, graphics, illustrations, artwork, icons, photographs, displays, sound, music, video, animation, organization, assembly, arrangement, interfaces, databases, technology, and all intellectual property of any kind whatsoever and the selection and arrangement thereof (collectively, "Everpay Materials") are owned exclusively by Everpay or its licensors or suppliers and are protected by U.S. copyright, trade dress, patent, and trademark laws, international conventions, and all other relevant intellectual property and proprietary rights and applicable laws.
            </p>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Nothing on the Website, Platform, or the Services should be construed as granting, by implication, estoppel, or otherwise, any license or right to use any of the Everpay Materials displayed on the Website, Platform, or Services Website or the Services except as expressly set forth herein, without our prior written consent in each instance. You may not use, copy, display, distribute, modify, or reproduce any of the Everpay Materials found on the Website, Platform, or Services Website or Services unless in accordance with written authorization by us. Any questions concerning any Everpay Materials, or whether any mark or logo is an Everpay Material, should be referred to Everpay. All rights related to the Everpay Materials are hereby reserved.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              7. Acceptable Use
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              The License is granted exclusively for use of the Platform and Services and you are solely and exclusively responsible for you and any users to use the Platform and Services in accordance with the terms outlined in this Agreement.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              7.1 Acceptable Use Policy
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              You will not, and will ensure that authorized users do not, use the Platform and/or Services in connection with any activity, business or industry prohibited under this Agreement. Everpay reserves the right, in its sole discretion, to update or change its policies at any time. You are solely responsible for ensuring that your use of the Platform and Services complies with this Agreement.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              7.2 Service for Authorized and Lawful Purposes Only
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              You agree that you will use the Platform and Services only as permitted by applicable law and solely for authorized purposes, consistent with this Agreement. You will not:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2" style={{ fontFamily: "Inter, sans-serif" }}>
              <li>Access, monitor, or attempt to access or monitor any of Everpay's materials, systems, programs, or data that are not available for your or public use, or in any way not expressly permitted under this Agreement.</li>
              <li>Copy, reproduce, republish, upload, post, transmit, or distribute in any way material or content from the Platform and Services.</li>
              <li>Work around any technical limitations in the Platform and Services, or decompile, disassemble, or otherwise reverse engineer the Platform and Services.</li>
              <li>Perform or attempt to perform any actions that could interfere with the proper operation of the Platform and Services, prevent access to or use of the Platform and Services by Everpay's other licensees or users, or impose an unreasonable or disproportionately large load on Everpay's infrastructure.</li>
              <li>Intentionally distribute malware, viruses, worms, Trojan horses, corrupted files, spyware, adware, or other items of a destructive or deceptive nature through the Platform and Services.</li>
              <li>Perform any fraudulent activity, including but not limited to impersonating any person or entity, claiming a false affiliation accessing any other Platform and Services account without permission, or falsifying or misrepresenting your information.</li>
              <li>Export or use the Platform and Services in a manner, which may be subject to export restrictions imposed by US law.</li>
              <li>Upload any harmful, obscene, abusive or offensive language through the Platform and Services.</li>
              <li>Use or alter any intellectual property of Everpay, except as permitted under this Agreement.</li>
              <li>Transfer or assign the rights granted to you under this Agreement.</li>
              <li>Otherwise use the Platform and Services except as expressly allowed under this Agreement.</li>
              <li>Take any action detrimental to our provision of services.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              7.3 Restricted Activities and Prohibited Payments
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              You acknowledge and agree that you will not use, or allow a third party to use, the Platform and Services for (i) the payment or financing not in direct exchange for a rendered good or service, or other business purpose as permitted under this Agreement, or other agreements you have with Everpay, or (ii) any of the businesses or activities listed in any applicable prohibited business terms you are subject to by using the Platform and Services.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              7.4 No Marketing
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              If Everpay provides you with information about another user of the Platform and Services, you acknowledge and agree that you will not use the information for any purpose other than the purpose for which the information is provided to you. You may not disclose, sell, rent, or distribute another user's information for any purpose unrelated to your use of the Platform and Services. You may not use the information for marketing purposes unless you separately obtain the appropriate consent of the specific user to do so.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              7.5 Security Monitoring and Fraud Prevention
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              You acknowledge and agree that Everpay may monitor interactions with its platform for the purposes of detecting fraud, preventing unauthorized access, and complying with legal obligations.
            </p>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              This may include the collection and analysis of:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2" style={{ fontFamily: "Inter, sans-serif" }}>
              <li>Device and browser characteristics</li>
              <li>Network identifiers</li>
              <li>Behavioral interaction data such as typing patterns and mouse movements</li>
            </ul>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              By using Everpay's services, you consent to such monitoring as necessary to maintain the security and integrity of the platform.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              8. User Information Accuracy and Updates
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              To access the Services, you must create an account (an "Everpay Account") on the following, as applicable: (i) Everpay Platform, (ii) Merchant platform, (iii) Everpay and/or Merchant web or mobile application, and (iv) any other user interface channels used to deliver the Services. Creating an account will include the creation of a Login ID and password in order to become a user ("User"). You remain solely responsible for your relationships with such Merchants and for any related billing matters, technical support, or disputes. Please see the applicable respective Merchant terms and conditions to understand additional program terms and conditions.
            </p>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              You agree to provide accurate, current, and complete information—such as your name, company name, mailing address, and email address—as may be prompted during account registration, in connection with your use of the Services, or as otherwise requested by Everpay ("User Information"), any financial institution with which Everpay partners to offer relevant services, or the Merchant, as applicable. You further represent that you are authorized to provide us with all User Information and other information you provide to us to facilitate your use of the Website and Services.
            </p>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Should you believe or have reason to believe that any of your User Information, including your Login ID and/or password, has been compromised, or that another person is or may be accessing your Everpay Account, you agree to change your password and notify us as soon as possible at support@everpayinc.com.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              9. Everpay Sandbox
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay is a financial technology company that provides technology and related services to enable financial institutions ("Banks") to offer payment services through digital channels. Everpay is a service provider to Banks and the Merchants that Banks work with directly, to enable Banks to offer their payment services online.
            </p>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay offers the Sandbox to allow prospective Banks and Merchants to learn about Everpay's Platform and Services. The Sandbox is intended to permit prospective Banks and Merchants to test Everpay's Platform and Services using artificial or fabricated data in a non-production environment.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              9.a. Sandbox Use
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              You must create an Everpay Account on the Website to access Everpay's Sandbox services. You may use the Sandbox solely for internal evaluation of the Platform and Services to determine whether to enter into a paid commercial relationship with Everpay, and not for production access, competitive intelligence, or any other purpose. In using the Sandbox, you agree to comply at all times with Everpay's applicable documentation, policies, and instructions, as amended from time to time, including those relating to the data types and use cases eligible for use in the Sandbox. Everpay may make available different types of Sandbox accounts, and each such Sandbox account may have different available functionality or usage limits. Everpay may modify or disable any Sandbox account (and delete related data submitted by you or provided by Everpay) at any time in its sole discretion without notice or liability to you. Everpay has no support obligations for the Sandbox or any Sandbox accounts. All use of the Sandbox is subject to the terms and conditions of this Agreement.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              9.b. Ownership
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Except for the rights expressly granted to you in this Agreement, Everpay reserves and retains all right, title, and interest in and to the Website, Platform, and Services, which includes but is not limited to your use of the Sandbox, and any other intellectual property created, used, or provided by Everpay for the purposes of this Agreement. To the extent you provide Everpay with any feedback relating to the Platform and Services or the Sandbox (including, without limitation, feedback related to usability, performance, interactivity, bug reports and test results) ("Feedback"), Everpay will own all right, title and interest in and to such Feedback (and you hereby make all assignments necessary to effect such ownership by Everpay).
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              10. Additional Limitations of Use
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay is designed to be used within the United States. Users understand and agree that their use of the Website, Platform, and Services outside the United States is contingent on local laws and regulations, which may differ from those of the United States. Different features of the Website, Platform and Services may be restricted outside the United States. Everpay makes no claims concerning whether use of the Website, Platform, or Services is appropriate outside of the United States. If you access the Website, Platform, or Services from outside of the United States, you are solely responsible for ensuring compliance with the laws of your specific jurisdiction.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              11. Cookies
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay uses various technologies to collect information, and this may include sending cookies to your computer or mobile device. Cookies are small data files that are stored on your hard drive or in device memory by a website or mobile application. Among other things, cookies support the integrity of Everpay's registration process, retain your preferences and account settings, and help evaluate and compile aggregated statistics about user activity. Cookies also allow Everpay to provide you with relevant and personalized advertisements during your use of the Services.
            </p>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay may also collect information using web beacons. Web beacons are electronic images that may be used in our Website, Platform, or Services or emails. Everpay may use web beacons to deliver cookies, count visits, understand usage, and determine whether an email has been opened and acted upon.
            </p>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              In some cases, cookies, web beacons, and similar files are stored on your device only as long as your browser is running (session cookie); in other cases, such information will remain stored on your device for longer (permanent cookie). If your device offers the appropriate feature, you can block, delete or disable these cookies. In the settings of your device or browser, you can access your cookies and cookie settings.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              12. Termination
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Everpay may terminate this Agreement at any time, without notice, or suspend or terminate your access and use of the Website, Platform, or Services at any time, with or without cause, in Everpay's sole and absolute discretion and without notice, subject to applicable law. The following provisions of this Agreement shall survive termination of your use or access to the Website, Platform, or Services: the sections concerning Indemnification, Disclaimer of Warranties, Limitation of Liability, Waiver, Dispute Resolution by Binding Arbitration, General Provisions, and any other provision that by its terms survives termination of your use or access to the Website, Platform, or Services. Everpay further reserves the right to modify or discontinue, either temporarily or permanently, any portions or all of the Website, Platform, or Services at any time with or without notice.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              13. Disclaimer of Warranties
            </h2>
            <p className="text-gray-600 leading-relaxed font-semibold" style={{ fontFamily: "Inter, sans-serif" }}>
              THE WEBSITE, PLATFORM, AND SERVICES ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. TO THE FULLEST EXTENT PERMITTED BY LAW, EVERPAY AND ALL OF ITS SUCCESSORS, PARENTS, SUBSIDIARIES, AFFILIATES, OFFICERS, DIRECTORS, STOCKHOLDERS, INVESTORS, EMPLOYEES, AGENTS, REPRESENTATIVES AND ATTORNEYS AND THEIR RESPECTIVE HEIRS, SUCCESSORS, ASSIGNS, LICENSORS AND SUPPLIERS (COLLECTIVELY, THE "EVERPAY PARTIES") EXPRESSLY MAKE NO REPRESENTATIONS OR WARRANTIES OF ANY KIND, EXPRESS, STATUTORY, OR IMPLIED AS TO THE CONTENT OR OPERATION OF THE WEBSITE, PLATFORM, OR SERVICES. YOU EXPRESSLY AGREE THAT YOUR USE OF THE WEBSITE, PLATFORM, OR SERVICES IS AT YOUR SOLE RISK.
            </p>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              IF YOU ARE A CALIFORNIA RESIDENT, YOU HEREBY WAIVE CALIFORNIA CIVIL CODE SECTION 1542 WHICH PROVIDES: "A GENERAL RELEASE DOES NOT EXTEND TO CLAIMS THAT THE CREDITOR OR RELEASING PARTY DOES NOT KNOW OR SUSPECT TO EXIST IN HIS OR HER FAVOR AT THE TIME OF EXECUTING THE RELEASE AND THAT, IF KNOWN BY HIM OR HER, WOULD HAVE MATERIALLY AFFECTED HIS OR HER SETTLEMENT WITH THE DEBTOR OR RELEASED PARTY."
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              14. Limitation of Liability
            </h2>
            <p className="text-gray-600 leading-relaxed font-semibold" style={{ fontFamily: "Inter, sans-serif" }}>
              THE EVERPAY PARTIES WILL NOT BE RESPONSIBLE, UNDER ANY CIRCUMSTANCES, TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, LIQUIDATED, OR PUNITIVE DAMAGES, INCLUDING DAMAGES UNDER WARRANTY, CONTRACT, TORT, NEGLIGENCE, OR ANY OTHER CLAIMS, ARISING OUT OF OR RELATING TO YOUR USE OF THE WEBSITE, PLATFORM, OR SERVICES, THE EVERPAY MATERIALS, OR ANY CONTENT OR OTHER MATERIALS ON OR ACCESSED THROUGH THE WEBSITE, PLATFORM, OR SERVICES, EVEN IF EVERPAY HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              IN NO EVENT WILL EVERPAY'S TOTAL LIABILITY TO YOU FOR ALL DAMAGES, LOSSES OR CAUSES OF ACTION EXCEED USD $1,000 (ONE THOUSAND UNITED STATES DOLLARS). SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF CERTAIN WARRANTIES OR THE LIMITATION OR EXCLUSION OF LIABILITY FOR INCIDENTAL OR CONSEQUENTIAL DAMAGES. ACCORDINGLY, SOME OF THE LIMITATIONS SET FORTH ABOVE MAY NOT APPLY TO YOU. IF YOU ARE DISSATISFIED WITH ANY PORTION OF THE WEBSITE, PLATFORM, OR SERVICES OR WITH THIS AGREEMENT, YOUR SOLE AND EXCLUSIVE REMEDY IS TO DISCONTINUE USE OF OUR WEBSITE, PLATFORM, OR SERVICES.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              15. Indemnification
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              To the fullest extent permitted by law, you agree to indemnify, defend and hold harmless Everpay from and against any and all claims, losses, expenses, demands or liabilities, including reasonable attorneys' fees arising out of or relating to (a) your access to, use of or alleged use of the Website, Platform, or Services; (b) your violation of this Agreement or any representation, warranty, or agreements referenced herein, or any applicable law or regulation; (c) your violation of any third-party right, including without limitation any intellectual property right, publicity, confidentiality, property or privacy right; or (d) any disputes or issues between you and any third party. We reserve the right, at our own expense, to assume the exclusive defense and control of any matter subject to indemnification by you, and in such case, you agree to cooperate fully with our defense of such claim. You agree not to settle any matter without the prior written consent of Everpay.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              16. Dispute Resolution by Binding Arbitration
            </h2>
            <p className="text-gray-600 leading-relaxed font-semibold" style={{ fontFamily: "Inter, sans-serif" }}>
              YOU MUST READ THIS PROVISION CAREFULLY AND UNDERSTAND THAT IT LIMITS YOUR RIGHTS IN THE EVENT OF A DISPUTE BETWEEN YOU AND EVERPAY. YOU UNDERSTAND THAT YOU HAVE THE RIGHT TO OPT OUT OF THIS PROVISION AS PROVIDED BELOW.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              16.a. Election to Arbitrate
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              You and Everpay agree that the sole and exclusive forum and remedy for resolution of any legal claim ("Claim") arising out of this relationship or otherwise be a final and binding arbitration pursuant to this Section 16 (the "Arbitration Provision"), unless you opt out as provided below. As used in this Arbitration Provision, Claim shall include any past, present, or future claim, dispute, or controversy involving you (or persons claiming through or connected with you), on the one hand, and us on the other hand, relating to or arising out of this Agreement, and/or the activities or relationships that involve, lead to, or result from this Agreement, including the validity or enforceability of this Arbitration Provision, any part thereof, or the entire Agreement.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              16.b. Opt-Out of Arbitration Provision
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              You may opt-out of this Arbitration Provision for all purposes by sending an arbitration opt out notice to support@everpayinc.com within 60 days of the date of your electronic acceptance of the terms of this Agreement. The opt-out notice must clearly state that you are rejecting arbitration; identify the Agreement to which it applies by date; provide your name, address, and social security number; and be signed by you.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              16.c. No Class Actions
            </h3>
            <p className="text-gray-600 leading-relaxed font-semibold" style={{ fontFamily: "Inter, sans-serif" }}>
              NO ARBITRATION SHALL PROCEED ON A CLASS, REPRESENTATIVE, OR COLLECTIVE BASIS (INCLUDING AS PRIVATE ATTORNEY GENERAL ON BEHALF OF OTHERS), EVEN IF THE CLAIM OR CLAIMS THAT ARE THE SUBJECT OF THE ARBITRATION HAD PREVIOUSLY BEEN ASSERTED (OR COULD HAVE BEEN ASSERTED) IN A COURT AS CLASS REPRESENTATIVE, OR COLLECTIVE ACTIONS IN A COURT.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              17. Governing Law and Venue
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              Except for Section 16 which is governed by the FAA, this Agreement and all Claims are governed by the laws of the State of New York, without regard to conflict-of-law rules.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              18. Severability
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              If any provision of this Agreement is found to be invalid, unlawful, void, or unenforceable by either an arbitrator or a court of competent jurisdiction, this Agreement's remaining provisions shall be enforced to the fullest extent possible, and the remaining provisions of the Agreement shall remain in full force and effect.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              19. Waiver
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              You agree that if Everpay does not enforce any of its legal rights or remedies under this Agreement, or other legal rights or remedies Everpay has under applicable laws, this shall not be construed as a formal waiver of those rights or remedies or any other rights in any way whatsoever.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              20. General Provisions
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              This Agreement is the entire understanding and agreement between you and Everpay. This Agreement supersedes any previous Terms of Use agreement or other agreement to which you and Everpay may have been bound. This Agreement will be binding on, inure to the benefit of, and be enforceable against the parties and their respective successors and assigns. Neither the course of conduct between parties nor trade practice shall act to modify any provision of the Agreement. You may not assign or transfer this Agreement or your rights hereunder, in whole or in part, by operation of law or otherwise, without our prior written consent. We may assign this Agreement or any of our rights or obligations under this Agreement at any time without notice. All rights not expressly granted herein are hereby reserved. Headings are for reference purposes only and in no way define, limit, construe or describe the scope or extent of such section.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              21. Contacting Us
            </h2>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
              If you have questions regarding the Agreement or the practices of Everpay, please contact us by e-mail at support@everpayinc.com.
            </p>
          </div>
        </div>
      </main>
      <CTASection />
      <SiteFooter />
    </div>
  )
}
