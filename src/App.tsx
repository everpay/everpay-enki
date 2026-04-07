import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { getAppContext, getSubdomainConfig } from "@/lib/subdomain";
import Index from "./pages/Index";
import Transactions from "./pages/Transactions";
import Wallets from "./pages/Wallets";
import Payouts from "./pages/Payouts";
import NewPayment from "./pages/NewPayment";
import PaymentLinks from "./pages/PaymentLinks";
import Checkout from "./pages/Checkout";
import CheckoutThankYou from "./pages/CheckoutThankYou";
import CheckoutDeclined from "./pages/CheckoutDeclined";
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
import Reconciliation from "./pages/Reconciliation";
import Onboarding from "./pages/Onboarding";
import ProcessorTransparency from "./pages/ProcessorTransparency";
import Products from "./pages/Products";
import MultiAcquirer from "./pages/MultiAcquirer";
import SmartRetry from "./pages/SmartRetry";
import ProcessorAnalyticsPage from "./pages/ProcessorAnalyticsPage";
import KycAml from "./pages/KycAml";
import PaymentMethodsPage from "./pages/PaymentMethodsPage";
import BigCommerce from "./pages/BigCommerce";
import Shopify from "./pages/Shopify";
import Ledger from "./pages/Ledger";
import AuditTrail from "./pages/AuditTrail";
import Integrations from "./pages/Integrations";
import { useInactivityLogout } from "./hooks/useInactivityLogout";
import { usePostHogTracking } from "./hooks/usePostHogTracking";
import { InactivityWarningDialog } from "./components/InactivityWarningDialog";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMerchants from "./pages/admin/AdminMerchants";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminRegulatoryExport from "./pages/admin/AdminRegulatoryExport";
import AdminReservesDashboard from "./pages/admin/AdminReservesDashboard";
import AdminTransactionFees from "./pages/admin/AdminTransactionFees";
import AdminPspRouting from "./pages/admin/AdminPspRouting";
import Admin3dsControls from "./pages/admin/Admin3dsControls";
import AdminNotifications from "./pages/admin/AdminNotifications";
import BoardOverview from "./pages/admin/BoardOverview";
import AdminProcessorInfo from "./pages/admin/AdminProcessorInfo";
import ResellerPortal from "./pages/ResellerPortal";
import AffiliateProgram from "./pages/AffiliateProgram";
import ChargeflowDashboard from "./pages/ChargeflowDashboard";
import Treasury from "./pages/Treasury";
import LiveAnalytics from "./pages/LiveAnalytics";
import Settlements from "./pages/Settlements";
import FraudGraph from "./pages/FraudGraph";
import PaymentWidget from "./pages/PaymentWidget";
import MassPayouts from "./pages/MassPayouts";
import SavedCards from "./pages/SavedCards";
import ThreeDSecureSettings from "./pages/ThreeDSecureSettings";
import AdminCascading from "./pages/admin/AdminCascading";
import PaymentGraphExplorer from "./components/admin/PaymentGraphExplorer";
import AdminRefundManagement from "./components/admin/AdminRefundManagement";

// Developer portal pages
import DeveloperPortal from "./pages/developer/DeveloperPortal";
import OverviewPage from "./pages/developer/OverviewPage";
import QuickStartPage from "./pages/developer/QuickStartPage";
import GuidesPage from "./pages/developer/GuidesPage";
import ExamplesPage from "./pages/developer/ExamplesPage";
import ApiKeysPage from "./pages/developer/ApiKeysPage";
import SdkDownloadsPage from "./pages/developer/SdkDownloadsPage";
import DevWebhooksPage from "./pages/developer/WebhooksPage";
import PaymentsApiPage from "./pages/developer/api/PaymentsApiPage";
import TransactionsApiPage from "./pages/developer/api/TransactionsApiPage";
import CustomersApiPage from "./pages/developer/api/CustomersApiPage";
import InvoicesApiPage from "./pages/developer/api/InvoicesApiPage";
import SubscriptionsApiPage from "./pages/developer/api/SubscriptionsApiPage";
import PayoutsApiPage from "./pages/developer/api/PayoutsApiPage";
import WalletsApiPage from "./pages/developer/api/WalletsApiPage";
import ProductsApiPage from "./pages/developer/api/ProductsApiPage";
import MerchantsApiPage from "./pages/developer/api/MerchantsApiPage";
import BankAccountsApiPage from "./pages/developer/api/BankAccountsApiPage";
import AuthenticationApiPage from "./pages/developer/api/AuthenticationApiPage";
import PaymentMethodsApiPage from "./pages/developer/api/PaymentMethodsApiPage";
import PaymentLinksApiPage from "./pages/developer/api/PaymentLinksApiPage";
import PlansApiPage from "./pages/developer/api/PlansApiPage";
import ThreeDSecureApiPage from "./pages/developer/api/ThreeDSecureApiPage";
import SavedCardsApiPage from "./pages/developer/api/SavedCardsApiPage";
import CascadingPaymentsApiPage from "./pages/developer/api/CascadingPaymentsApiPage";
import DisputesApiPage from "./pages/developer/api/DisputesApiPage";
import BankDebitsApiPage from "./pages/developer/api/BankDebitsApiPage";
import BankRedirectsApiPage from "./pages/developer/api/BankRedirectsApiPage";

import FrontAbout from "./pages/front/About";
import FrontPricing from "./pages/front/Pricing";
import FrontContact from "./pages/front/Contact";
import FrontDemo from "./pages/front/Demo";
import FrontBlog from "./pages/front/Blog";
import FrontCareers from "./pages/front/Careers";
import FrontPartners from "./pages/front/Partners";
import FrontFunding from "./pages/front/Funding";
import FrontCommerce from "./pages/front/Commerce";
import FrontSecurity from "./pages/front/Security";
import FrontFraudPrevention from "./pages/front/FraudPrevention";
import FrontOnlinePayments from "./pages/front/OnlinePayments";
import FrontPayments from "./pages/front/Payments";
import FrontCardIssuing from "./pages/front/CardIssuing";
import FrontAmlPolicy from "./pages/front/AmlPolicy";
import FrontTerms from "./pages/front/Terms";
import FrontPrivacyPolicy from "./pages/front/PrivacyPolicy";
import FrontCookiePolicy from "./pages/front/CookiePolicy";
import FrontRetail from "./pages/front/solutions/Retail";
import FrontRestaurant from "./pages/front/solutions/Restaurant";
import FrontEcommerce from "./pages/front/solutions/Ecommerce";
import FrontMobilePayments from "./pages/front/solutions/MobilePayments";
import FrontSaasPlaftorms from "./pages/front/solutions/SaasPlaftorms";
import FrontMarketplaces from "./pages/front/solutions/Marketplaces";
import FrontEnterprise from "./pages/front/solutions/Enterprise";
import FrontPos from "./pages/front/solutions/Pos";
import FrontPaymentGateway from "./pages/front/products/PaymentGateway";

const queryClient = new QueryClient();

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children, skipOnboardingCheck }: { children: React.ReactNode; skipOnboardingCheck?: boolean }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { data: onboarding, isLoading: onboardingLoading } = useOnboardingStatus();

  if (loading || onboardingLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  if (!skipOnboardingCheck && onboarding?.needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const config = getSubdomainConfig(getAppContext());

  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to={config.redirectAfterLogin} replace />;
  return <>{children}</>;
}

function ContextHomeRoute() {
  const { user, loading } = useAuth();
  const appContext = getAppContext();
  const config = getSubdomainConfig(appContext);

  if (appContext === 'main') return <Landing />;
  if (loading) return <LoadingScreen />;

  if (appContext === 'developer') {
    return <Navigate to={user ? config.redirectAfterLogin : '/developers'} replace />;
  }

  return <Navigate to={user ? config.redirectAfterLogin : '/login'} replace />;
}

const AppRoutes = () => {
  const { showWarning, secondsLeft, handleStayActive } = useInactivityLogout();
  usePostHogTracking();
  return (
  <>
  <InactivityWarningDialog open={showWarning} secondsLeft={secondsLeft} onStayActive={handleStayActive} />
  <Routes>
    {/* Front site pages (public) */}
    <Route path="/" element={<ContextHomeRoute />} />
    <Route path="/about" element={<FrontAbout />} />
    <Route path="/pricing" element={<FrontPricing />} />
    <Route path="/contact" element={<FrontContact />} />
    <Route path="/demo" element={<FrontDemo />} />
    <Route path="/blog" element={<FrontBlog />} />
    <Route path="/careers" element={<FrontCareers />} />
    <Route path="/partners" element={<FrontPartners />} />
    <Route path="/funding" element={<FrontFunding />} />
    <Route path="/commerce" element={<FrontCommerce />} />
    <Route path="/security" element={<FrontSecurity />} />
    <Route path="/fraud-prevention" element={<FrontFraudPrevention />} />
    <Route path="/online-payments" element={<FrontOnlinePayments />} />
    <Route path="/payments" element={<FrontPayments />} />
    <Route path="/card-issuing" element={<FrontCardIssuing />} />
    <Route path="/aml-policy" element={<FrontAmlPolicy />} />
    <Route path="/terms" element={<FrontTerms />} />
    <Route path="/privacy-policy" element={<FrontPrivacyPolicy />} />
    <Route path="/cookie-policy" element={<FrontCookiePolicy />} />
    <Route path="/solutions/retail" element={<FrontRetail />} />
    <Route path="/solutions/restaurant" element={<FrontRestaurant />} />
    <Route path="/solutions/ecommerce" element={<FrontEcommerce />} />
    <Route path="/solutions/mobile-payments" element={<FrontMobilePayments />} />
    <Route path="/solutions/saas-platforms" element={<FrontSaasPlaftorms />} />
    <Route path="/solutions/marketplaces" element={<FrontMarketplaces />} />
    <Route path="/solutions/enterprise" element={<FrontEnterprise />} />
    <Route path="/solutions/pos" element={<FrontPos />} />
    <Route path="/products/payment-gateway" element={<FrontPaymentGateway />} />

    {/* Auth & public */}
    <Route path="/auth" element={<Navigate to="/login" replace />} />
    <Route path="/login" element={<AuthRoute><Auth /></AuthRoute>} />
    <Route path="/signup" element={<AuthRoute><Auth /></AuthRoute>} />
    <Route path="/docs" element={<Docs />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/checkout" element={<Checkout />} />
    <Route path="/pay" element={<Checkout />} />
    <Route path="/checkout/thank-you" element={<CheckoutThankYou />} />
    <Route path="/checkout/declined" element={<CheckoutDeclined />} />
    <Route path="/pay/:id" element={<PayInvoice />} />

    {/* App pages (protected) */}
    <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
    <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
    <Route path="/wallets" element={<ProtectedRoute><Wallets /></ProtectedRoute>} />
    <Route path="/payouts" element={<ProtectedRoute><Payouts /></ProtectedRoute>} />
    <Route path="/payments/new" element={<ProtectedRoute><NewPayment /></ProtectedRoute>} />
    <Route path="/payment-links" element={<ProtectedRoute><PaymentLinks /></ProtectedRoute>} />
    <Route path="/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
    <Route path="/portal" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={['user']}><CustomerPortal /></RoleProtectedRoute></ProtectedRoute>} />
    <Route path="/chargebacks" element={<ProtectedRoute><Chargebacks /></ProtectedRoute>} />
    <Route path="/chargebacks/disputes" element={<ProtectedRoute><MerchantDisputes /></ProtectedRoute>} />
    <Route path="/chargebacks/evidence" element={<ProtectedRoute><MerchantEvidence /></ProtectedRoute>} />
    <Route path="/chargebacks/analytics" element={<ProtectedRoute><MerchantAnalytics /></ProtectedRoute>} />
    <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
    <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
    <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
    <Route path="/refunds" element={<ProtectedRoute><Refunds /></ProtectedRoute>} />
    <Route path="/reconciliation" element={<ProtectedRoute><Reconciliation /></ProtectedRoute>} />
    <Route path="/webhooks" element={<ProtectedRoute><Webhooks /></ProtectedRoute>} />
    <Route path="/onboarding" element={<ProtectedRoute skipOnboardingCheck><Onboarding /></ProtectedRoute>} />
    <Route path="/processor-transparency" element={<ProtectedRoute><ProcessorTransparency /></ProtectedRoute>} />
    <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
    <Route path="/multi-acquirer" element={<ProtectedRoute><MultiAcquirer /></ProtectedRoute>} />
    <Route path="/smart-retry" element={<ProtectedRoute><SmartRetry /></ProtectedRoute>} />
    <Route path="/processor-analytics" element={<ProtectedRoute><ProcessorAnalyticsPage /></ProtectedRoute>} />
    <Route path="/kyc-aml" element={<ProtectedRoute><KycAml /></ProtectedRoute>} />
    <Route path="/payment-methods" element={<ProtectedRoute><PaymentMethodsPage /></ProtectedRoute>} />
    <Route path="/bigcommerce" element={<ProtectedRoute><BigCommerce /></ProtectedRoute>} />
    <Route path="/shopify" element={<ProtectedRoute><Shopify /></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
    <Route path="/integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
    <Route path="/treasury" element={<ProtectedRoute><Treasury /></ProtectedRoute>} />
    <Route path="/live" element={<ProtectedRoute><LiveAnalytics /></ProtectedRoute>} />
    <Route path="/activity" element={<Navigate to="/settings" replace />} />
    <Route path="/ledger" element={<ProtectedRoute><Ledger /></ProtectedRoute>} />
    <Route path="/audit-trail" element={<ProtectedRoute><AuditTrail /></ProtectedRoute>} />
    <Route path="/settlements" element={<ProtectedRoute><Settlements /></ProtectedRoute>} />
    <Route path="/fraud-graph" element={<ProtectedRoute><FraudGraph /></ProtectedRoute>} />
    <Route path="/payment-widget" element={<ProtectedRoute><PaymentWidget /></ProtectedRoute>} />
    <Route path="/mass-payouts" element={<ProtectedRoute><MassPayouts /></ProtectedRoute>} />
    <Route path="/saved-cards" element={<ProtectedRoute><SavedCards /></ProtectedRoute>} />
    <Route path="/3ds-settings" element={<ProtectedRoute><ThreeDSecureSettings /></ProtectedRoute>} />

    {/* Admin pages — hidden under /enki, role-gated */}
    <Route path="/enki" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={['admin']}><AdminDashboard /></RoleProtectedRoute></ProtectedRoute>} />
    <Route path="/enki/merchants" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={['admin']}><AdminMerchants /></RoleProtectedRoute></ProtectedRoute>} />
    <Route path="/enki/users" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={['admin']}><AdminUsers /></RoleProtectedRoute></ProtectedRoute>} />
    <Route path="/enki/analytics" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={['admin']}><AdminAnalytics /></RoleProtectedRoute></ProtectedRoute>} />
    <Route path="/enki/regulatory" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={['admin']}><AdminRegulatoryExport /></RoleProtectedRoute></ProtectedRoute>} />
    <Route path="/enki/reserves" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={['admin']}><AdminReservesDashboard /></RoleProtectedRoute></ProtectedRoute>} />
    <Route path="/enki/fees" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={['admin']}><AdminTransactionFees /></RoleProtectedRoute></ProtectedRoute>} />
    <Route path="/enki/routing" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={['admin']}><AdminPspRouting /></RoleProtectedRoute></ProtectedRoute>} />
    <Route path="/enki/3ds" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={['admin']}><Admin3dsControls /></RoleProtectedRoute></ProtectedRoute>} />
    <Route path="/enki/notifications" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={['admin']}><AdminNotifications /></RoleProtectedRoute></ProtectedRoute>} />
    <Route path="/enki/board" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={['admin', 'investor']}><BoardOverview /></RoleProtectedRoute></ProtectedRoute>} />
    <Route path="/enki/processors" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={['admin']}><AdminProcessorInfo /></RoleProtectedRoute></ProtectedRoute>} />
    <Route path="/enki/cascading" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={['admin']}><AdminCascading /></RoleProtectedRoute></ProtectedRoute>} />
    <Route path="/enki/payment-graph" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={['admin']}><PaymentGraphExplorer /></RoleProtectedRoute></ProtectedRoute>} />
    <Route path="/enki/refund-management" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={['admin']}><AdminRefundManagement /></RoleProtectedRoute></ProtectedRoute>} />
    <Route path="/reseller" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={['reseller']}><ResellerPortal /></RoleProtectedRoute></ProtectedRoute>} />
    <Route path="/affiliate" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={['reseller', 'developer']}><AffiliateProgram /></RoleProtectedRoute></ProtectedRoute>} />
    <Route path="/chargeflow" element={<ProtectedRoute><ChargeflowDashboard /></ProtectedRoute>} />

    {/* Developer portal — public (no login required) */}
    <Route path="/developers" element={<DeveloperPortal />}>
      <Route index element={<OverviewPage />} />
      <Route path="quick-start" element={<QuickStartPage />} />
      <Route path="guides" element={<GuidesPage />} />
      <Route path="examples" element={<ExamplesPage />} />
      <Route path="api-keys" element={<ProtectedRoute><RoleProtectedRoute allowedRoles={['developer', 'merchant', 'admin']}><ApiKeysPage /></RoleProtectedRoute></ProtectedRoute>} />
      <Route path="sdks" element={<SdkDownloadsPage />} />
      <Route path="webhooks" element={<DevWebhooksPage />} />
      <Route path="api/payments" element={<PaymentsApiPage />} />
      <Route path="api/transactions" element={<TransactionsApiPage />} />
      <Route path="api/customers" element={<CustomersApiPage />} />
      <Route path="api/invoices" element={<InvoicesApiPage />} />
      <Route path="api/subscriptions" element={<SubscriptionsApiPage />} />
      <Route path="api/payouts" element={<PayoutsApiPage />} />
      <Route path="api/wallets" element={<WalletsApiPage />} />
      <Route path="api/products" element={<ProductsApiPage />} />
      <Route path="api/merchants" element={<MerchantsApiPage />} />
      <Route path="api/bank-accounts" element={<BankAccountsApiPage />} />
      <Route path="api/authentication" element={<AuthenticationApiPage />} />
      <Route path="api/payment-methods" element={<PaymentMethodsApiPage />} />
      <Route path="api/payment-links" element={<PaymentLinksApiPage />} />
      <Route path="api/plans" element={<PlansApiPage />} />
      <Route path="api/3d-secure" element={<ThreeDSecureApiPage />} />
      <Route path="api/saved-cards" element={<SavedCardsApiPage />} />
      <Route path="api/cascading" element={<CascadingPaymentsApiPage />} />
      <Route path="api/disputes" element={<DisputesApiPage />} />
      <Route path="api/bank-debits" element={<BankDebitsApiPage />} />
      <Route path="api/bank-redirects" element={<BankRedirectsApiPage />} />
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
  </>
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
