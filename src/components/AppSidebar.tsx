import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  DollarSign,
  Settings,
  CreditCard,
  Menu,
  LogOut,
  RefreshCw,
  Link2,
  Shield,
  FileText,
  ArrowUpRight,
  Eye,
  UserCircle,
  BarChart3,
  AlertTriangle,
  Archive,
  RotateCcw,
  Package,
  CreditCard as CreditCardIcon,
  Store,
  Users,
  FileBarChart,
  Landmark,
  Globe,
  Bell,
  BookOpen,
  Handshake,
  Gauge,
  TrendingUp,
  Receipt,
  Activity,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useEnvironment } from "@/contexts/EnvironmentContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import everpayIcon from "@/assets/everpay-icon.png";

// ─── Nav Section Types ──────────────────────────────────
interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  visibleTo?: string[];
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

// ─── Main Nav Sections (grouped) ────────────────────────
const navSections: NavSection[] = [
  {
    items: [
      { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/customers", icon: UserCircle, label: "Customers" },
    ],
  },
  {
    title: "Payments",
    items: [
      { to: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
      { to: "/payments/new", icon: CreditCard, label: "New Payment" },
      { to: "/payment-links", icon: Link2, label: "Payment Links" },
      { to: "/payment-widget", icon: Globe, label: "Payment Widget" },
      { to: "/refunds", icon: RotateCcw, label: "Refunds" },
    ],
  },
  {
    title: "Commerce",
    items: [
      { to: "/invoices", icon: FileText, label: "Invoices" },
      { to: "/products", icon: Package, label: "Products" },
      { to: "/subscriptions", icon: RefreshCw, label: "Subscriptions" },
      { to: "/saved-cards", icon: CreditCard, label: "Saved Cards" },
    ],
  },
  {
    title: "Risk & Disputes",
    items: [
      { to: "/chargebacks", icon: Shield, label: "Chargebacks" },
      { to: "/chargebacks/disputes", icon: AlertTriangle, label: "Disputes" },
      { to: "/chargebacks/evidence", icon: Archive, label: "Evidence" },
      { to: "/kyc-aml", icon: Shield, label: "KYC / AML", visibleTo: ["admin", "super_admin"] },
    ],
  },
  {
    title: "Analytics",
    items: [
      { to: "/analytics", icon: BarChart3, label: "Overview" },
      { to: "/processor-analytics", icon: BarChart3, label: "Processor Analytics" },
      { to: "/payment-methods", icon: CreditCardIcon, label: "Payment Methods" },
      { to: "/live", icon: BarChart3, label: "Live Analytics" },
      { to: "/reconciliation", icon: FileBarChart, label: "Reconciliation", visibleTo: ["admin", "super_admin"] },
      { to: "/ledger", icon: BookOpen, label: "Ledger", visibleTo: ["admin", "super_admin"] },
      { to: "/audit-trail", icon: Shield, label: "Audit Trail", visibleTo: ["admin", "super_admin"] },
      { to: "/fraud-graph", icon: Shield, label: "Fraud Intelligence", visibleTo: ["admin", "super_admin"] },
    ],
  },
  {
    title: "Treasury",
    items: [
      { to: "/wallets", icon: Wallet, label: "Wallets" },
      { to: "/balances", icon: DollarSign, label: "Balances" },
      { to: "/treasury", icon: Landmark, label: "Liquidity & FX", visibleTo: ["admin", "super_admin"] },
      { to: "/settlements", icon: Landmark, label: "Settlements" },
      { to: "/payouts", icon: ArrowUpRight, label: "Payouts" },
      { to: "/merchant-treasury", icon: ArrowUpRight, label: "Treasury & FX" },
    ],
  },
  {
    title: "Integrations",
    items: [
      { to: "/integrations", icon: Globe, label: "Overview" },
    ],
  },
  {
    items: [
      { to: "/developers", icon: BookOpen, label: "Developer Portal", visibleTo: ["developer", "admin", "super_admin"] },
      { to: "/reseller", icon: Users, label: "Reseller Portal", visibleTo: ["reseller"] },
      { to: "/affiliate", icon: Handshake, label: "Affiliate Program", visibleTo: ["reseller", "developer"] },
    ],
  },
];

// ─── Admin Nav Sections ─────────────────────────────────
const adminSections: NavSection[] = [
  {
    items: [
      { to: "/enki", icon: LayoutDashboard, label: "Overview" },
      { to: "/enki/merchants", icon: Store, label: "Merchants" },
      { to: "/enki/users", icon: Users, label: "Users" },
    ],
  },
  {
    title: "Analytics & Fees",
    items: [
      { to: "/enki/analytics", icon: BarChart3, label: "Analytics" },
      { to: "/enki/fees", icon: CreditCardIcon, label: "Transaction Fees" },
      { to: "/enki/board", icon: BarChart3, label: "Board Overview" },
      { to: "/enki/pricing", icon: DollarSign, label: "Pricing" },
      { to: "/enki/revenue", icon: TrendingUp, label: "Revenue" },
      { to: "/enki/billing", icon: Receipt, label: "Billing" },
    ],
  },
  {
    title: "Finance",
    items: [
      { to: "/enki/payment-graph", icon: Eye, label: "Payment Graph" },
      { to: "/enki/refund-management", icon: RotateCcw, label: "Refund Management" },
      { to: "/enki/fx-treasury", icon: Landmark, label: "FX & Treasury" },
    ],
  },
  {
    title: "Routing & Controls",
    items: [
      { to: "/enki/routing", icon: Globe, label: "PSP Routing" },
      { to: "/enki/routing-decisions", icon: Eye, label: "Routing Decisions" },
      { to: "/enki/3ds", icon: Shield, label: "3DS Controls" },
      { to: "/enki/cascading", icon: ArrowLeftRight, label: "Cascading" },
      { to: "/enki/processors", icon: Globe, label: "Processor Info" },
      { to: "/enki/risk-engine", icon: Shield, label: "Risk Engine" },
      { to: "/enki/rate-limits", icon: Gauge, label: "Rate Limits" },
      { to: "/enki/token-lifecycle", icon: CreditCardIcon, label: "Token Lifecycle" },
      { to: "/enki/matrix", icon: CreditCardIcon, label: "Matrix Partners" },
    ],
  },
  {
    title: "Processor Strategy",
    items: [
      { to: "/enki/strategy", icon: LayoutDashboard, label: "Strategy Overview" },
      { to: "/enki/strategy/processors", icon: Shield, label: "Processor Mgmt" },
      { to: "/enki/strategy/routing", icon: ArrowLeftRight, label: "Routing Chains" },
      { to: "/enki/strategy/fees", icon: CreditCardIcon, label: "Fee Engine" },
      { to: "/enki/strategy/logs", icon: Eye, label: "Routing Logs" },
      { to: "/enki/strategy/merchant-view", icon: Store, label: "Merchant View" },
    ],
  },
  {
    title: "Operations",
    items: [
      { to: "/enki/notifications", icon: Bell, label: "Notifications" },
      { to: "/enki/reserves", icon: Landmark, label: "Reserves" },
      { to: "/enki/regulatory", icon: FileBarChart, label: "Regulatory Export" },
      { to: "/enki/banking", icon: Landmark, label: "Banking" },
      { to: "/enki/surcharging", icon: DollarSign, label: "Surcharging" },
      { to: "/enki/currencies", icon: Globe, label: "Currencies" },
      { to: "/enki/reconciliation", icon: FileBarChart, label: "Reconciliation" },
      { to: "/enki/resellers", icon: Handshake, label: "Resellers" },
      { to: "/enki/audit-trail", icon: Shield, label: "Audit Trail" },
      { to: "/enki/reports", icon: FileText, label: "Reports" },
    ],
  },
  {
    title: "Treasury 360°",
    items: [
      { to: "/enki/treasury-360", icon: Landmark, label: "Liquidity Overview" },
      { to: "/enki/bank-accounts", icon: Landmark, label: "Bank Accounts" },
      { to: "/enki/recipients", icon: Users, label: "Payout Recipients" },
      { to: "/enki/ledger", icon: BookOpen, label: "Ledger" },
    ],
  },
  {
    title: "Compliance & Verifications",
    items: [
      { to: "/enki/kyc-verifications", icon: Shield, label: "KYC / KYB" },
      { to: "/enki/kyb-review", icon: Shield, label: "KYB Review Queue" },
    ],
  },
  {
    title: "Observability",
    items: [
      { to: "/enki/integration-health", icon: Activity, label: "Integration Health" },
      { to: "/enki/request-traces", icon: Eye, label: "Request Traces" },
      { to: "/enki/plaid-reconciliation", icon: RefreshCw, label: "Plaid Reconciliation" },
    ],
  },
  {
    title: "Crypto",
    items: [
      { to: "/enki/crypto/wallets", icon: Wallet, label: "Wallets" },
      { to: "/enki/crypto/stores", icon: Store, label: "Stores" },
      { to: "/enki/crypto/commissions", icon: DollarSign, label: "Commissions" },
      { to: "/enki/crypto/webhooks", icon: Bell, label: "Webhook Events" },
      { to: "/enki/crypto/audit", icon: Eye, label: "Audit Log" },
    ],
  },
];

// ─── Nav Item Component ─────────────────────────────────
function SidebarNavItem({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const isActive = location.pathname === item.to;

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
        isActive
          ? "bg-primary/10 text-primary border-l-[3px] border-primary -ml-px"
          : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
      }`}
    >
      <item.icon
        className={`h-[18px] w-[18px] shrink-0 transition-colors ${
          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        }`}
      />
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
}

// ─── Sidebar Content ────────────────────────────────────
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { data: userRole } = useUserRole();
  const { environment, setEnvironment, isTestMode } = useEnvironment();

  const isAdmin = userRole?.isAdmin || userRole?.isSuperAdmin || false;
  const isOnAdminRoute = location.pathname.startsWith("/enki");

  const currentSections = isOnAdminRoute ? adminSections : navSections;

  const isItemVisible = (item: NavItem) => {
    if (!item.visibleTo) return true;
    if (!userRole) return false;
    const roles = userRole.roles || [];
    if (userRole.isSuperAdmin) return true;
    return item.visibleTo.some((r) => roles.includes(r));
  };

  return (
    <>
      {/* Logo Header */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-5">
        <div className="flex items-center gap-2.5">
          <img src={everpayIcon} alt="Everpay" className="h-7 w-7 rounded-lg" />
          <span className="font-heading text-base font-bold text-foreground tracking-tight">
            {isOnAdminRoute ? "Enki" : "Everpay"}
          </span>
        </div>
      </div>

      {/* Environment Toggle */}
      {!isOnAdminRoute && (
        <div className="px-3 pt-3 pb-1">
          <div className="flex items-center rounded-lg bg-muted/50 p-0.5">
            <button
              onClick={() => setEnvironment("test")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold transition-all ${
                isTestMode
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isTestMode ? "bg-amber-500" : "bg-muted-foreground/40"}`} />
              Test
            </button>
            <button
              onClick={() => setEnvironment("live")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold transition-all ${
                !isTestMode
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${!isTestMode ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
              Live
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {currentSections.map((section, idx) => {
          const visibleItems = section.items.filter(isItemVisible);
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title || `section-${idx}`} className={idx > 0 ? "mt-5" : ""}>
              {section.title && (
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => (
                  <SidebarNavItem
                    key={item.to}
                    item={item}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Settings (non-admin only) */}
        {!isOnAdminRoute && (
          <div className="mt-5">
            <SidebarNavItem
              item={{ to: "/settings", icon: Settings, label: "Settings" }}
              onNavigate={onNavigate}
            />
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-3 py-3 space-y-1">
        {isAdmin && (
          <NavLink
            to="/enki"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground transition-colors"
          >
            <ArrowLeftRight className="h-[18px] w-[18px] text-muted-foreground" />
            {isOnAdminRoute ? "Admin Home" : "Admin Panel"}
          </NavLink>
        )}

        {user && (
          <div className="px-3 py-1.5">
            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
          </div>
        )}

        <button
          onClick={() => {
            signOut();
            onNavigate?.();
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Sign Out
        </button>
      </div>
    </>
  );
}

// ─── AppSidebar (responsive shell) ──────────────────────
export function AppSidebar() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          className="md:hidden fixed top-3 left-3 z-50 h-10 w-10 bg-card border border-border shadow-card rounded-full"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-[240px] p-0 bg-sidebar border-sidebar-border">
            <VisuallyHidden>
              <SheetTitle>Navigation</SheetTitle>
            </VisuallyHidden>
            <div className="flex h-full flex-col">
              <SidebarContent onNavigate={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col border-r border-sidebar-border bg-sidebar">
      <SidebarContent />
    </aside>
  );
}
