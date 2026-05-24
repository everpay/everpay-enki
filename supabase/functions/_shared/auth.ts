// Shared JWT verification helper for all Supabase Edge Functions in this project.
//
// Usage:
//
//   import { verifyJwt } from "../_shared/auth.ts";
//   const v = await verifyJwt(req);
//   if (!v.ok) return v.response;
//   const userId = v.userId;
//
// The helper supports two distinct token issuers:
//   1. The local (Enki) Supabase project — verified via JWKS using `getClaims()`.
//   2. The external Everpay auth project (where merchants sign in) — verified via
//      `getUser()` against the external auth server when EXTERNAL_SUPABASE_URL is set.
//
// Callers may opt into role-based authorization by passing `requireRoles`. Role
// checks are performed against the LOCAL `user_roles` table first, then the
// external `user_roles` table when `allowExternalRoles` is true.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AppRole = "admin" | "super_admin" | "developer" | "reseller" | "merchant" | string;

// Hardcoded super-admin emails. These accounts are always treated as
// super_admin regardless of what's in user_roles (local or external).
// Keeps admin tooling usable when role rows haven't been provisioned yet.
const SUPER_ADMIN_EMAILS = new Set<string>([
  "richard.r@everpayinc.com",
  "support@everpayinc.com",
]);

export type VerifyOptions = {
  /** Required app_role(s). If any match, request is authorized. */
  requireRoles?: AppRole[];
  /** Also consult the external project's `user_roles` table for role checks. */
  allowExternalRoles?: boolean;
  /** Allow direct invocation with the SERVICE_ROLE_KEY as the bearer token. */
  allowServiceRole?: boolean;
};

export type VerifyResult =
  | {
      ok: true;
      userId: string;
      email: string | null;
      claims: Record<string, unknown> | null;
      issuer: "local" | "external" | "service_role";
      isAdmin: boolean;
      localAdmin: SupabaseClient;
    }
  | { ok: false; response: Response };

function jr(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function verifyJwt(req: Request, opts: VerifyOptions = {}): Promise<VerifyResult> {
  const localUrl = Deno.env.get("SUPABASE_URL")!;
  const localAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const localSvc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const localAdmin = createClient(localUrl, localSvc, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return { ok: false, response: jr({ error: "Unauthorized" }, 401) };
  }
  const token = authHeader.slice(7).trim();
  if (!token) return { ok: false, response: jr({ error: "Unauthorized" }, 401) };

  // Service-role shortcut (background jobs / maintenance scripts).
  if (opts.allowServiceRole && token === localSvc) {
    return {
      ok: true,
      userId: "service_role",
      email: null,
      claims: null,
      issuer: "service_role",
      isAdmin: true,
      localAdmin,
    };
  }

  let userId: string | null = null;
  let email: string | null = null;
  let claims: Record<string, unknown> | null = null;
  let issuer: "local" | "external" | null = null;

  // 1) Try local JWKS verification via getClaims() (works with new ES256 signing keys).
  try {
    const local = createClient(localUrl, localAnon, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await local.auth.getClaims(token);
    if (!error && data?.claims?.sub) {
      claims = data.claims as Record<string, unknown>;
      userId = String(data.claims.sub);
      email = (data.claims.email as string | undefined) ?? null;
      issuer = "local";
    }
  } catch (_) { /* fall through */ }

  // 2) Try external auth project (where merchants/admins actually sign in).
  if (!userId) {
    const extUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
    const extAnon = Deno.env.get("EXTERNAL_SUPABASE_ANON_KEY");
    if (extUrl && extAnon) {
      try {
        const ext = createClient(extUrl, extAnon, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        const { data, error } = await ext.auth.getUser(token);
        if (!error && data?.user?.id) {
          userId = data.user.id;
          email = data.user.email ?? null;
          issuer = "external";
        }
      } catch (_) { /* ignore */ }
    }
  }

  // 3) Final fallback: local getUser() for legacy HS256 tokens.
  if (!userId) {
    try {
      const local = createClient(localUrl, localAnon);
      const { data, error } = await local.auth.getUser(token);
      if (!error && data?.user?.id) {
        userId = data.user.id;
        email = data.user.email ?? null;
        issuer = "local";
      }
    } catch (_) { /* ignore */ }
  }

  if (!userId || !issuer) {
    return { ok: false, response: jr({ error: "Unauthorized" }, 401) };
  }

  // Role check (optional).
  let isAdmin = false;
  const emailLc = (email || "").toLowerCase();
  const isHardcodedSuper = !!emailLc && SUPER_ADMIN_EMAILS.has(emailLc);
  if (opts.requireRoles && opts.requireRoles.length > 0) {
    const wanted = new Set(opts.requireRoles);
    const matched =
      (isHardcodedSuper && (wanted.has("admin") || wanted.has("super_admin"))) ||
      (await hasAnyRole(localAdmin, userId, wanted, opts.allowExternalRoles === true)) ||
      (await hasAnyRoleByEmail(localAdmin, email, wanted, opts.allowExternalRoles === true));
    isAdmin = wanted.has("admin") || wanted.has("super_admin")
      ? matched
      : (await hasAnyRole(localAdmin, userId, new Set(["admin", "super_admin"]), opts.allowExternalRoles === true)) ||
        (await hasAnyRoleByEmail(localAdmin, email, new Set(["admin", "super_admin"]), opts.allowExternalRoles === true));
    if (isHardcodedSuper) isAdmin = true;
    if (!matched) {
      return { ok: false, response: jr({ error: "Forbidden" }, 403) };
    }
  } else {
    const adminRoles = new Set(["admin", "super_admin"]);
    isAdmin = isHardcodedSuper ||
      await hasAnyRole(localAdmin, userId, adminRoles, opts.allowExternalRoles === true) ||
      await hasAnyRoleByEmail(localAdmin, email, adminRoles, opts.allowExternalRoles === true);
  }

  return { ok: true, userId, email, claims, issuer, isAdmin, localAdmin };
}

async function hasAnyRole(
  localAdmin: SupabaseClient,
  userId: string,
  wanted: Set<string>,
  allowExternal: boolean,
): Promise<boolean> {
  const localRoles = await localAdmin.from("user_roles").select("role").eq("user_id", userId);
  if ((localRoles.data ?? []).some((r: any) => wanted.has(r.role))) return true;

  if (allowExternal) {
    const extUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
    const extKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");
    if (extUrl && extKey) {
      try {
        const ext = createClient(extUrl, extKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        const extRoles = await ext.from("user_roles").select("role").eq("user_id", userId);
        if ((extRoles.data ?? []).some((r: any) => wanted.has(r.role))) return true;
      } catch (_) { /* ignore */ }
    }
  }
  return false;
}

async function hasAnyRoleByEmail(
  localAdmin: SupabaseClient,
  email: string | null,
  wanted: Set<string>,
  allowExternal: boolean,
): Promise<boolean> {
  const emailLc = (email || "").trim().toLowerCase();
  if (!emailLc) return false;

  const localUserIds = await authUserIdsByEmail(localAdmin, emailLc);
  for (const id of localUserIds) {
    if (await hasAnyRole(localAdmin, id, wanted, false)) return true;
  }

  if (allowExternal) {
    const extUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
    const extKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");
    if (extUrl && extKey) {
      try {
        const ext = createClient(extUrl, extKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        for (const id of await authUserIdsByEmail(ext, emailLc)) {
          const extRoles = await ext.from("user_roles").select("role").eq("user_id", id);
          if ((extRoles.data ?? []).some((r: any) => wanted.has(r.role))) return true;
        }
      } catch (_) { /* ignore */ }
    }
  }

  return false;
}

async function authUserIdsByEmail(client: SupabaseClient, emailLc: string): Promise<string[]> {
  const ids: string[] = [];
  for (let page = 1; page <= 5; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data?.users?.length) break;
    ids.push(...data.users
      .filter((u: any) => (u.email || "").toLowerCase() === emailLc)
      .map((u: any) => u.id)
      .filter(Boolean));
    if (data.users.length < 1000) break;
  }
  return ids;
}

export { corsHeaders };