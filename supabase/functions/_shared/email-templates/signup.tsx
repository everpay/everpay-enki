/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://dhobjuetzkvnkdoqeavy.supabase.co/storage/v1/object/public/email-assets/everpay-icon.png'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your Everpay email</Preview>
    <Body style={main}>
      <Container style={container}>
        <table cellPadding="0" cellSpacing="0" border={0} style={{ border: 'none', borderCollapse: 'collapse' }}>
          <tr>
            <td style={{ verticalAlign: 'middle', paddingRight: '12px', lineHeight: '1' }}>
              <Img src={LOGO_URL} width="32" height="32" alt="Everpay" style={logoImg} />
            </td>
            <td style={{ verticalAlign: 'middle', lineHeight: '1' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, fontFamily: "Sora, 'Helvetica Neue', sans-serif", color: '#0f1419', lineHeight: '1' }}>Everpay</span>
            </td>
          </tr>
        </table>
        <Hr style={divider} />
        <Heading style={h1}>Confirm your email</Heading>
        <Text style={text}>
          Thanks for signing up for Everpay! Please confirm your email address ({recipient}) by clicking the button below.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            Verify email
          </Button>
        </Section>
        <Text style={text}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
        <Hr style={divider} />
        <Text style={footerAddress}>Everpay Inc.</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#f6f9fc', fontFamily: "Manrope, 'Helvetica Neue', Arial, sans-serif" }
const container = { backgroundColor: '#ffffff', padding: '40px 32px', maxWidth: '520px', margin: '40px auto', borderRadius: '8px' }
const logoImg = { borderRadius: '8px' }
const divider = { borderColor: '#e6ebf1', margin: '24px 0' }
const h1 = {
  fontSize: '22px',
  fontWeight: '700' as const,
  fontFamily: "Sora, 'Helvetica Neue', sans-serif",
  color: '#0f1419',
  margin: '0 0 16px',
  lineHeight: '1.4',
}
const text = {
  fontSize: '15px',
  color: '#525f7f',
  lineHeight: '1.7',
  margin: '0 0 20px',
}
const buttonSection = { textAlign: 'center' as const, margin: '28px 0' }
const button = {
  backgroundColor: '#1aa478',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  fontFamily: "Sora, 'Helvetica Neue', sans-serif",
  borderRadius: '999px',
  padding: '14px 32px',
  textDecoration: 'none',
}
const footerAddress = { fontSize: '12px', color: '#aab7c4', margin: '0' }
