import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Building, MapPin, CreditCard, Loader2 } from 'lucide-react';
import type { BusinessInfoData } from './BusinessInfoStep';
import type { BusinessAddressData } from './BusinessAddressStep';
import type { PaymentSetupData } from './PaymentSetupStep';

interface Props {
  data: {
    businessInfo: BusinessInfoData | null;
    businessAddress: BusinessAddressData | null;
    paymentSetup: PaymentSetupData | null;
  };
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export const ReviewSubmitStep = ({ data, onSubmit, onBack, isSubmitting }: Props) => {
  return (
    <div className="space-y-4">
      {/* Business Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Business Name</span><p className="font-medium">{data.businessInfo?.businessName}</p></div>
            <div><span className="text-muted-foreground">Contact</span><p className="font-medium">{data.businessInfo?.contactName}</p></div>
            <div><span className="text-muted-foreground">Email</span><p className="font-medium">{data.businessInfo?.email}</p></div>
            <div><span className="text-muted-foreground">Phone</span><p className="font-medium">{data.businessInfo?.phone}</p></div>
            <div><span className="text-muted-foreground">Type</span><p className="font-medium capitalize">{data.businessInfo?.businessType?.replace('_', ' ')}</p></div>
            <div><span className="text-muted-foreground">Category</span><p className="font-medium capitalize">{data.businessInfo?.businessCategory?.replace('_', ' ')}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            Business Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {data.businessAddress?.streetAddress}
            {data.businessAddress?.unitNumber && `, ${data.businessAddress.unitNumber}`}
            <br />
            {data.businessAddress?.city}, {data.businessAddress?.state} {data.businessAddress?.postalCode}
            <br />
            {data.businessAddress?.country}
          </p>
        </CardContent>
      </Card>

      {/* Payment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            Payment Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Expected Volume</span><p className="font-medium">{data.paymentSetup?.expectedVolume}</p></div>
            <div><span className="text-muted-foreground">Use Case</span><p className="font-medium capitalize">{data.paymentSetup?.primaryUseCase?.replace('_', ' ')}</p></div>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Payment Types</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {data.paymentSetup?.paymentTypes?.map((t: string) => (
                <Badge key={t} variant="outline" className="text-xs">{t.replace('_', ' ')}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>Back</Button>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating Merchant...</> : 'Create Merchant & Send Invite'}
        </Button>
      </div>
    </div>
  );
};
