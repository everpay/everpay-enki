import { useInfiniteQuery } from "@tanstack/react-query";
import { externalProxy } from "@/hooks/useExternalData";

export interface CryptoAuditLog {
  id: string;
  resource_type: string;
  resource_id: string;
  change_type: string;
  changed_by: string | null;
  user_token: string | null;
  new_value: any;
  old_value?: any;
  created_at: string;
}

const PAGE_SIZE = 50;

export function useCryptoAuditLogs() {
  return useInfiniteQuery({
    queryKey: ["crypto-audit-logs"],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const page = pageParam as number;
      const res = await externalProxy({
        action: "select",
        table: "audit_logs",
        filters: { resource_type: "crypto" },
        order: { column: "created_at", ascending: false },
        limit: PAGE_SIZE,
      });
      // proxy doesn't support range; we take the first PAGE_SIZE for page 0
      // and stop paginating past page 0 unless backend later supports offset.
      const all = (res?.data || []) as CryptoAuditLog[];
      const start = page * PAGE_SIZE;
      const rows = all.slice(start, start + PAGE_SIZE);
      return { rows, page };
    },
    getNextPageParam: (last) =>
      last.rows.length === PAGE_SIZE ? last.page + 1 : undefined,
  });
}