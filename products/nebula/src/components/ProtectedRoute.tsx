import { Navigate, Outlet, useLocation } from 'react-router';
import { useCurrentUser } from '@nebula/firebase';
import { PageLoader } from '@/components/ui/PageLoader';

export function ProtectedRoute() {
  const auth = useCurrentUser();
  const location = useLocation();

  if (auth.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PageLoader size={64} />
      </div>
    );
  }

  if (auth.status === 'unauthenticated') {
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
