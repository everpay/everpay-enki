import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { extSelect, extUpdate } from "@/hooks/useExternalData";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";

const LOCAL_SUPABASE_URL = "https://schxpniiwnxzscbcnynt.supabase.co";
const LOCAL_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjaHhwbmlpd254enNjYmNueW50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjkzMjYsImV4cCI6MjA5MTI0NTMyNn0.AuNS8fpvPVZDazKkP9lpD4ddfW0CUt-jB012lNrrnlI";
const localSupabase = createClient(LOCAL_SUPABASE_URL, LOCAL_SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function callElektropay(action: string, params: Record<string, any> = {}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  const { data, error } = await localSupabase.functions.invoke("elektropay-proxy", {
    body: { action, ...params },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (error) throw new Error(error.message || "Elektropay call failed");
  if (data?.error) throw new Error(data.error);
  return data;
}

export interface CryptoWallet {
  id: string;
  store_id: string;
  merchant_id: string;
  asset_id: string;
  address: string | null;
  network: string | null;
  balance: number;
  on_hold: number;
  available: number;
  base_balance: number;
  is_default: boolean;
  is_active: boolean;
  status: "active" | "frozen" | "closed";
  is_user_added: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CryptoAsset {
  id: string;
  asset_id: string;
  symbol: string;
  name: string;
  network: string | null;
  decimals: number;
  is_fiat: boolean;
  is_active: boolean;
  min_withdrawal_amount: number | null;
  max_withdrawal_amount: number | null;
}

export interface CryptoStore {
  id: string;
  merchant_id: string;
  name: string;
  base_currency: string;
  is_active: boolean;
  is_test: boolean;
  created_at: string;
  elektropay_store_id: string | null;
}

export function useCryptoWallets(merchantId?: string) {
  return useQuery({
    queryKey: ["crypto-wallets", merchantId],
    queryFn: async () => {
      // Live: hit Elektropay /accounts via proxy. Source of truth = the gateway
      // itself, not our cached supabase table (which can be stale or empty).
      let rows: any[] = [];
      try {
        const data = await callElektropay("list_wallets", merchantId ? { merchant_id: merchantId } : {});
        rows = data?.wallets || [];
      } catch (e) {
        console.warn("list_wallets failed, falling back to local cache", e);
        rows = await extSelect("elektropay_wallets", {
          filters: merchantId ? { merchant_id: merchantId } : undefined,
          order: { column: "created_at", ascending: false },
        });
      }
      return (rows || []).map((w: any): CryptoWallet => ({
        id: w.id,
        store_id: w.elektropay_store_id || "",
        merchant_id: w.merchant_id || merchantId || "",
        asset_id: w.asset_id,
        address: w.wallet_address ?? w.address ?? null,
        network: w.crypto_network_name ?? w.crypto_network ?? null,
        balance: Number(w.balance ?? 0),
        on_hold: Number(w.on_hold ?? 0),
        available: Number(w.available ?? 0),
        base_balance: Number(w.base_balance ?? 0),
        is_default: false,
        is_active: (w.status ?? "active") === "active",
        status: (w.status ?? "active") as CryptoWallet["status"],
        is_user_added: false,
        metadata: { account_type: w.account_type, missing: w._missing },
        created_at: w.created_at || new Date().toISOString(),
        updated_at: w.updated_at || new Date().toISOString(),
      }));
    },
  });
}

export function useCryptoAssets() {
  return useQuery({
    queryKey: ["crypto-assets"],
    queryFn: async () => {
      // Derive available assets from synced wallets so the filter shows real options.
      const wallets = await extSelect("elektropay_wallets", {});
      const seen = new Set<string>();
      const list: CryptoAsset[] = [];
      for (const w of wallets || []) {
        if (seen.has(w.asset_id)) continue;
        seen.add(w.asset_id);
        list.push({
          id: w.asset_id,
          asset_id: w.asset_id,
          symbol: w.currency || w.asset_id,
          name: w.asset_id,
          network: w.crypto_network ?? null,
          decimals: 8,
          is_fiat: false,
          is_active: true,
          min_withdrawal_amount: null,
          max_withdrawal_amount: null,
        });
      }
      return list;
    },
  });
}

export function useCryptoStores(merchantId?: string) {
  return useQuery({
    queryKey: ["crypto-stores", merchantId],
    queryFn: async () => {
      // Live fetch from Elektropay /stores via proxy.
      try {
        const data = await callElektropay("list_stores", {});
        const stores: any[] = Array.isArray(data?.stores) ? data.stores : [];
        return stores.map((s: any): CryptoStore => ({
          id: s.store_id || s.id,
          merchant_id: s.merchant_id || s.custom?.merchant_id || "",
          name: s.name || s.store_name || `Store ${String(s.store_id || "").slice(0, 6)}`,
          base_currency: s.base_currency || "USD",
          is_active: s.status ? s.status === "active" : true,
          is_test: !!s.is_test,
          created_at: s.created_at || new Date().toISOString(),
          elektropay_store_id: s.store_id || null,
        }));
      } catch (e) {
        console.warn("list_stores failed, falling back to elektropay_settings", e);
        const rows = await extSelect("elektropay_settings", {
          filters: merchantId ? { merchant_id: merchantId } : undefined,
        });
        return (rows || []).map((s: any): CryptoStore => ({
          id: s.id,
          merchant_id: s.merchant_id,
          name: `Store ${String(s.merchant_id).slice(0, 6)}`,
          base_currency: "USD",
          is_active: !!s.enabled,
          is_test: false,
          created_at: s.created_at,
          elektropay_store_id: s.elektropay_store_id,
        }));
      }
    },
  });
}

/**
 * Trigger a balance sync from Elektropay for one merchant (or all when no
 * merchantId is provided — the function iterates merchants with elektropay
 * settings on its side).
 */
export function useSyncElektropay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { merchant_id?: string } = {}) => {
      return await callElektropay("sync_balances", vars);
    },
    onSuccess: () => {
      toast.success("Synced from Elektropay");
      qc.invalidateQueries({ queryKey: ["crypto-wallets"] });
      qc.invalidateQueries({ queryKey: ["crypto-assets"] });
      qc.invalidateQueries({ queryKey: ["crypto-stores"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

function notWired(): never {
  throw new Error(
    "Crypto wallet mutations require the elektropay-wallet edge function (not deployed in Enki)."
  );
}

export function useCreateStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_vars: { merchant_id: string; name: string; base_currency?: string }) => notWired(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crypto-stores"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useFreezeWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ wallet_id }: { wallet_id: string }) => {
      await extUpdate("crypto_wallets", wallet_id, { status: "frozen" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crypto-wallets"] });
      toast.success("Wallet frozen");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCloseWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ wallet_id }: { wallet_id: string }) => {
      await extUpdate("crypto_wallets", wallet_id, { status: "closed", is_active: false });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crypto-wallets"] });
      toast.success("Wallet closed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeposit() {
  return useMutation({
    mutationFn: async (_vars: { wallet_id: string; amount?: number }) => notWired(),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useWithdraw() {
  return useMutation({
    mutationFn: async (_vars: { wallet_id: string; amount: number; to_address: string }) => notWired(),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSyncAssets() {
  return useMutation({
    mutationFn: async () => notWired(),
    onError: (e: Error) => toast.error(e.message),
  });
}