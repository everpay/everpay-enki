import { useUserRole } from "./useUserRole";

export function useAccessControl() {
  const { data, isLoading } = useUserRole();
  return {
    isLoading,
    roles: data?.roles ?? [],
    isAdmin: data?.isAdmin ?? false,
    isSuperAdmin: data?.isSuperAdmin ?? false,
    isReseller: data?.isReseller ?? false,
    hasRole: (role: string) => (data?.roles ?? []).includes(role as any),
    canManageProcessors: data?.isSuperAdmin ?? false,
    canViewReports: !!(data?.isAdmin || data?.isSuperAdmin),
  };
}