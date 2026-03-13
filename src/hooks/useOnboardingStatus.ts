import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useOnboardingStatus() {
  return useQuery({
    queryKey: ['onboarding-status'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { needsOnboarding: false, hasProfile: false };

      // Check if merchant exists
      const { data: merchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!merchant) {
        // Auto-create merchant record
        const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'My Business';
        const { data: newMerchant } = await supabase
          .from('merchants')
          .insert({ user_id: user.id, name: displayName })
          .select('id')
          .single();

        return { needsOnboarding: true, hasProfile: false, merchantId: newMerchant?.id };
      }

      // Check if merchant_profile exists and is approved
      const { data: profile } = await supabase
        .from('merchant_profiles')
        .select('onboarding_status')
        .eq('merchant_id', merchant.id)
        .maybeSingle();

      if (!profile || profile.onboarding_status === 'pending') {
        return { needsOnboarding: true, hasProfile: !!profile, merchantId: merchant.id };
      }

      return { needsOnboarding: false, hasProfile: true, merchantId: merchant.id };
    },
    staleTime: 30_000,
  });
}
