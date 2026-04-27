import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { extSelect } from "@/hooks/useExternalData";
import { toast } from "sonner";

export interface WebhookEvent {
  id: string;
  event_id: string;
  event_type: string;
  payload: Record<string, any>;
  processed: boolean;
  error_message: string | null;
  attempt_count: number | null;
  last_attempt_at: string | null;
  created_at: string;
}

const PAGE_SIZE = 50;

export function useElektropayWebhookEvents() {
  return useInfiniteQuery({
    queryKey: ["elektropay-webhook-events"],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const page = pageParam as number;
      const all = (await extSelect("elektropay_webhook_events", {
        order: { column: "created_at", ascending: false },
        limit: 500,
      })) as WebhookEvent[];
      const start = page * PAGE_SIZE;
      const rows = all.slice(start, start + PAGE_SIZE);
      return { rows, page };
    },
    getNextPageParam: (last) =>
      last.rows.length === PAGE_SIZE ? last.page + 1 : undefined,
  });
}

export function useRetryWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_event_id: string) => {
      throw new Error(
        "Webhook retry requires the elektropay-wallet edge function (not deployed in Enki)."
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["elektropay-webhook-events"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}