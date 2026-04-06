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
  Text,
} from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://dhobjuetzkvnkdoqeavy.supabase.co/storage/v1/object/public/email-assets/everpay-icon.png'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Everpay verification code</Preview>
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
        <Heading style={h1}>Confirm reauthentication</Heading>
        <Text style={text}>Use the code below to confirm your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={text}>
          This code will expire shortly. If you didn't request this, you can safely ignore this email.
        </Text>
        <Hr style={divider} />
        <Text style={footerAddress}>Everpay Inc.</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
const codeStyle = {
  fontFamily: "'JetBrains Mono', Courier, monospace",
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#0f1419',
  margin: '0 0 30px',
  letterSpacing: '4px',
}
const footerAddress = { fontSize: '12px', color: '#aab7c4', margin: '0' }
