import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { extSelect, extUpsert, extDelete } from "@/hooks/useExternalData";
import { toast } from "sonner";
import { z } from "zod";

export interface CryptoCommission {
  id: string;
  merchant_id: string | null;
  asset_id: string | null;
  tx_type: "deposit" | "withdrawal" | "convert" | "transfer" | "payment";
  fee_percent: number;
  fee_fixed: number;
  split_to_wallet_id: string | null;
  split_percent: number;
  is_active: boolean;
  created_at: string;
}

export const commissionSchema = z.object({
  id: z.string().uuid().optional(),
  merchant_id: z.string().uuid().nullable().optional(),
  asset_id: z.string().min(1).nullable().optional(),
  tx_type: z.enum(["deposit", "withdrawal", "convert", "transfer", "payment"]),
  fee_percent: z.coerce.number().min(0).max(100),
  fee_fixed: z.coerce.number().min(0),
  split_to_wallet_id: z.string().uuid().nullable().optional(),
  split_percent: z.coerce.number().min(0).max(100),
  is_active: z.boolean().optional(),
});

export function useCryptoCommissions() {
  return useQuery({
    queryKey: ["crypto-commissions"],
    queryFn: async () => {
      const rows = await extSelect("crypto_commissions", {
        order: { column: "created_at", ascending: false },
      });
      return (rows || []) as CryptoCommission[];
    },
  });
}

export function useUpsertCommission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Partial<CryptoCommission>) => {
      const parsed = commissionSchema.safeParse(row);
      if (!parsed.success) {
        throw new Error(parsed.error.errors[0]?.message || "Invalid values");
      }
      if (parsed.data.split_percent > 0 && !parsed.data.split_to_wallet_id) {
        throw new Error("Split wallet is required when split % > 0");
      }
      return await extUpsert("crypto_commissions", parsed.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crypto-commissions"] });
      toast.success("Commission saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCommission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await extDelete("crypto_commissions", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crypto-commissions"] });
      toast.success("Commission deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}