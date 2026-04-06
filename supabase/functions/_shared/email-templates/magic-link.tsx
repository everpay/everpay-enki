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

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Everpay sign-in link</Preview>
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
        <Heading style={h1}>Sign in to Everpay</Heading>
        <Text style={text}>
          To sign in, open this link in the same browser as the Everpay Dashboard.
        </Text>
        <Text style={text}>
          Don't share or forward this link. Our team will never ask for it. If you are on a mobile device, please open this in the device browser instead of an in-app browser.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            Verify identity
          </Button>
        </Section>
        <Hr style={divider} />
        <Text style={footer}>
          If you didn't request this link, you can safely ignore this email.
        </Text>
        <Text style={footerAddress}>Everpay Inc.</Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

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
const footer = { fontSize: '13px', color: '#8898aa', margin: '0 0 8px', lineHeight: '1.5' }
const footerAddress = { fontSize: '12px', color: '#aab7c4', margin: '0' }
