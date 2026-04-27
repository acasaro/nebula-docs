import { useCurrentUser } from "@nebula/firebase";
import { getFirstName, getGreeting } from "@/lib/dashboard";

export function DashboardHeader() {
  const auth = useCurrentUser();
  const firstName =
    auth.status === "authenticated"
      ? getFirstName(auth.user.displayName ?? auth.user.email)
      : "there";
  const greeting = getGreeting(new Date());

  return (
    <header>
      <h1 className='text-2xl font-semibold tracking-tight text-foreground'>
        {greeting}, {firstName}
      </h1>
    </header>
  );
}
