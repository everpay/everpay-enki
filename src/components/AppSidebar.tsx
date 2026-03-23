import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Settings,
  CreditCard,
  Menu,
  LogOut,
  RefreshCw,
  Link2,
  Shield,
  FileText,
  ChevronDown,
  ArrowUpRight,
  Eye,
  UserCircle,
  BarChart3,
  AlertTriangle,
  Archive,
  User,
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
} from "lucide-react";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import everpayIcon from "@/assets/everpay-icon.png";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  children?: { to: string; icon: React.ElementType; label: string }[];
  visibleTo?: string[];
}

const navItems: NavItem[] = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/customers", icon: UserCircle, label: "Customers" },
  {
    to: "/transactions",
    icon: ArrowLeftRight,
    label: "Transactions",
    children: [
      { to: "/transactions", icon: Eye, label: "Overview" },
      { to: "/payments/new", icon: CreditCard, label: "New Payment" },
      { to: "/payment-links", icon: Link2, label: "Payment Links" },
      { to: "/refunds", icon: RotateCcw, label: "Refunds" },
    ],
  },
  { to: "/products", icon: Package, label: "Products" },
  { to: "/subscriptions", icon: RefreshCw, label: "Subscriptions" },
  { to: "/invoices", icon: FileText, label: "Invoices" },
  {
    to: "/chargebacks",
    icon: Shield,
    label: "Chargebacks",
    children: [
      { to: "/chargebacks", icon: Eye, label: "Overview" },
      { to: "/chargebacks/disputes", icon: AlertTriangle, label: "Disputes" },
      { to: "/chargebacks/evidence", icon: Archive, label: "Evidence" },
      { to: "/chargebacks/analytics", icon: BarChart3, label: "Analytics" },
    ],
  },
  {
    to: "/analytics",
    icon: BarChart3,
    label: "Analytics",
    children: [
      { to: "/analytics", icon: Eye, label: "Overview" },
      { to: "/processor-analytics", icon: BarChart3, label: "Processor Analytics" },
      { to: "/payment-methods", icon: CreditCardIcon, label: "Payment Methods" },
      { to: "/reconciliation", icon: FileBarChart, label: "Reconciliation" },
      { to: "/settlements", icon: Landmark, label: "Settlements" },
      { to: "/ledger", icon: BookOpen, label: "Ledger" },
      { to: "/audit-trail", icon: Shield, label: "Audit Trail" },
      { to: "/fraud-graph", icon: Shield, label: "Fraud Intelligence" },
    ],
  },
  { to: "/kyc-aml", icon: Shield, label: "KYC / AML", visibleTo: ["admin", "super_admin"] },
  {
    to: "/bigcommerce",
    icon: Store,
    label: "Integrations",
    children: [
      { to: "/bigcommerce", icon: Store, label: "BigCommerce" },
      { to: "/shopify", icon: Package, label: "Shopify" },
    ],
  },
  {
    to: "/wallets",
    icon: Wallet,
    label: "Treasury",
    children: [
      { to: "/wallets", icon: Eye, label: "Wallets" },
      { to: "/treasury", icon: Landmark, label: "Liquidity & FX" },
      { to: "/payouts", icon: ArrowUpRight, label: "Payouts" },
    ],
  },
  { to: "/live", icon: BarChart3, label: "Live Analytics" },
  { to: "/developers", icon: BookOpen, label: "Developer Portal", visibleTo: ["developer", "merchant", "admin", "super_admin"] },
  { to: "/reseller", icon: Users, label: "Reseller Portal", visibleTo: ["reseller"] },
];

const adminNavItems: NavItem[] = [
  { to: "/enki", icon: LayoutDashboard, label: "Overview" },
  { to: "/enki/merchants", icon: Store, label: "Merchants" },
  { to: "/enki/users", icon: Users, label: "Users" },
  { to: "/enki/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/enki/fees", icon: CreditCardIcon, label: "Transaction Fees" },
  { to: "/enki/routing", icon: Globe, label: "PSP Routing" },
  { to: "/enki/3ds", icon: Shield, label: "3DS Controls" },
  { to: "/enki/notifications", icon: Bell, label: "Notifications" },
  { to: "/enki/reserves", icon: Landmark, label: "Reserves" },
  { to: "/enki/regulatory", icon: FileBarChart, label: "Regulatory Export" },
  { to: "/enki/board", icon: BarChart3, label: "Board Overview" },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { data: userRole } = useUserRole();

  const isAdmin = userRole?.isAdmin || false;
  const isOnAdminRoute = location.pathname.startsWith("/enki");

  const isChildActive = (item: NavItem) =>
    item.children?.some((c) => location.pathname === c.to) || location.pathname === item.to;

  const visibleItems = navItems.filter((item) => {
    if (!item.visibleTo) return true;
    if (!userRole) return false;
    const roles = userRole.roles || [];
    if (
      item.visibleTo.includes("user") &&
      !item.visibleTo.includes("admin") &&
      !item.visibleTo.includes("super_admin")
    ) {
      const nonUserRoles = roles.filter((r: string) => r !== "user");
      if (nonUserRoles.length > 0) return false;
      return roles.includes("user") || roles.length === 0;
    }
    return item.visibleTo.some((r) => roles.includes(r));
  });

  const currentItems = isOnAdminRoute ? adminNavItems : visibleItems;

  return (
    <>
      <div className="flex h-16 items-center border-b border-border px-6">
        <div className="flex items-center gap-2.5">
          <img src={everpayIcon} alt="Everpay" className="h-8 w-8 rounded-lg" />
          <span className="font-heading text-lg font-bold text-foreground tracking-tight">
            {isOnAdminRoute ? "Enki Admin" : "Everpay"}
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {currentItems.map((item) => {
          if (item.children) {
            const active = isChildActive(item);
            return (
              <Collapsible key={item.to + item.label} defaultOpen={active}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground">
                  <span className="flex items-center gap-3">
                    <item.icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                    {item.label}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-3">
                    {item.children.map((child) => {
                      const childActive = location.pathname === child.to;
                      return (
                        <NavLink
                          key={child.to + child.label}
                          to={child.to}
                          onClick={onNavigate}
                          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                            childActive
                              ? "bg-sidebar-accent text-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                          }`}
                        >
                          <child.icon className={`h-3.5 w-3.5 ${childActive ? "text-primary" : ""}`} />
                          {child.label}
                        </NavLink>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          }

          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              }`}
            >
              <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
              {item.label}
            </NavLink>
          );
        })}

        {!isOnAdminRoute && (
          <NavLink
            to="/settings"
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
              location.pathname === "/settings"
                ? "bg-sidebar-accent text-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
            }`}
          >
            <Settings className={`h-4 w-4 ${location.pathname === "/settings" ? "text-primary" : ""}`} />
            Settings
          </NavLink>
        )}
      </nav>

      <div className="border-t border-border px-3 py-4 space-y-1">
        {/* Admin toggle link */}
        {isAdmin && (
          <NavLink
            to={isOnAdminRoute ? "/dashboard" : "/enki"}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
          >
            <ArrowLeftRight className="h-4 w-4" />
            {isOnAdminRoute ? "Back to App" : "Admin Panel"}
          </NavLink>
        )}

        {user && (
          <div className="px-3 py-2 mb-1">
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}

        <button
          onClick={() => {
            signOut();
            onNavigate?.();
          }}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-destructive font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4 text-destructive" />
          Sign Out
        </button>
      </div>
    </>
  );
}

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
          className="md:hidden fixed top-3 left-3 z-50 h-10 w-10 bg-card border border-border shadow-card"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-[240px] p-0 bg-sidebar border-border">
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
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col border-r border-border bg-sidebar">
      <SidebarContent />
    </aside>
  );
}
