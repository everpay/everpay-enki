import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const LOCAL_SUPABASE_URL = "https://schxpniiwnxzscbcnynt.supabase.co";
const LOCAL_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjaHhwbmlpd254enNjYmNueW50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjkzMjYsImV4cCI6MjA5MTI0NTMyNn0.AuNS8fpvPVZDazKkP9lpD4ddfW0CUt-jB012lNrrnlI";

const localSupabase = createClient(LOCAL_SUPABASE_URL, LOCAL_SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface SyncNowButtonProps {
  /** Callback after a successful sync, e.g. to refetch the visible list. */
  onSynced?: () => void | Promise<void>;
  size?: "sm" | "default";
  variant?: "outline" | "default" | "ghost";
  label?: string;
}

/**
 * Manually triggers `sync-external-merchants` to pull a fresh snapshot of
 * auth users + merchants from the production environment.
 */
export function SyncNowButton({ onSynced, size = "sm", variant = "outline", label = "Sync now" }: SyncNowButtonProps) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const { data, error } = await localSupabase.functions.invoke("sync-external-merchants", {
        body: {},
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (error) throw new Error(error.message || "Sync failed");
      if ((data as any)?.error) throw new Error((data as any).error);
      const usersN = (data as any)?.users;
      const merchN = (data as any)?.merchants;
      const parts = [
        usersN != null ? `${usersN} users` : null,
        merchN != null ? `${merchN} merchants` : null,
      ].filter(Boolean);
      toast({
        title: "Sync complete",
        description: parts.length ? `Pulled latest snapshot · ${parts.join(" · ")}.` : "Pulled latest snapshot.",
      });
      await onSynced?.();
    } catch (e: any) {
      toast({
        title: "Sync failed",
        description: e?.message || "Could not reach the sync function.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={busy} variant={variant} size={size} className="gap-2">
      <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
      {busy ? "Syncing…" : label}
    </Button>
  );
}
