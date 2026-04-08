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
  transactionId?: string
  refundReason?: string
  customerEmail?: string
}

const RefundNotificationEmail = ({
  merchantName = 'Merchant',
  amount = '0.00',
  currency = 'USD',
  transactionId = 'N/A',
  refundReason,
  customerEmail,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Refund of {currency} {amount} processed</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>💳 {SITE_NAME}</Text>
        <Heading style={h1}>Refund Processed</Heading>
        <Text style={text}>A refund has been processed for {merchantName}.</Text>
        <Section style={detailsBox}>
          <table style={table}>
            <tr><td style={labelCell}>Refund Amount</td><td style={valueCell}>{currency} {amount}</td></tr>
            <tr><td style={labelCell}>Transaction ID</td><td style={{...valueCell, fontFamily: 'JetBrains Mono, monospace', fontSize: '12px'}}>{transactionId}</td></tr>
            {customerEmail && <tr><td style={labelCell}>Customer</td><td style={valueCell}>{customerEmail}</td></tr>}
            {refundReason && <tr><td style={labelCell}>Reason</td><td style={valueCell}>{refundReason}</td></tr>}
            <tr><td style={labelCell}>Expected Return</td><td style={valueCell}>5-10 business days</td></tr>
          </table>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>This is an automated notification from {SITE_NAME}.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: RefundNotificationEmail,
  subject: (data: Record<string, any>) => `Refund of ${data.currency || 'USD'} ${data.amount || '0.00'} processed`,
  displayName: 'Refund notification',
  previewData: { merchantName: 'Acme Corp', amount: '50.00', currency: 'USD', transactionId: 'txn_abc123', refundReason: 'Customer request', customerEmail: 'jane@example.com' },
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
