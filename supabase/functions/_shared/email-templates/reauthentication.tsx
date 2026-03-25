/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
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

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Everpay verification code: {token}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section>
          <table cellPadding="0" cellSpacing="0" style={{ border: 'none' }}>
            <tr>
              <td style={{ verticalAlign: 'middle', paddingRight: '10px' }}>
                <Img src={LOGO_URL} width="36" height="36" alt="Everpay" style={logoImg} />
              </td>
              <td style={{ verticalAlign: 'middle' }}>
                <Text style={logoText}>Everpay</Text>
              </td>
            </tr>
          </table>
        </Section>
        <Hr style={divider} />
        <Heading style={h1}>Your verification code</Heading>
        <Text style={text}>Your Everpay verification code is:</Text>
        <Section style={codeContainer}>
          <Text style={codeStyle}>{token}</Text>
        </Section>
        <Text style={text}>
          This code will expire in 10 minutes and can only be used once. Never share this code with anyone.
        </Text>
        <Hr style={divider} />
        <Text style={footer}>
          If you believe you are getting this email in error, please contact our support team.
        </Text>
        <Text style={footerAddress}>Everpay Inc.</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#f6f9fc', fontFamily: "Manrope, 'Helvetica Neue', Arial, sans-serif" }
const container = { backgroundColor: '#ffffff', padding: '40px 32px', maxWidth: '520px', margin: '40px auto', borderRadius: '8px' }
const logoImg = { borderRadius: '8px' }
const logoText = {
  fontSize: '22px',
  fontWeight: '700' as const,
  fontFamily: "Sora, 'Helvetica Neue', sans-serif",
  color: '#0f1419',
  margin: '0',
}
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
const codeContainer = {
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
  margin: '0 0 24px',
}
const codeStyle = {
  fontFamily: "'JetBrains Mono', 'Fira Code', Courier, monospace",
  fontSize: '32px',
  fontWeight: 'bold' as const,
  color: '#0f1419',
  letterSpacing: '6px',
  margin: '0',
}
const footer = { fontSize: '13px', color: '#8898aa', margin: '0 0 8px', lineHeight: '1.5' }
const footerAddress = { fontSize: '12px', color: '#aab7c4', margin: '0' }
