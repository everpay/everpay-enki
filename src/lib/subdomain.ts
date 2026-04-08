/**
 * Subdomain detection for client-side routing.
 * Admin-only portal — all contexts redirect to /enki.
 */

export type AppContext = 'admin';

export interface SubdomainConfig {
  title: string;
  subtitle: string;
  signupEnabled: boolean;
  autoRole: string | null;
  redirectAfterLogin: string;
  brandColor: 'primary' | 'destructive';
  authOrigin: string;
}

export function getAppContext(): AppContext {
  return 'admin';
}

export function getSubdomainConfig(_context: AppContext): SubdomainConfig {
  return {
    title: 'Enki Admin',
    subtitle: 'Everpay administrative portal',
    signupEnabled: false,
    autoRole: null,
    redirectAfterLogin: '/enki',
    brandColor: 'destructive',
    authOrigin: 'https://enki.everpayinc.com',
  };
}
