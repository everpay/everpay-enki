import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Status = "loading" | "valid" | "already_unsubscribed" | "invalid" | "success" | "error";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    const validate = async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`;
        const res = await fetch(url, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        });
        if (!res.ok) { setStatus("invalid"); return; }
        const data = await res.json();
        if (data.valid === false && data.reason === "already_unsubscribed") {
          setStatus("already_unsubscribed");
        } else if (data.valid) {
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      } catch {
        setStatus("invalid");
      }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) { setStatus("error"); return; }
      if (data?.success) { setStatus("success"); }
      else if (data?.reason === "already_unsubscribed") { setStatus("already_unsubscribed"); }
      else { setStatus("error"); }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-xl border p-8 text-center space-y-4">
        <p className="text-2xl font-bold font-['Sora']" style={{ color: "hsl(172, 72%, 40%)" }}>
          💳 Everpay
        </p>

        {status === "loading" && (
          <div className="flex justify-center">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {status === "valid" && (
          <>
            <h1 className="text-xl font-semibold text-foreground">Unsubscribe from emails</h1>
            <p className="text-muted-foreground text-sm">
              You will no longer receive app notification emails from Everpay.
            </p>
            <button
              onClick={handleUnsubscribe}
              className="mt-4 px-6 py-3 rounded-full text-white font-semibold text-sm"
              style={{ backgroundColor: "hsl(172, 72%, 40%)" }}
            >
              Confirm Unsubscribe
            </button>
          </>
        )}

        {status === "success" && (
          <>
            <h1 className="text-xl font-semibold text-foreground">You've been unsubscribed</h1>
            <p className="text-muted-foreground text-sm">
              You will no longer receive notification emails from Everpay.
            </p>
          </>
        )}

        {status === "already_unsubscribed" && (
          <>
            <h1 className="text-xl font-semibold text-foreground">Already unsubscribed</h1>
            <p className="text-muted-foreground text-sm">
              This email address has already been unsubscribed.
            </p>
          </>
        )}

        {status === "invalid" && (
          <>
            <h1 className="text-xl font-semibold text-foreground">Invalid link</h1>
            <p className="text-muted-foreground text-sm">
              This unsubscribe link is invalid or has expired.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
            <p className="text-muted-foreground text-sm">
              We couldn't process your request. Please try again later.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
