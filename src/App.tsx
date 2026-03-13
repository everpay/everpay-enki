import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import Index from "./pages/Index";
import Transactions from "./pages/Transactions";
import Wallets from "./pages/Wallets";
import Payouts from "./pages/Payouts";
import NewPayment from "./pages/NewPayment";
import PaymentLinks from "./pages/PaymentLinks";
import Checkout from "./pages/Checkout";
import Activity from "./pages/Activity";
import Subscriptions from "./pages/Subscriptions";
import CustomerPortal from "./pages/CustomerPortal";
import Chargebacks from "./pages/Chargebacks";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import Docs from "./pages/Docs";
import Analytics from "./pages/Analytics";
import Customers from "./pages/Customers";
import Invoices from "./pages/Invoices";
import PayInvoice from "./pages/PayInvoice";
import MerchantDisputes from "./pages/merchant/MerchantDisputes";
import MerchantEvidence from "./pages/merchant/MerchantEvidence";
import MerchantAnalytics from "./pages/merchant/MerchantAnalytics";
import Webhooks from "./pages/Webhooks";
import Refunds from "./pages/Refunds";
import Onboarding from "./pages/Onboarding";
import ProcessorTransparency from "./pages/ProcessorTransparency";
import Products from "./pages/Products";
import MultiAcquirer from "./pages/MultiAcquirer";
import SmartRetry from "./pages/SmartRetry";
import ProcessorAnalyticsPage from "./pages/ProcessorAnalyticsPage";
import KycAml from "./pages/KycAml";
import PaymentMethodsPage from "./pages/PaymentMethodsPage";
import { useInactivityLogout } from "./hooks/useInactivityLogout";

const queryClient = new QueryClient();

function ProtectedRoute({ children, skipOnboardingCheck }: { children: React.ReactNode; skipOnboardingCheck?: boolean }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { data: onboarding, isLoading: onboardingLoading } = useOnboardingStatus();

  if (loading || onboardingLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  // Redirect to onboarding if not completed (unless already on onboarding page)
  if (!skipOnboardingCheck && onboarding?.needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const AppRoutes = () => {
  useInactivityLogout();
  return (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
    <Route path="/docs" element={<Docs />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
    <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
    <Route path="/wallets" element={<ProtectedRoute><Wallets /></ProtectedRoute>} />
    <Route path="/payouts" element={<ProtectedRoute><Payouts /></ProtectedRoute>} />
    <Route path="/payments/new" element={<ProtectedRoute><NewPayment /></ProtectedRoute>} />
    <Route path="/payment-links" element={<ProtectedRoute><PaymentLinks /></ProtectedRoute>} />
    <Route path="/checkout" element={<Checkout />} />
    <Route path="/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
    <Route path="/portal" element={<ProtectedRoute><CustomerPortal /></ProtectedRoute>} />
    <Route path="/chargebacks" element={<ProtectedRoute><Chargebacks /></ProtectedRoute>} />
    <Route path="/chargebacks/disputes" element={<ProtectedRoute><MerchantDisputes /></ProtectedRoute>} />
    <Route path="/chargebacks/evidence" element={<ProtectedRoute><MerchantEvidence /></ProtectedRoute>} />
    <Route path="/chargebacks/analytics" element={<ProtectedRoute><MerchantAnalytics /></ProtectedRoute>} />
    <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
    <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
    <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
    <Route path="/refunds" element={<ProtectedRoute><Refunds /></ProtectedRoute>} />
    <Route path="/webhooks" element={<ProtectedRoute><Webhooks /></ProtectedRoute>} />
    <Route path="/onboarding" element={<ProtectedRoute skipOnboardingCheck><Onboarding /></ProtectedRoute>} />
    <Route path="/processor-transparency" element={<ProtectedRoute><ProcessorTransparency /></ProtectedRoute>} />
    <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
    <Route path="/multi-acquirer" element={<ProtectedRoute><MultiAcquirer /></ProtectedRoute>} />
    <Route path="/smart-retry" element={<ProtectedRoute><SmartRetry /></ProtectedRoute>} />
    <Route path="/processor-analytics" element={<ProtectedRoute><ProcessorAnalyticsPage /></ProtectedRoute>} />
    <Route path="/kyc-aml" element={<ProtectedRoute><KycAml /></ProtectedRoute>} />
    
    <Route path="/payment-methods" element={<ProtectedRoute><PaymentMethodsPage /></ProtectedRoute>} />
    <Route path="/pay/:id" element={<PayInvoice />} />
    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
    <Route path="/activity" element={<Navigate to="/settings" replace />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
