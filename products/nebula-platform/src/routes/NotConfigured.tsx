import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function NotConfigured() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Nebula isn't configured</CardTitle>
          <CardDescription>
            Set Firebase web SDK env vars in the root <code>.env</code> to run the app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Required:{' '}
            <code>
              FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID,
              FIREBASE_APP_ID
            </code>
            .
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
