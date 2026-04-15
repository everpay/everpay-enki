import { supabase } from "@/integrations/supabase/client";

interface ProxyRequest {
  action: string;
  table?: string;
  filters?: Record<string, any>;
  data?: any;
  id?: string;
  select?: string;
  order?: { column: string; ascending?: boolean };
  limit?: number;
  on_conflict?: string;
  // For special actions
  user_id?: string;
  new_role?: string;
  status?: string;
}

export async function externalProxy(body: ProxyRequest) {
  const { data, error } = await supabase.functions.invoke("admin-data-proxy", {
    body,
  });
  if (error) throw new Error(error.message || "Proxy call failed");
  if (data?.error) throw new Error(data.error);
  return data;
}

// Convenience helpers
export async function extSelect(table: string, options?: { select?: string; filters?: Record<string, any>; order?: { column: string; ascending?: boolean }; limit?: number }) {
  const res = await externalProxy({
    action: "select",
    table,
    ...options,
  });
  return res.data || [];
}

export async function extInsert(table: string, data: any) {
  const res = await externalProxy({ action: "insert", table, data });
  return res.data;
}

export async function extUpdate(table: string, id: string, data: any) {
  const res = await externalProxy({ action: "update", table, id, data });
  return res.data;
}

export async function extUpsert(table: string, data: any, onConflict?: string) {
  const res = await externalProxy({ action: "upsert", table, data, on_conflict: onConflict });
  return res.data;
}

export async function extDelete(table: string, id: string) {
  await externalProxy({ action: "delete", table, id });
}