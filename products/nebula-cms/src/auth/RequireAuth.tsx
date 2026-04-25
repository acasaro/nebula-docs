import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useCurrentUser } from '@mcoe/firebase';
import { LoadingScreen } from 'src/components/loading-screen';

export interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const auth = useCurrentUser();
  const location = useLocation();

  if (auth.status === 'loading') return <LoadingScreen />;
  if (auth.status === 'unauthenticated') {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
