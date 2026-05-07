import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Plus, Wallet as WalletIcon } from "lucide-react";
import { extSelect } from "@/hooks/useExternalData";
import { useCryptoWallets } from "@/hooks/useCryptoWallets";
import { AddWalletDialog } from "./AddWalletDialog";
import { toast } from "sonner";

interface Props {
  merchantId: string | null;
  merchantName?: string;
  merchantEmail?: string | null;
  onClose: () => void;
}

export function CopyAddress({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Address copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  };
  return (
    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onCopy(); }} title="Copy address">
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
}

export function MerchantDetailDrawer({ merchantId, merchantName, merchantEmail, onClose }: Props) {
  const open = !!merchantId;
  const [showAdd, setShowAdd] = useState(false);
  const { data: wallets = [], isLoading: walletsLoading } = useCryptoWallets(merchantId || undefined);

  const { data: payments = [] } = useQuery({
    queryKey: ["elektropay-payments-merchant", merchantId],
    enabled: !!merchantId,
    queryFn: async () => {
      return await extSelect("elektropay_payments", {
        filters: { merchant_id: merchantId },
        order: { column: "created_at", ascending: false },
        limit: 25,
      });
    },
  });

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {merchantName || "Merchant"}
            <Badge variant="outline" className="font-mono text-[10px]">{merchantId?.slice(0, 8)}</Badge>
          </SheetTitle>
          <SheetDescription>{merchantEmail || "—"}</SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Tabs defaultValue="wallets">
            <TabsList>
              <TabsTrigger value="wallets">Wallets ({wallets.length})</TabsTrigger>
              <TabsTrigger value="activity">Activity ({payments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="wallets" className="space-y-3 mt-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setShowAdd(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Add wallet
                </Button>
              </div>
              {walletsLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : wallets.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  <WalletIcon className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  No wallets. Add one to get started.
                </div>
              ) : (
                <div className="space-y-2">
                  {wallets.map((w) => (
                    <div key={w.id} className="rounded-lg border border-border p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px]">{w.asset_id}</Badge>
                          {w.network && <span className="text-[10px] text-muted-foreground">{w.network}</span>}
                          <Badge variant={w.status === "active" ? "default" : "secondary"} className="text-[10px]">{w.status}</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs truncate" title={w.address || ""}>{w.address || "—"}</span>
                          {w.address && <CopyAddress value={w.address} />}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium">{Number(w.balance).toFixed(6)}</p>
                        <p className="text-[10px] text-muted-foreground">avail {Number(w.available).toFixed(6)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-2 mt-4">
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
              ) : (
                payments.map((p: any) => (
                  <div key={p.id} className="rounded-lg border border-border p-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{p.payment_type || "PAYMENT"} · {p.crypto_currency || p.asset_id || "—"}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{Number(p.amount ?? 0).toFixed(2)} {p.fiat_currency || ""}</p>
                      <Badge variant="outline" className="text-[10px]">{p.status || "—"}</Badge>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {merchantId && (
          <AddWalletDialog
            merchantId={merchantId}
            open={showAdd}
            onClose={() => setShowAdd(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}