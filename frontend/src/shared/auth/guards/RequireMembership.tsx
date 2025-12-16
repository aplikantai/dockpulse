import { Navigate } from 'react-router-dom';
import { useAuth } from '../useAuth';
import { ReactNode } from 'react';

interface RequireMembershipProps {
  children: ReactNode;
  roles?: string[];
}

export function RequireMembership({ children, roles }: RequireMembershipProps) {
  const { membership, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!membership) {
    return <Navigate to="/no-access" replace />;
  }

  if (roles && !roles.includes(membership.role)) {
    return <Navigate to="/no-access" replace />;
  }

  return <>{children}</>;
}

export default RequireMembership;
