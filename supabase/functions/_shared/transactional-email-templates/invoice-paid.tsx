import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Everpay'

interface Props {
  invoiceNumber?: string
  amount?: string
  currency?: string
  merchantName?: string
  paidDate?: string
  paymentMethod?: string
}

const InvoicePaidEmail = ({
  invoiceNumber = 'INV-000000',
  amount = '0.00',
  currency = 'USD',
  merchantName = 'Merchant',
  paidDate,
  paymentMethod = 'Card',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Invoice {invoiceNumber} has been paid</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>💳 {SITE_NAME}</Text>
        <Heading style={h1}>Invoice Paid ✅</Heading>
        <Text style={text}>Invoice {invoiceNumber} for {merchantName} has been paid in full.</Text>
        <Section style={detailsBox}>
          <table style={table}>
            <tr><td style={labelCell}>Invoice</td><td style={valueCell}>{invoiceNumber}</td></tr>
            <tr><td style={labelCell}>Amount Paid</td><td style={valueCell}>{currency} {amount}</td></tr>
            <tr><td style={labelCell}>Method</td><td style={valueCell}>{paymentMethod}</td></tr>
            <tr><td style={labelCell}>Date</td><td style={valueCell}>{paidDate || new Date().toLocaleDateString()}</td></tr>
          </table>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>This is an automated notification from {SITE_NAME}.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: InvoicePaidEmail,
  subject: (data: Record<string, any>) => `Invoice ${data.invoiceNumber || ''} paid — ${data.currency || 'USD'} ${data.amount || '0.00'}`,
  displayName: 'Invoice paid',
  previewData: { invoiceNumber: 'INV-003421', amount: '2,500.00', currency: 'USD', merchantName: 'Acme Corp', paidDate: '2026-04-08', paymentMethod: 'Visa •••• 4242' },
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
