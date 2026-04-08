import { NavLink, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  BookOpen, Code2, Key, Webhook, Download, Compass,
  CreditCard, Users, ArrowLeftRight, ChevronLeft, Zap,
  UserCircle, FileText, Package, RefreshCw, Banknote,
  Wallet, Landmark, Link2, ListOrdered, CreditCard as CardIcon,
} from "lucide-react";

const navSections = [
  {
    title: "Getting Started",
    items: [
      { label: "Overview", icon: Compass, to: "/developers" },
      { label: "Quick Start", icon: Zap, to: "/developers/quickstart" },
    ],
  },
  {
    title: "API Reference",
    items: [
      { label: "Authentication", icon: Key, to: "/developers/api/authentication" },
      { label: "Payments", icon: CreditCard, to: "/developers/api/payments" },
      { label: "Payment Intents", icon: Zap, to: "/developers/api/payments" },
      { label: "Payment Methods", icon: CardIcon, to: "/developers/api/payment-methods" },
      { label: "Payment Links", icon: Link2, to: "/developers/api/payment-links" },
      { label: "Customers", icon: UserCircle, to: "/developers/api/customers" },
      { label: "Merchants", icon: Users, to: "/developers/api/merchants" },
      { label: "Transactions", icon: ArrowLeftRight, to: "/developers/api/transactions" },
      { label: "Invoices", icon: FileText, to: "/developers/api/invoices" },
      { label: "Products", icon: Package, to: "/developers/api/products" },
      { label: "Plans", icon: ListOrdered, to: "/developers/api/plans" },
      { label: "Subscriptions", icon: RefreshCw, to: "/developers/api/subscriptions" },
      { label: "Payouts", icon: Banknote, to: "/developers/api/payouts" },
      { label: "Wallets", icon: Wallet, to: "/developers/api/wallets" },
      { label: "Bank Accounts", icon: Landmark, to: "/developers/api/bank-accounts" },
      { label: "3D Secure", icon: Key, to: "/developers/api/3d-secure" },
      { label: "Saved Cards", icon: CreditCard, to: "/developers/api/saved-cards" },
      { label: "Cascading Payments", icon: RefreshCw, to: "/developers/api/cascading" },
      { label: "Disputes", icon: Users, to: "/developers/api/disputes" },
      { label: "Bank Debits", icon: Landmark, to: "/developers/api/bank-debits" },
      { label: "Bank Redirects", icon: ArrowLeftRight, to: "/developers/api/bank-redirects" },
      { label: "Matrix Partners", icon: Landmark, to: "/developers/api/matrix" },
    ],
  },
  {
    title: "Tools",
    items: [
      { label: "API Keys", icon: Key, to: "/developers/keys" },
      { label: "Webhooks", icon: Webhook, to: "/developers/webhooks" },
      { label: "SDK & Downloads", icon: Download, to: "/developers/sdks" },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "Integration Guides", icon: BookOpen, to: "/developers/guides" },
      { label: "Code Examples", icon: Code2, to: "/developers/examples" },
    ],
  },
];

interface Props {
  open: boolean;
  onToggle: () => void;
}

export const DeveloperSidebar = ({ open, onToggle }: Props) => {
  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border z-30 transition-all duration-300 flex flex-col",
        open ? "w-56" : "w-16"
      )}
    >
      <div className="flex items-center justify-between px-4 h-14 border-b border-sidebar-border shrink-0">
        {open && (
          <Link to="/developers" className="flex items-center gap-2">
            <img
              src="https://res.cloudinary.com/lmj6rf6tz/image/upload/v1681518139/img/LogoSqr.png"
              alt="Everpay"
              className="h-7"
            />
            <span className="font-heading font-bold text-base text-sidebar-foreground">everpay</span>
          </Link>
        )}
        <button onClick={onToggle} className="p-1.5 rounded-full hover:bg-sidebar-accent transition-colors">
          <ChevronLeft className={cn("w-4 h-4 transition-transform", !open && "rotate-180")} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {navSections.map((section) => (
          <div key={section.title} className="mb-4">
            {open && (
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 mb-1.5 font-semibold">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/developers"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )
                  }
                >
                  <item.icon className="w-[18px] h-[18px] shrink-0" />
                  {open && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {open && (
        <div className="px-4 py-3 border-t border-sidebar-border">
          <p className="text-[10px] text-muted-foreground">API Version v2 · 2026.03</p>
        </div>
      )}
    </aside>
  );
};