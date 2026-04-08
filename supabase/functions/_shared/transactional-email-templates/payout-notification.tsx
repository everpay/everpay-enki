import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Everpay'

interface Props {
  merchantName?: string
  amount?: string
  currency?: string
  accountLast4?: string
  bankName?: string
  status?: string
}

const PayoutNotificationEmail = ({
  merchantName = 'Merchant',
  amount = '0.00',
  currency = 'USD',
  accountLast4 = '****',
  bankName,
  status = 'Initiated',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Payout of {currency} {amount} {status.toLowerCase()}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>💳 {SITE_NAME}</Text>
        <Heading style={h1}>Payout {status}</Heading>
        <Text style={text}>A payout for {merchantName} has been {status.toLowerCase()}.</Text>
        <Section style={detailsBox}>
          <table style={table}>
            <tr><td style={labelCell}>Amount</td><td style={valueCell}>{currency} {amount}</td></tr>
            <tr><td style={labelCell}>Bank Account</td><td style={valueCell}>•••• {accountLast4}</td></tr>
            {bankName && <tr><td style={labelCell}>Bank</td><td style={valueCell}>{bankName}</td></tr>}
            <tr><td style={labelCell}>Status</td><td style={valueCell}>{status}</td></tr>
            <tr><td style={labelCell}>Expected Arrival</td><td style={valueCell}>1-2 business days</td></tr>
          </table>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>This is an automated notification from {SITE_NAME}.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PayoutNotificationEmail,
  subject: (data: Record<string, any>) => `Payout of ${data.currency || 'USD'} ${data.amount || '0.00'} ${(data.status || 'initiated').toLowerCase()}`,
  displayName: 'Payout notification',
  previewData: { merchantName: 'Acme Corp', amount: '5,000.00', currency: 'USD', accountLast4: '7890', bankName: 'Chase', status: 'Initiated' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Manrope', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const logo = { fontFamily: "'Sora', sans-serif", fontSize: '20px', fontWeight: 'bold' as const, color: 'hsl(172, 72%, 40%)', margin: '0 0 24px' }
const h1 = { fontFamily: "'Sora', sans-serif", fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(220, 25%, 10%)', margin: '0 0 12px' }
const text = { fontSize: '15px', color: 'hsl(215, 15%, 45%)', lineHeight: '1.6', margin: '0 0 20px' }
const detailsBox = { backgroundColor: '#f8fafc', borderRadius: '8px', padding: '20px', margin: '0 0 24px' }
const table = { width: '100%', fontSize: '14px' } as React.CSSProperties
const labelCell = { color: 'hsl(215, 15%, 45%)', padding: '4px 0' }
const valueCell = { textAlign: 'right' as const, fontWeight: 600, color: 'hsl(220, 25%, 10%)' }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#94a3b8', margin: '0' }
