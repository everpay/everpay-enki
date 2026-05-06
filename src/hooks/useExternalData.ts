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
  order?: { column: string; ascending?: boolean } | { column: string; ascending?: boolean }[];
  limit?: number;
  offset?: number;
  count?: boolean;
  on_conflict?: string;
  // For special actions
  user_id?: string;
  new_role?: string;
  status?: string;
  // Free-form extras for kyb_signed_url, kyb_decide, etc.
  [key: string]: any;
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
export async function extSelect(table: string, options?: { select?: string; filters?: Record<string, any>; order?: { column: string; ascending?: boolean } | { column: string; ascending?: boolean }[]; limit?: number }) {
  const res = await externalProxy({
    action: "select",
    table,
    ...options,
  });
  return res.data || [];
}

export async function extSelectPaged<T = any>(
  table: string,
  options: {
    select?: string;
    filters?: Record<string, any>;
    order?: { column: string; ascending?: boolean } | { column: string; ascending?: boolean }[];
    page?: number;
    pageSize?: number;
  }
): Promise<{ data: T[]; count: number }> {
  const page = Math.max(1, options.page || 1);
  const pageSize = Math.max(1, Math.min(500, options.pageSize || 25));
  const offset = (page - 1) * pageSize;
  const res = await externalProxy({
    action: "select",
    table,
    select: options.select,
    filters: options.filters,
    order: options.order,
    limit: pageSize,
    offset,
    count: true,
  });
  return { data: (res.data || []) as T[], count: Number(res.count || 0) };
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

// ---------------------------------------------------------------------------
// Platform OS gateway token status — used by the Admin “Token rotation”
// panel. Returns a non-reversible fingerprint so admins can confirm that the
// rotated value took effect WITHOUT ever seeing the secret itself.
// ---------------------------------------------------------------------------
export interface PlatformTokenStatus {
  token_configured: boolean;
  token_fingerprint: string | null;
  token_reason: string | null;
  gateway_url_configured: boolean;
  gateway_reachable: boolean;
  gateway_error: string | null;
  external_service_role_configured: boolean;
}

export async function getPlatformTokenStatus(): Promise<PlatformTokenStatus> {
  const res = await externalProxy({ action: "token_status" });
  return res.data as PlatformTokenStatus;
}

// ---------------------------------------------------------------------------
// KYB document helpers
// ---------------------------------------------------------------------------
export async function getKybSignedUrl(file_path: string, expires_in = 300): Promise<string> {
  const res = await externalProxy({ action: "kyb_signed_url", file_path, expires_in });
  return (res?.signed_url || "") as string;
}

export interface KybDecision {
  id: string;
  status: "approved" | "rejected";
  notes?: string | null;
}
export async function decideKybDocuments(decisions: KybDecision[]) {
  const res = await externalProxy({ action: "kyb_decide", decisions });
  return (res?.results || []) as Array<{ id: string; ok: boolean; error?: string }>;
}
