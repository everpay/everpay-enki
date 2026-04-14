import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { OnboardingLayout } from './merchant-onboarding/OnboardingLayout';
import { BusinessInfoStep, type BusinessInfoData } from './merchant-onboarding/BusinessInfoStep';
import { BusinessAddressStep, type BusinessAddressData } from './merchant-onboarding/BusinessAddressStep';
import { PaymentSetupStep, type PaymentSetupData } from './merchant-onboarding/PaymentSetupStep';
import { ReviewSubmitStep } from './merchant-onboarding/ReviewSubmitStep';

const TOTAL_STEPS = 4;
const stepTitles = ['Business Information', 'Business Address', 'Payment Setup', 'Review & Create'];
const stepDescriptions = [
  'Enter the merchant\'s business details and contact information',
  'Where is the business located?',
  'What payment methods and volumes do they need?',
  'Review all details and create the merchant account',
];

interface MerchantFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function MerchantForm({ open, onOpenChange, onSuccess }: MerchantFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<{
    businessInfo: BusinessInfoData | null;
    businessAddress: BusinessAddressData | null;
    paymentSetup: PaymentSetupData | null;
  }>({
    businessInfo: null,
    businessAddress: null,
    paymentSetup: null,
  });

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setCurrentStep(1);
      setFormData({ businessInfo: null, businessAddress: null, paymentSetup: null });
    }
    onOpenChange(isOpen);
  };

  const handleBusinessInfoNext = (data: BusinessInfoData) => {
    setFormData(prev => ({ ...prev, businessInfo: data }));
    setCurrentStep(2);
  };

  const handleAddressNext = (data: BusinessAddressData) => {
    setFormData(prev => ({ ...prev, businessAddress: data }));
    setCurrentStep(3);
  };

  const handlePaymentNext = (data: PaymentSetupData) => {
    setFormData(prev => ({ ...prev, paymentSetup: data }));
    setCurrentStep(4);
  };

  const handleSubmit = async () => {
    if (!formData.businessInfo) return;
    try {
      setIsSubmitting(true);
      const { data: result, error } = await supabase.functions.invoke('create-merchant-user', {
        body: {
          business_name: formData.businessInfo.businessName,
          contact_name: formData.businessInfo.contactName,
          email: formData.businessInfo.email,
          phone: formData.businessInfo.phone,
          website: formData.businessInfo.website || null,
          business_type: formData.businessInfo.businessType,
          business_category: formData.businessInfo.businessCategory,
          business_description: formData.businessInfo.businessDescription,
          tax_id: formData.businessInfo.taxId,
          employee_count: formData.businessInfo.employeeCount,
          annual_revenue: formData.businessInfo.annualRevenue,
          address: formData.businessAddress,
          payment_setup: formData.paymentSetup,
        },
      });
      if (error) throw new Error(error.message);
      if (result?.error) throw new Error(result.error);

      toast({
        title: 'Merchant Created',
        description: `${formData.businessInfo.businessName} has been created. An onboarding invitation has been sent to ${formData.businessInfo.email}.`,
      });
      handleClose(false);
      onSuccess?.();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Create Merchant',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BusinessInfoStep onNext={handleBusinessInfoNext} initialData={formData.businessInfo || undefined} />;
      case 2:
        return <BusinessAddressStep onNext={handleAddressNext} onBack={() => setCurrentStep(1)} initialData={formData.businessAddress || undefined} />;
      case 3:
        return <PaymentSetupStep onNext={handlePaymentNext} onBack={() => setCurrentStep(2)} initialData={formData.paymentSetup || undefined} />;
      case 4:
        return <ReviewSubmitStep data={formData} onSubmit={handleSubmit} onBack={() => setCurrentStep(3)} isSubmitting={isSubmitting} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add New Merchant</DialogTitle>
        </DialogHeader>
        <OnboardingLayout
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          title={stepTitles[currentStep - 1]}
          description={stepDescriptions[currentStep - 1]}
        >
          {renderStep()}
        </OnboardingLayout>
      </DialogContent>
    </Dialog>
  );
}
