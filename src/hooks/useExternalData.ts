import { createClient } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";

// This client points to THIS project (Enki) where admin-data-proxy is deployed.
// The main supabase client is aliased to the external project for auth,
// so we need a separate client for invoking local edge functions.
const LOCAL_SUPABASE_URL = 'https://schxpniiwnxzscbcnynt.supabase.co';
const LOCAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjaHhwbmlpd254enNjYmNueW50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjkzMjYsImV4cCI6MjA5MTI0NTMyNn0.AuNS8fpvPVZDazKkP9lpD4ddfW0CUt-jB012lNrrnlI';

const localSupabase = createClient(LOCAL_SUPABASE_URL, LOCAL_SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

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
  // Get the user's JWT from the external-project auth session
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  const { data, error } = await localSupabase.functions.invoke("admin-data-proxy", {
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
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
