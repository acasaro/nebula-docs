import { Link } from 'react-router';
import { ArrowRight, FolderTree, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useGitSettings } from '@/lib/gitSettings';

export function Home() {
  const settings = useGitSettings();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Nebula</h1>
        <p className="text-muted-foreground">Edit MDX, commit through a PR.</p>
      </header>

      {settings.status === 'loading' ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : settings.status === 'missing' ? (
        <Card>
          <CardHeader>
            <CardTitle>No docs repo connected</CardTitle>
            <CardDescription>
              Install the GitHub app on a repo, then pick which one to edit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/settings/github-app">
                Get started
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="size-4 text-primary" />
              {settings.settings.owner}/{settings.settings.repo}
            </CardTitle>
            <CardDescription>
              Branch <code>{settings.settings.defaultBranch}</code>
              {settings.settings.docsSubdirectory ? (
                <>
                  {' · '}docs in{' '}
                  <code className="inline-flex items-center gap-1">
                    <FolderTree className="size-3" />
                    {settings.settings.docsSubdirectory}
                  </code>
                </>
              ) : null}
              {' · '}installation {settings.settings.installationId}
            </CardDescription>
            <CardAction>
              <Button variant="outline" size="sm" asChild>
                <Link to="/settings/git">Manage</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              File browser arrives in Phase 2.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
