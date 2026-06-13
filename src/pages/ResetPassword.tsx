import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import everpayIcon from '@/assets/everpay-icon.png';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event from the URL hash token
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setSessionReady(true);
        setSessionError('');
      } else if (event === 'SIGNED_IN' && session) {
        // Also accept SIGNED_IN as recovery sometimes triggers this
        setSessionReady(true);
        setSessionError('');
      }
    });

    // Also check if there's already a session (user may have already been authenticated)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
    });

    // Timeout after 5 seconds if no session is established
    const timeout = setTimeout(() => {
      setSessionReady((ready) => {
        if (!ready) {
          setSessionError('Password reset link has expired or is invalid. Please request a new one.');
        }
        return ready;
      });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password updated successfully');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="gradient-glow pointer-events-none fixed inset-0" />
      <div className="relative w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <img src={everpayIcon} alt="everpay" className="h-10 w-10 rounded-xl" />
          <span className="font-heading text-2xl font-bold text-foreground tracking-tight">everpay</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-heading text-xl font-bold text-foreground mb-1">Reset Password</h2>
          <p className="text-sm text-muted-foreground mb-6">Enter your new password</p>

          {sessionError ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
                {sessionError}
              </div>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </Button>
            </div>
          ) : !sessionReady ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Verifying reset link…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 bg-background border-border"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Update Password
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
