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
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://dhobjuetzkvnkdoqeavy.supabase.co/storage/v1/object/public/email-assets/everpay-icon.png'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to Everpay</Preview>
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
        <Heading style={h1}>You've been invited to Everpay</Heading>
        <Text style={text}>
          You've been invited to join{' '}
          <Link href={siteUrl} style={link}><strong>Everpay</strong></Link>.
          Click the button below to accept the invitation and set up your merchant account.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            Accept invitation
          </Button>
        </Section>
        <Hr style={divider} />
        <Text style={footer}>
          If you weren't expecting this invitation, you can safely ignore this email.
        </Text>
        <Text style={footerAddress}>Everpay Inc.</Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

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
const link = { color: '#1aa478', textDecoration: 'underline' }
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
