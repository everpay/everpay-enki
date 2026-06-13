import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import everpayIcon from '@/assets/everpay-icon.png';
import { getAppContext, getSubdomainConfig } from '@/lib/subdomain';

export default function Auth() {
  const location = useLocation();
  const accessDenied = new URLSearchParams(location.search).get('error') === 'access_denied';
  const appContext = getAppContext();
  const config = getSubdomainConfig(appContext);
  const passwordResetRedirectTo = new URL('/reset-password', config.authOrigin).toString();

  const [isLogin, setIsLogin] = useState(
    location.pathname !== '/signup' || !config.signupEnabled
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (accessDenied) {
      setFormError('Access denied. Only administrators can sign in to Enki.');
    }
  }, [accessDenied]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');

    try {
      if (isLogin) {
        const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const { data: adminRoles, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', signInData.user.id)
          .in('role', ['admin', 'super_admin']);

        if (roleError) throw roleError;

        if (!adminRoles?.length) {
          await supabase.auth.signOut();
          setFormError('Access denied. Only administrators can sign in to Enki.');
          return;
        }

        toast.success('Signed in successfully');
        navigate(config.redirectAfterLogin);
      } else {
        const signupSource = config.autoRole || (
          window.location.hostname.startsWith('developers.') ? 'developers' : undefined
        );
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
              ...(signupSource ? { signup_source: signupSource } : {}),
            },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success('Account created! Check your email to confirm.');
      }
    } catch (error: any) {
      setFormError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Enter your email address first');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: passwordResetRedirectTo,
      });
      if (error) throw error;
      toast.success('Password reset link sent to your email');
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
        <div className="flex items-center justify-center gap-3 mb-10">
          <img src={everpayIcon} alt="everpay" className="h-11 w-11 rounded-2xl" />
          <span className="font-heading text-3xl font-bold text-foreground tracking-tight">{config.title}</span>
        </div>

        <div className="rounded-3xl border border-border bg-card p-8 md:p-10 shadow-card">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-[0.95] mb-2">
            {isLogin ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-base text-muted-foreground mb-8">
            {isLogin ? config.subtitle : `Sign up for ${config.title}`}
          </p>

          {formError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-2">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-9 bg-background border-border"
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="merchant@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 bg-background border-border"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
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

            <Button type="submit" className="btn-pill w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground" size="lg" disabled={loading}>
              {isLogin ? 'Sign In' : 'Create Account'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {config.signupEnabled && (
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  navigate(isLogin ? '/signup' : '/login', { replace: true });
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <span className="text-primary font-medium">{isLogin ? 'Sign up' : 'Sign in'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
