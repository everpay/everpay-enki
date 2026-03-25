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
    <Preview>Welcome to Everpay — confirm your email</Preview>
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
        <Heading style={h1}>You're ready to get started with Everpay</Heading>
        <Text style={text}>
          Thank you for setting up your Everpay account. To help us protect your account, please confirm your email address.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            Confirm your email
          </Button>
        </Section>
        <Text style={text}>
          By signing up for an Everpay account, you gain access to a secure payment platform built for modern businesses to accept and manage payments worldwide.
        </Text>
        <Hr style={divider} />
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
        <Text style={footerAddress}>Everpay Inc.</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
