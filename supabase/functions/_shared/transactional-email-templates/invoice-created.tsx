import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Everpay'

interface Props {
  invoiceNumber?: string
  amount?: string
  currency?: string
  merchantName?: string
  dueDate?: string
  payUrl?: string
}

const InvoiceCreatedEmail = ({
  invoiceNumber = 'INV-000000',
  amount = '0.00',
  currency = 'USD',
  merchantName = 'Merchant',
  dueDate,
  payUrl,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Invoice {invoiceNumber} for {currency} {amount}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>💳 {SITE_NAME}</Text>
        <Heading style={h1}>New Invoice</Heading>
        <Text style={text}>A new invoice has been created for {merchantName}.</Text>
        <Section style={detailsBox}>
          <table style={table}>
            <tr><td style={labelCell}>Invoice</td><td style={valueCell}>{invoiceNumber}</td></tr>
            <tr><td style={labelCell}>Amount</td><td style={valueCell}>{currency} {amount}</td></tr>
            <tr><td style={labelCell}>Merchant</td><td style={valueCell}>{merchantName}</td></tr>
            {dueDate && <tr><td style={labelCell}>Due Date</td><td style={valueCell}>{dueDate}</td></tr>}
          </table>
        </Section>
        {payUrl && <Button href={payUrl} style={button}>View Invoice</Button>}
        <Hr style={hr} />
        <Text style={footer}>This is an automated notification from {SITE_NAME}.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: InvoiceCreatedEmail,
  subject: (data: Record<string, any>) => `Invoice ${data.invoiceNumber || 'INV-000000'} created — ${data.currency || 'USD'} ${data.amount || '0.00'}`,
  displayName: 'Invoice created',
  previewData: { invoiceNumber: 'INV-003421', amount: '2,500.00', currency: 'USD', merchantName: 'Acme Corp', dueDate: '2026-04-22' },
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
const button = { display: 'inline-block', backgroundColor: 'hsl(172, 72%, 40%)', color: '#ffffff', fontSize: '15px', fontWeight: 600, borderRadius: '9999px', padding: '14px 24px', textDecoration: 'none' }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#94a3b8', margin: '0' }
