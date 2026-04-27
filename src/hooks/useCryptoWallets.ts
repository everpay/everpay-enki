import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { extSelect, extUpdate } from "@/hooks/useExternalData";
import { toast } from "sonner";

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
      const rows = await extSelect("crypto_wallets", {
        filters: merchantId ? { merchant_id: merchantId } : undefined,
        order: { column: "created_at", ascending: false },
      });
      return (rows || []) as CryptoWallet[];
    },
  });
}

export function useCryptoAssets() {
  return useQuery({
    queryKey: ["crypto-assets"],
    queryFn: async () => {
      const rows = await extSelect("crypto_assets", {
        order: { column: "symbol", ascending: true },
      });
      return (rows || []) as CryptoAsset[];
    },
  });
}

export function useCryptoStores(merchantId?: string) {
  return useQuery({
    queryKey: ["crypto-stores", merchantId],
    queryFn: async () => {
      const rows = await extSelect("crypto_stores", {
        filters: merchantId ? { merchant_id: merchantId } : undefined,
        order: { column: "created_at", ascending: false },
      });
      return (rows || []) as CryptoStore[];
    },
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