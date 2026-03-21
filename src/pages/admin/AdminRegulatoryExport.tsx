import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Shield, Globe, Landmark, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function AdminRegulatoryExport() {
  const { toast } = useToast();
  const [exportFormat, setExportFormat] = useState('csv');

  const regions = [
    { value: 'psd2', label: 'PSD2 (EU)', icon: Shield, fields: [
      { field: 'Transaction ID', description: 'Unique transaction identifier', required: true },
      { field: 'SCA Status', description: 'Strong Customer Authentication status', required: true },
      { field: 'EEA Country', description: 'Country code of transaction origin', required: true },
      { field: 'Amount & Currency', description: 'Transaction amount with ISO currency', required: true },
      { field: 'Authentication Method', description: '3DS2, biometric, etc.', required: true },
    ]},
    { value: 'us', label: 'US', icon: Landmark, fields: [
      { field: 'BSA/AML Filing', description: 'SAR and CTR filing status', required: true },
      { field: 'OFAC Screening', description: 'Sanctions list check result', required: true },
      { field: 'FinCEN Report', description: 'Currency Transaction Report data', required: true },
      { field: 'State License', description: 'MTL compliance per state', required: true },
    ]},
    { value: 'latam', label: 'LATAM', icon: Globe, fields: [
      { field: 'UIF/COAF Report', description: 'Financial Intelligence Unit reporting', required: true },
      { field: 'Beneficiary ID', description: 'CURP (MX), CPF (BR), CUIT (AR)', required: true },
      { field: 'FX Compliance', description: 'Central bank FX registration', required: true },
      { field: 'Tax Withholding', description: 'IOF (BR), IVA (MX), local tax', required: true },
    ]},
    { value: 'canada', label: 'Canada', icon: MapPin, fields: [
      { field: 'FINTRAC Report', description: 'LCTR or STR', required: true },
      { field: 'Client Identification', description: 'KYC verification per PCMLTFA', required: true },
      { field: 'Sanctions Screening', description: 'UN/Canada consolidated list check', required: true },
    ]},
  ];

  const handleExport = (type: string, fields: any[]) => {
    const csv = `Field,Description,Required\n${fields.map(f => `"${f.field}","${f.description}",${f.required}`).join('\n')}`;
    const blob = new Blob([csv], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${type}-report-${format(new Date(), 'yyyy-MM-dd')}.csv`; a.click();
    toast({ title: 'Export Started' });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-3xl font-bold tracking-tight">Regulatory Export</h1><p className="text-muted-foreground">Generate compliance reports for PSD2, US, LATAM, and Canada</p></div>
        </div>
        <div className="space-y-4">
          {regions.map(r => (
            <Card key={r.value}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><r.icon className="h-5 w-5 text-primary" /><CardTitle>{r.label} Report</CardTitle></div>
                  <Button onClick={() => handleExport(r.label, r.fields)}><Download className="h-4 w-4 mr-2" />Export</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Field</TableHead><TableHead>Description</TableHead><TableHead>Required</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {r.fields.map(f => (
                      <TableRow key={f.field}><TableCell className="font-medium">{f.field}</TableCell><TableCell className="text-muted-foreground">{f.description}</TableCell><TableCell><Badge variant={f.required ? 'default' : 'secondary'}>{f.required ? 'Required' : 'Optional'}</Badge></TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
