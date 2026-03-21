import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useDeviceAnalytics } from '@/hooks/useDeviceAnalytics';
import { posthog } from '@/lib/posthog';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { trackDevice } = useDeviceAnalytics();
  const trackedRef = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setLoading(false);
      // Track device on sign in
      if (event === 'SIGNED_IN' && session && !trackedRef.current) {
        trackedRef.current = true;
        trackDevice('login', { event: 'auth_sign_in' });
        // Identify user in PostHog
        posthog.identify(session.user.id, {
          email: session.user.email,
          created_at: session.user.created_at,
        });
      }
      if (event === 'SIGNED_OUT') {
        trackedRef.current = false;
        posthog.reset();
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
