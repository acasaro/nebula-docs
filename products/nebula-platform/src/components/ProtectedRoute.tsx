import { PageLoader } from "@/components/ui/PageLoader";
import { useCurrentUser } from "@nebula-docs/firebase";
import { Navigate, Outlet, useLocation } from "react-router";

export function ProtectedRoute() {
  const auth = useCurrentUser();
  const location = useLocation();

  if (auth.status === "loading") {
    return (
      <div className='-m-8 flex h-[calc(100vh-1rem)] items-center justify-center'>
        <PageLoader size={120} ringStyle='crisp' label='Loading workspace...' />
      </div>
    );
  }

  if (auth.status === "unauthenticated") {
    return <Navigate to='/sign-in' replace state={{ from: location }} />;
  }

  return <Outlet />;
}
