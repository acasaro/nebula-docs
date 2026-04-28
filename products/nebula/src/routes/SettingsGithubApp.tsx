import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/PageLoader";
import { env } from "@/lib/env";
import { removeInstallation, useInstallations } from "@/lib/installations";
import { ExternalLink, Plus, Settings as SettingsIcon, Trash2 } from "lucide-react";

const installUrl = env.appInstallUrl;

export function SettingsGithubApp() {
  const installs = useInstallations();

  return (
    <div className='mx-auto flex max-w-3xl flex-col gap-6'>
      <header className='flex items-start justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>GitHub app</h1>
          <p className='text-sm text-muted-foreground'>
            Where Nebula is installed. Each installation grants access to its repos.
          </p>
        </div>
        {installUrl ? (
          <Button asChild>
            <a href={installUrl} target='_blank' rel='noreferrer'>
              <Plus />
              Add installation
              <ExternalLink />
            </a>
          </Button>
        ) : null}
      </header>

      {!installUrl ? (
        <Card>
          <CardHeader>
            <CardTitle>App not yet registered</CardTitle>
            <CardDescription>
              Set <code>NEBULA_APP_INSTALL_URL_DEV</code> /{" "}
              <code>NEBULA_APP_INSTALL_URL_PROD</code> in <code>products/nebula/.env</code> after
              creating the GitHub App, and select the active env via <code>NEBULA_ENV</code>.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>App installations</CardTitle>
          <CardDescription>
            {installs.status === "ready" && installs.installations.length === 0
              ? 'Nothing installed yet — click "Add installation" to install the GitHub App on an account or organization.'
              : "These are the accounts where Nebula has been granted access."}
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-2'>
          {installs.status === "loading" ? (
            <div className='flex justify-center py-6'>
              <PageLoader />
            </div>
          ) : installs.installations.length === 0 ? null : (
            installs.installations.map((it) => (
              <div
                key={it.installationId}
                className='flex items-center justify-between rounded-md border bg-card px-3 py-2'>
                <div className='flex items-center gap-3'>
                  <SettingsIcon className='size-4 text-muted-foreground' />
                  <div className='flex flex-col'>
                    <span className='text-sm font-medium'>{it.account.login}</span>
                    <span className='text-xs text-muted-foreground'>
                      {it.account.type} · ID {it.installationId}
                    </span>
                  </div>
                  <Badge variant={it.repositorySelection === "all" ? "default" : "secondary"}>
                    {it.repositorySelection === "all" ? "All repos" : "Selected repos"}
                  </Badge>
                </div>
                <div className='flex items-center gap-2'>
                  <Button asChild variant='ghost' size='icon-sm'>
                    <a
                      href={`https://github.com/settings/installations/${it.installationId}`}
                      target='_blank'
                      rel='noreferrer'
                      title='Manage on GitHub'>
                      <ExternalLink />
                    </a>
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    title='Remove from Nebula'
                    onClick={() => {
                      if (
                        confirm(
                          `Remove ${it.account.login} from Nebula? This does not uninstall the app on GitHub.`,
                        )
                      ) {
                        void removeInstallation(it.installationId);
                      }
                    }}>
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
