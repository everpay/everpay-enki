import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { EnvironmentProvider } from "@/contexts/EnvironmentContext";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Unsubscribe from "./pages/Unsubscribe";
import NotFound from "./pages/NotFound";
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
import AdminCascading from "./pages/admin/AdminCascading";
import PaymentGraphExplorer from "./components/admin/PaymentGraphExplorer";
import AdminRefundManagement from "./components/admin/AdminRefundManagement";
import AdminFxTreasury from "./pages/admin/AdminFxTreasury";
import AdminProcessorOverview from "./pages/admin/AdminProcessorOverview";
import AdminProcessorManagement from "./pages/admin/AdminProcessorManagement";
import AdminRoutingChains from "./pages/admin/AdminRoutingChains";
import AdminRoutingLogs from "./pages/admin/AdminRoutingLogs";
import AdminFeeEngine from "./pages/admin/AdminFeeEngine";
import AdminMerchantView from "./pages/admin/AdminMerchantView";
import AdminRiskEngine from "./pages/admin/AdminRiskEngine";
import AdminRateLimits from "./pages/admin/AdminRateLimits";
import AdminTokenManagement from "./pages/admin/AdminTokenManagement";
import AdminMatrixManagement from "./pages/admin/AdminMatrixManagement";
import AdminPricing from "./pages/admin/AdminPricing";
import AdminRevenue from "./pages/admin/AdminRevenue";
import AdminBilling from "./pages/admin/AdminBilling";

import AdminTransactionMonitoring from "./pages/admin/AdminTransactionMonitoring";
import AdminCryptoWallets from "./pages/admin/AdminCryptoWallets";
import AdminCryptoStores from "./pages/admin/AdminCryptoStores";
import AdminCryptoCommissions from "./pages/admin/AdminCryptoCommissions";
import AdminCryptoWebhookEvents from "./pages/admin/AdminCryptoWebhookEvents";
import AdminCryptoAuditLog from "./pages/admin/AdminCryptoAuditLog";
import AdminBanking from "./pages/admin/AdminBanking";
import AdminSurcharging from "./pages/admin/AdminSurcharging";
import AdminCurrencyManagement from "./pages/admin/AdminCurrencyManagement";
import AdminDisputeDetail from "./pages/admin/AdminDisputeDetail";
import AdminTreasury360 from "./pages/admin/AdminTreasury360";
import AdminPlaidReconciliation from "./pages/admin/AdminPlaidReconciliation";
import AdminIntegrationHealth from "./pages/admin/AdminIntegrationHealth";
import AdminBankAccounts from "./pages/admin/AdminBankAccounts";
import AdminRecipients from "./pages/admin/AdminRecipients";
import AdminRequestTraces from "./pages/admin/AdminRequestTraces";
import AdminLedger from "./pages/admin/AdminLedger";
import AdminKycVerifications from "./pages/admin/AdminKycVerifications";
import AdminKybReviewQueue from "./pages/admin/AdminKybReviewQueue";
import AdminRoutingDecisions from "./pages/admin/AdminRoutingDecisions";
import AdminAuditTrail from "./pages/admin/AdminAuditTrail";
import AdminResellers from "./pages/admin/AdminResellers";
import AdminReconciliation from "./pages/admin/AdminReconciliation";
import AdminReports from "./pages/admin/AdminReports";
import AdminUserReconciliation from "./pages/admin/AdminUserReconciliation";
import AdminSecurityAlerts from "./pages/admin/AdminSecurityAlerts";
import ProcessorDescriptors from "./pages/admin/ProcessorDescriptors";
import HighRiskProcessors from "./pages/admin/HighRiskProcessors";

// Routing Maestro (ported)
import RoutingMaestroDashboard from "./pages/admin/routing-maestro/RoutingDashboard";
import RoutingMaestroMerchantRouting from "./pages/admin/routing-maestro/MerchantRouting";
import RoutingMaestroRulesEngine from "./pages/admin/routing-maestro/RulesEngine";
import RoutingMaestroPreview from "./pages/admin/routing-maestro/RoutingPreview";
import RoutingMaestroProcessorPerformance from "./pages/admin/routing-maestro/ProcessorPerformance";
import RoutingMaestroFailoverConfig from "./pages/admin/routing-maestro/FailoverConfig";

const queryClient = new QueryClient();

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <RoleProtectedRoute allowedRoles={['admin']}>
      {children}
    </RoleProtectedRoute>
  );
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/enki" replace />;
  return <>{children}</>;
}

const AppRoutes = () => {
  const { showWarning, secondsLeft, handleStayActive } = useInactivityLogout();
  usePostHogTracking();
  return (
  <>
  <InactivityWarningDialog open={showWarning} secondsLeft={secondsLeft} onStayActive={handleStayActive} />
  <Routes>
    {/* Root redirects to admin dashboard or login */}
    <Route path="/" element={<Navigate to="/enki" replace />} />
    <Route path="/dashboard" element={<Navigate to="/enki" replace />} />

    {/* Auth */}
    <Route path="/auth" element={<Navigate to="/login" replace />} />
    <Route path="/login" element={<AuthRoute><Auth /></AuthRoute>} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/unsubscribe" element={<Unsubscribe />} />

    {/* Admin pages */}
    <Route path="/enki/payments" element={<Navigate to="/enki/transaction-monitoring" replace />} />
    <Route path="/enki/payment-routing" element={<Navigate to="/enki/routing" replace />} />
    <Route path="/enki/treasury" element={<Navigate to="/enki/fx-treasury" replace />} />
    <Route path="/enki" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
    <Route path="/enki/merchants" element={<AdminRoute><AdminMerchants /></AdminRoute>} />
    <Route path="/enki/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
    <Route path="/enki/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
    <Route path="/enki/regulatory" element={<AdminRoute><AdminRegulatoryExport /></AdminRoute>} />
    <Route path="/enki/reserves" element={<AdminRoute><AdminReservesDashboard /></AdminRoute>} />
    <Route path="/enki/fees" element={<AdminRoute><AdminTransactionFees /></AdminRoute>} />
    <Route path="/enki/routing" element={<AdminRoute><AdminPspRouting /></AdminRoute>} />
    <Route path="/enki/3ds" element={<AdminRoute><Admin3dsControls /></AdminRoute>} />
    <Route path="/enki/notifications" element={<AdminRoute><AdminNotifications /></AdminRoute>} />
    <Route path="/enki/board" element={<AdminRoute><BoardOverview /></AdminRoute>} />
    <Route path="/enki/processors" element={<AdminRoute><AdminProcessorInfo /></AdminRoute>} />
    <Route path="/enki/cascading" element={<AdminRoute><AdminCascading /></AdminRoute>} />
    <Route path="/enki/payment-graph" element={<AdminRoute><PaymentGraphExplorer /></AdminRoute>} />
    <Route path="/enki/refund-management" element={<AdminRoute><AdminRefundManagement /></AdminRoute>} />
    <Route path="/enki/fx-treasury" element={<AdminRoute><AdminFxTreasury /></AdminRoute>} />
    <Route path="/enki/strategy" element={<AdminRoute><AdminProcessorOverview /></AdminRoute>} />
    <Route path="/enki/strategy/processors" element={<AdminRoute><AdminProcessorManagement /></AdminRoute>} />
    <Route path="/enki/strategy/routing" element={<AdminRoute><AdminRoutingChains /></AdminRoute>} />
    <Route path="/enki/strategy/logs" element={<AdminRoute><AdminRoutingLogs /></AdminRoute>} />
    <Route path="/enki/strategy/fees" element={<AdminRoute><AdminFeeEngine /></AdminRoute>} />
    <Route path="/enki/strategy/merchant-view" element={<AdminRoute><AdminMerchantView /></AdminRoute>} />
    <Route path="/enki/risk-engine" element={<AdminRoute><AdminRiskEngine /></AdminRoute>} />
    <Route path="/enki/rate-limits" element={<AdminRoute><AdminRateLimits /></AdminRoute>} />
    <Route path="/enki/token-lifecycle" element={<AdminRoute><AdminTokenManagement /></AdminRoute>} />
    <Route path="/enki/matrix" element={<AdminRoute><AdminMatrixManagement /></AdminRoute>} />
    <Route path="/enki/pricing" element={<AdminRoute><AdminPricing /></AdminRoute>} />
    <Route path="/enki/revenue" element={<AdminRoute><AdminRevenue /></AdminRoute>} />
    <Route path="/enki/billing" element={<AdminRoute><AdminBilling /></AdminRoute>} />
    <Route path="/enki/transaction-monitoring" element={<AdminRoute><AdminTransactionMonitoring /></AdminRoute>} />

    {/* Crypto admin suite */}
    <Route path="/enki/crypto/wallets" element={<AdminRoute><AdminCryptoWallets /></AdminRoute>} />
    <Route path="/enki/crypto/stores" element={<AdminRoute><AdminCryptoStores /></AdminRoute>} />
    <Route path="/enki/crypto/commissions" element={<AdminRoute><AdminCryptoCommissions /></AdminRoute>} />
    <Route path="/enki/crypto/webhooks" element={<AdminRoute><AdminCryptoWebhookEvents /></AdminRoute>} />
    <Route path="/enki/crypto/audit" element={<AdminRoute><AdminCryptoAuditLog /></AdminRoute>} />

    {/* Operations */}
    <Route path="/enki/banking" element={<AdminRoute><AdminBanking /></AdminRoute>} />
    <Route path="/enki/surcharging" element={<AdminRoute><AdminSurcharging /></AdminRoute>} />
    <Route path="/enki/currencies" element={<AdminRoute><AdminCurrencyManagement /></AdminRoute>} />
    <Route path="/enki/disputes/:id" element={<AdminRoute><AdminDisputeDetail /></AdminRoute>} />

    {/* Treasury 360° + observability + verifications */}
    <Route path="/enki/treasury-360" element={<AdminRoute><AdminTreasury360 /></AdminRoute>} />
    <Route path="/enki/bank-accounts" element={<AdminRoute><AdminBankAccounts /></AdminRoute>} />
    <Route path="/enki/recipients" element={<AdminRoute><AdminRecipients /></AdminRoute>} />
    <Route path="/enki/ledger" element={<AdminRoute><AdminLedger /></AdminRoute>} />
    <Route path="/enki/plaid-reconciliation" element={<AdminRoute><AdminPlaidReconciliation /></AdminRoute>} />
    <Route path="/enki/integration-health" element={<AdminRoute><AdminIntegrationHealth /></AdminRoute>} />
    <Route path="/enki/request-traces" element={<AdminRoute><AdminRequestTraces /></AdminRoute>} />
    <Route path="/enki/kyc-verifications" element={<AdminRoute><AdminKycVerifications /></AdminRoute>} />
    <Route path="/enki/kyb-review" element={<AdminRoute><AdminKybReviewQueue /></AdminRoute>} />

    {/* Routing analytics, audit, reseller ops, reports */}
    <Route path="/enki/routing-decisions" element={<AdminRoute><AdminRoutingDecisions /></AdminRoute>} />
    <Route path="/enki/audit-trail" element={<AdminRoute><AdminAuditTrail /></AdminRoute>} />
    <Route path="/enki/resellers" element={<AdminRoute><AdminResellers /></AdminRoute>} />
    <Route path="/enki/reconciliation" element={<AdminRoute><AdminReconciliation /></AdminRoute>} />
    <Route path="/enki/user-reconciliation" element={<AdminRoute><AdminUserReconciliation /></AdminRoute>} />
    <Route path="/enki/security-alerts" element={<AdminRoute><AdminSecurityAlerts /></AdminRoute>} />
    <Route path="/enki/processor-descriptors" element={<AdminRoute><ProcessorDescriptors /></AdminRoute>} />
    <Route path="/enki/high-risk-processors" element={<AdminRoute><HighRiskProcessors /></AdminRoute>} />
    <Route path="/enki/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />

    {/* Routing Maestro */}
    <Route path="/enki/routing-maestro" element={<AdminRoute><RoutingMaestroDashboard /></AdminRoute>} />
    <Route path="/enki/routing-maestro/merchant" element={<AdminRoute><RoutingMaestroMerchantRouting /></AdminRoute>} />
    <Route path="/enki/routing-maestro/rules" element={<AdminRoute><RoutingMaestroRulesEngine /></AdminRoute>} />
    <Route path="/enki/routing-maestro/preview" element={<AdminRoute><RoutingMaestroPreview /></AdminRoute>} />
    <Route path="/enki/routing-maestro/performance" element={<AdminRoute><RoutingMaestroProcessorPerformance /></AdminRoute>} />
    <Route path="/enki/routing-maestro/failover" element={<AdminRoute><RoutingMaestroFailoverConfig /></AdminRoute>} />

    {/* Catch-all */}
    <Route path="*" element={<NotFound />} />
  </Routes>
  </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <EnvironmentProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </EnvironmentProvider>
  </QueryClientProvider>
);

export default App;
