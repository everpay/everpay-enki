import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Everpay'

interface Props {
  merchantName?: string
  email?: string
  dashboardUrl?: string
}

const MerchantOnboardingEmail = ({
  merchantName = 'there',
  email,
  dashboardUrl = 'https://enki.everpayinc.com',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to {SITE_NAME}, {merchantName}!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>💳 {SITE_NAME}</Text>
        <Heading style={h1}>Welcome aboard, {merchantName}!</Heading>
        <Text style={text}>
          Your merchant account has been created and is ready to accept payments. Here's what to do next:
        </Text>
        <Section style={detailsBox}>
          <Text style={stepText}>1. Complete your business verification</Text>
          <Text style={stepText}>2. Configure your payment processors</Text>
          <Text style={stepText}>3. Set up your webhook endpoints</Text>
          <Text style={stepText}>4. Start processing payments</Text>
        </Section>
        <Button href={dashboardUrl} style={button}>Go to Dashboard</Button>
        <Hr style={hr} />
        <Text style={footer}>This is an automated notification from {SITE_NAME}.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: MerchantOnboardingEmail,
  subject: `Welcome to ${SITE_NAME} — let's get started`,
  displayName: 'Merchant onboarding',
  previewData: { merchantName: 'Acme Corp', email: 'merchant@acme.com' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Manrope', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const logo = { fontFamily: "'Sora', sans-serif", fontSize: '20px', fontWeight: 'bold' as const, color: 'hsl(172, 72%, 40%)', margin: '0 0 24px' }
const h1 = { fontFamily: "'Sora', sans-serif", fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(220, 25%, 10%)', margin: '0 0 12px' }
const text = { fontSize: '15px', color: 'hsl(215, 15%, 45%)', lineHeight: '1.6', margin: '0 0 20px' }
const detailsBox = { backgroundColor: '#f8fafc', borderRadius: '8px', padding: '20px', margin: '0 0 24px' }
const stepText = { fontSize: '14px', color: 'hsl(220, 25%, 10%)', margin: '8px 0', lineHeight: '1.5' }
const button = { display: 'inline-block', backgroundColor: 'hsl(172, 72%, 40%)', color: '#ffffff', fontSize: '15px', fontWeight: 600, borderRadius: '9999px', padding: '14px 24px', textDecoration: 'none' }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#94a3b8', margin: '0' }
