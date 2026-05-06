import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { signInWithEmail, useCurrentUser } from '@nebula-docs/firebase';
import { FirebaseError } from 'firebase/app';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NebulaLogomark } from '@/components/NebulaLogomark';

interface LocationState {
  from?: { pathname?: string };
}

export function SignIn() {
  const auth = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = (location.state as LocationState | null)?.from?.pathname ?? '/';

  if (auth.status === 'authenticated') {
    return <Navigate to={redirectTo} replace />;
  }

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInWithEmail(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-col items-center gap-3 text-center">
          <NebulaLogomark className="size-12" />
          <CardTitle className="text-2xl">Sign in to Nebula Docs</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

function formatAuthError(err: unknown): string {
  if (err instanceof FirebaseError) {
    if (err.code === 'auth/invalid-credential') return 'Email or password incorrect.';
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Sign-in failed.';
}
