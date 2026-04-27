import { PageLoader } from "@/components/ui/PageLoader";
import { useCurrentUser } from "@nebula/firebase";
import { Navigate, Outlet, useLocation } from "react-router";

export function ProtectedRoute() {
  const auth = useCurrentUser();
  const location = useLocation();

  if (auth.status === "loading") {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <PageLoader />
      </div>
    );
  }

  if (auth.status === "unauthenticated") {
    return <Navigate to='/sign-in' replace state={{ from: location }} />;
  }

  return <Outlet />;
}
