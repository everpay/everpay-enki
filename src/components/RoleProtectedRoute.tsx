import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Array<'admin' | 'reseller' | 'user' | 'merchant' | 'agent' | 'investor' | 'developer'>;
}

export function RoleProtectedRoute({ children, allowedRoles }: RoleProtectedRouteProps) {
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const [isRejectingUser, setIsRejectingUser] = useState(false);

  const hasAccess =
    !!userRole &&
    (userRole.isSuperAdmin ||
      allowedRoles.some(role => {
        if (role === 'admin') return userRole.isAdmin || userRole.isSuperAdmin;
        if (role === 'reseller') return userRole.isReseller;
        if (role === 'user') return userRole.isUser;
        if (role === 'merchant') return userRole.isMerchant;
        if (role === 'agent') return userRole.isAgent;
        if (role === 'developer') return userRole.isDeveloper;
        if (role === 'investor') return userRole.roles?.includes('investor');
        return false;
      }));

  useEffect(() => {
    let active = true;

    if (!authLoading && !roleLoading && user && userRole && !hasAccess) {
      setIsRejectingUser(true);
      signOut()
        .catch(() => undefined)
        .finally(() => {
          if (active) {
            setIsRejectingUser(false);
          }
        });
    }

    return () => {
      active = false;
    };
  }, [authLoading, roleLoading, user, userRole, hasAccess, signOut]);

  if (authLoading || roleLoading || isRejectingUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!userRole || !hasAccess) return <Navigate to="/login?error=access_denied" replace />;

  return <>{children}</>;
}