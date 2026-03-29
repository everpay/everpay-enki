

## Three Changes

### 1. Update PlatformSection headline and tagline
**File:** `src/components/front/PlatformSection.tsx`
- Change headline from "From your first dollar to your billionth." to **"The backbone of modern payments"**
- Change tagline from "Whether you're launching a startup or scaling an enterprise, Everpay grows with you." to **"From checkout to settlement—everything you need to run and scale your business."**

### 2. Add "Device Fingerprinting & Behavioral Biometrics" section to Privacy Policy
**File:** `src/pages/front/PrivacyPolicy.tsx`
- Insert a new section after section 6 ("How We Safeguard Personal Information") as **section 7: Device Fingerprinting & Behavioral Biometrics**
- Content covers: device identifiers, network info, interaction data, and the four permitted uses (fraud detection, security monitoring, risk assessment, compliance)
- Includes GDPR applicability note
- Renumber existing sections 7–10 to 8–11

### 3. Add "Security Monitoring and Fraud Prevention" clause to Terms of Service
**File:** `src/pages/front/Terms.tsx`
- Insert a new subsection **7.5 Security Monitoring and Fraud Prevention** after the existing section 7.4 ("No Marketing"), within the "Acceptable Use" section
- Content covers: acknowledgment of monitoring, data types collected (device/browser characteristics, network identifiers, behavioral interaction data), and consent clause

