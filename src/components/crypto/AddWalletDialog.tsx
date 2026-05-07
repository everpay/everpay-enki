import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";
import { extInsert } from "@/hooks/useExternalData";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const LOCAL_URL = "https://schxpniiwnxzscbcnynt.supabase.co";
const LOCAL_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjaHhwbmlpd254enNjYmNueW50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjkzMjYsImV4cCI6MjA5MTI0NTMyNn0.AuNS8fpvPVZDazKkP9lpD4ddfW0CUt-jB012lNrrnlI";
const localSupabase = createClient(LOCAL_URL, LOCAL_ANON, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PROVIDERS = [
  { id: "elektropay", label: "Elektropay (auto-provision)" },
  { id: "circle", label: "Circle (USDC)" },
  { id: "tether", label: "Tether (USDT)" },
  { id: "manual", label: "Manual address" },
];

const ASSETS = [
  "USDT.TRC20", "USDT.ERC20", "USDC.ERC20", "USDC.POLY",
  "BTC", "ETH", "LTC", "TRX", "POL",
];

interface Props {
  merchantId: string;
  open: boolean;
  onClose: () => void;
}

export function AddWalletDialog({ merchantId, open, onClose }: Props) {
  const qc = useQueryClient();
  const [provider, setProvider] = useState("elektropay");
  const [assetId, setAssetId] = useState("USDT.TRC20");
  const [address, setAddress] = useState("");
  const [network, setNetwork] = useState("");

  const reset = () => {
    setProvider("elektropay");
    setAssetId("USDT.TRC20");
    setAddress("");
    setNetwork("");
    onClose();
  };

  const add = useMutation({
    mutationFn: async () => {
      if (provider === "elektropay") {
        const { data: s } = await supabase.auth.getSession();
        const { data, error } = await localSupabase.functions.invoke("elektropay-proxy", {
          body: {
            action: "dedicate",
            merchant_id: merchantId,
            payload: { asset_id: assetId, crypto_network: network || undefined },
          },
          headers: s?.session?.access_token ? { Authorization: `Bearer ${s.session.access_token}` } : {},
        });
        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);
        return data;
      }
      // Manual / Circle / Tether: persist directly to elektropay_wallets via proxy.
      if (!address) throw new Error("Address is required");
      await extInsert("elektropay_wallets", {
        merchant_id: merchantId,
        asset_id: assetId,
        currency: assetId.split(".")[0],
        crypto_network: network || null,
        wallet_address: address,
        status: "active",
        balance: 0,
        available: 0,
        on_hold: 0,
      });
      return { ok: true };
    },
    onSuccess: () => {
      toast.success("Wallet added");
      qc.invalidateQueries({ queryKey: ["crypto-wallets"] });
      reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const needsAddress = provider !== "elektropay";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && reset()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add wallet</DialogTitle>
          <DialogDescription>
            Provision a new crypto wallet via Elektropay or attach an external address (Circle, Tether, etc.).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Asset</Label>
            <Select value={assetId} onValueChange={setAssetId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ASSETS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Network (optional)</Label>
            <Input value={network} onChange={(e) => setNetwork(e.target.value)} placeholder="e.g. TRON, ERC20, POLYGON" />
          </div>
          {needsAddress && (
            <div className="space-y-2">
              <Label>Wallet address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="0x… or T…" className="font-mono text-xs" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={reset} disabled={add.isPending}>Cancel</Button>
          <Button onClick={() => add.mutate()} disabled={add.isPending}>
            {add.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add wallet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}