/**
 * Subdomain detection for client-side routing.
 * Maps hostnames to application contexts.
 */

export type AppContext = 'main' | 'admin' | 'reseller' | 'developer';

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
  const hostname = window.location.hostname;

  if (hostname.startsWith('enki.')) return 'admin';
  if (hostname.startsWith('resellers.') || hostname.startsWith('reseller.')) return 'reseller';
  if (hostname.startsWith('developers.') || hostname.startsWith('developer.')) return 'developer';

  return 'main';
}

export function getSubdomainConfig(context: AppContext): SubdomainConfig {
  switch (context) {
    case 'admin':
      return {
        title: 'Enki Admin',
        subtitle: 'Everpay administrative portal',
        signupEnabled: false, // Admin accounts created internally
        autoRole: null as string | null,
        redirectAfterLogin: '/enki',
        brandColor: 'destructive' as const,
        authOrigin: 'https://enki.everpayinc.com',
      };
    case 'reseller':
      return {
        title: 'Everpay Resellers',
        subtitle: 'Reseller partner portal',
        signupEnabled: true,
        autoRole: 'reseller',
        redirectAfterLogin: '/reseller',
        brandColor: 'primary' as const,
        authOrigin: 'https://resellers.everpayinc.com',
      };
    case 'developer':
      return {
        title: 'Everpay Developers',
        subtitle: 'Developer platform',
        signupEnabled: true,
        autoRole: 'developer',
        redirectAfterLogin: '/developers',
        brandColor: 'primary' as const,
        authOrigin: 'https://developers.everpayinc.com',
      };
    default:
      return {
        title: 'Everpay',
        subtitle: 'Sign in to your merchant dashboard',
        signupEnabled: true,
        autoRole: null as string | null,
        redirectAfterLogin: '/dashboard',
        brandColor: 'primary' as const,
        authOrigin: 'https://everpayinc.com',
      };
  }
}
