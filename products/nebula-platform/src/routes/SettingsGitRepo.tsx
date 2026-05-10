import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageLoader } from "@/components/ui/PageLoader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { listBranches, listInstallationRepos, type InstallationRepo } from "@/lib/githubApi";
import { saveGitSettings, useGitSettings, type GitSettings } from "@/lib/gitSettings";
import { useInstallations, type InstallationDoc } from "@/lib/installations";
import { useCurrentUser } from "@nebula-docs/firebase";
import { ArrowRight, CheckCircle2, Github, Settings as SettingsIcon } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router";

const successBadgeClasses =
  "bg-emerald-500/15 text-emerald-700 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-500/20";

interface GitRepoFormProps {
  installations: InstallationDoc[];
  initial: GitSettings | null;
}

function GitRepoForm({ installations, initial }: GitRepoFormProps) {
  const auth = useCurrentUser();

  const [installationId, setInstallationId] = useState<number>(
    initial?.installationId ?? installations[0]!.installationId,
  );
  const [selectedRepo, setSelectedRepo] = useState<string>(
    initial ? `${initial.owner}/${initial.repo}` : "",
  );
  const [selectedBranch, setSelectedBranch] = useState<string>(initial?.defaultBranch ?? "");
  const [subdirEnabled, setSubdirEnabled] = useState<boolean>(!!initial?.docsSubdirectory);
  const [subdir, setSubdir] = useState<string>(initial?.docsSubdirectory ?? "");

  const [repos, setRepos] = useState<InstallationRepo[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposError, setReposError] = useState<string | null>(null);

  const [branches, setBranches] = useState<string[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const selectedRepoMeta = useMemo(
    () => repos.find((r) => r.fullName === selectedRepo),
    [repos, selectedRepo],
  );

  useEffect(() => {
    let cancelled = false;
    setReposLoading(true);
    setReposError(null);
    listInstallationRepos(installationId)
      .then((rs) => {
        if (cancelled) return;
        setRepos(rs);
      })
      .catch((err) => {
        if (cancelled) return;
        setReposError(err instanceof Error ? err.message : "Failed to list repos.");
      })
      .finally(() => {
        if (!cancelled) setReposLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [installationId]);

  useEffect(() => {
    if (!selectedRepoMeta) {
      setBranches([]);
      return;
    }
    let cancelled = false;
    setBranchesLoading(true);
    listBranches(installationId, selectedRepoMeta.owner, selectedRepoMeta.name)
      .then((bs) => {
        if (cancelled) return;
        setBranches(bs);
        setSelectedBranch((prev) =>
          prev && bs.includes(prev) ? prev : selectedRepoMeta.defaultBranch,
        );
      })
      .catch(() => {
        if (cancelled) return;
        setBranches([]);
      })
      .finally(() => {
        if (!cancelled) setBranchesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedRepoMeta, installationId]);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSavedAt(null);
    setSaving(true);
    try {
      if (auth.status !== "authenticated") throw new Error("Sign in required.");
      if (!selectedRepoMeta) throw new Error("Pick a repository.");
      if (!selectedBranch) throw new Error("Pick a branch.");

      await saveGitSettings(
        {
          installationId,
          owner: selectedRepoMeta.owner,
          repo: selectedRepoMeta.name,
          defaultBranch: selectedBranch,
          docsSubdirectory: subdirEnabled && subdir.trim() ? subdir.trim() : null,
        },
        auth.user.uid,
      );
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Github className='size-4' />
          GitHub
          <Badge className={successBadgeClasses}>
            <CheckCircle2 className='size-3' />
            Active
          </Badge>
        </CardTitle>
        <CardDescription>
          Configure GitHub to create deployments for any commits pushed to your repository.
        </CardDescription>
      </CardHeader>
      <Separator />
      <CardContent>
        <form onSubmit={handleSave} className='flex flex-col gap-5'>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='installation'>GitHub organization</Label>
              <Select
                value={String(installationId)}
                onValueChange={(v) => {
                  const next = Number(v);
                  if (next === installationId) return;
                  setInstallationId(next);
                  setSelectedRepo("");
                  setSelectedBranch("");
                }}>
                <SelectTrigger id='installation' className='w-full'>
                  <SelectValue placeholder='Select organization' />
                </SelectTrigger>
                <SelectContent>
                  {installations.map((it) => (
                    <SelectItem key={it.installationId} value={String(it.installationId)}>
                      {it.account.login}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='repo'>Repository</Label>
              <Select
                value={selectedRepo}
                onValueChange={(v) => {
                  if (v === selectedRepo) return;
                  setSelectedRepo(v);
                  setSelectedBranch("");
                }}
                disabled={reposLoading || repos.length === 0}>
                <SelectTrigger id='repo' className='w-full'>
                  <SelectValue
                    placeholder={
                      reposLoading
                        ? "Loading…"
                        : repos.length === 0
                          ? "No repos accessible"
                          : "Select repository"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {repos.map((r) => (
                    <SelectItem key={r.fullName} value={r.fullName}>
                      {r.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {reposError ? <p className='text-xs text-destructive'>{reposError}</p> : null}
            </div>
          </div>

          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='branch'>Branch</Label>
            <Select
              value={selectedBranch}
              onValueChange={(v) => setSelectedBranch(v)}
              disabled={branchesLoading || branches.length === 0}>
              <SelectTrigger id='branch' className='w-full'>
                <SelectValue placeholder={branchesLoading ? "Loading…" : "Select branch"} />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='flex flex-col gap-3'>
            <div className='flex items-center justify-between gap-3'>
              <div className='flex flex-col gap-0.5'>
                <Label htmlFor='subdir-toggle' className='cursor-pointer'>
                  Docs are in a subdirectory
                </Label>
                <p className='text-xs text-muted-foreground'>
                  Required for monorepos like this one (<code>products/docs/docs</code>).
                </p>
              </div>
              <Switch
                id='subdir-toggle'
                checked={subdirEnabled}
                onCheckedChange={(v) => {
                  setSubdirEnabled(v);
                  if (!v) setSubdir("");
                }}
              />
            </div>
            {subdirEnabled ? (
              <Input
                placeholder='products/docs/docs'
                value={subdir}
                onChange={(e) => setSubdir(e.target.value)}
              />
            ) : null}
          </div>

          {error ? <p className='text-sm text-destructive'>{error}</p> : null}
          {savedAt ? <p className='text-sm text-muted-foreground'>Saved.</p> : null}

          <div className='flex justify-end pt-2'>
            <Button type='submit' disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

interface GithubAppCardProps {
  installations: InstallationDoc[];
}

function GithubAppCard({ installations }: GithubAppCardProps) {
  const installed = installations.length > 0;
  const accountList = installations.map((i) => i.account.login).join(", ");

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Github className='size-4' />
          Configure GitHub App
          {installed ? (
            <Badge className={successBadgeClasses}>
              <CheckCircle2 className='size-3' />
              Installed
            </Badge>
          ) : (
            <Badge variant='secondary'>Not installed</Badge>
          )}
          <span className='ml-auto'>
            <Button asChild variant='ghost' size='icon-sm' title='Manage installations'>
              <Link to='/settings/github-app'>
                <SettingsIcon />
              </Link>
            </Button>
          </span>
        </CardTitle>
        <CardDescription>
          {installed
            ? `GitHub app installed to ${accountList}. Ready to sync documentation.`
            : "Install the GitHub app on a repo to enable Nebula to read and commit MDX."}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

export function SettingsGitRepo() {
  const installs = useInstallations();
  const settings = useGitSettings();

  if (installs.status === "loading" || settings.status === "loading") {
    return (
      <div className='-m-8 flex h-[calc(100vh-1rem)] items-center justify-center'>
        <PageLoader size={120} ringStyle='crisp' label='Loading workspace...' />
      </div>
    );
  }

  return (
    <div className='mx-auto flex max-w-3xl flex-col gap-10'>
      <header>
        <h1 className='text-2xl font-semibold tracking-tight'>Git settings</h1>
        <p className='text-sm text-muted-foreground'>
          Pick the docs repo Nebula edits and the branch it commits to.
        </p>
      </header>

      <section className='flex flex-col gap-4'>
        <header>
          <h2 className='text-base font-semibold tracking-tight'>Repo settings</h2>
          <p className='text-sm text-muted-foreground'>Connect your docs repo</p>
        </header>
        {installs.installations.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Install the GitHub app first</CardTitle>
              <CardDescription>
                You need at least one GitHub app installation before picking a repo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to='/settings/github-app'>
                  Go to GitHub app
                  <ArrowRight />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <GitRepoForm
            installations={installs.installations}
            initial={settings.status === "ready" ? settings.settings : null}
          />
        )}
      </section>

      <section className='flex flex-col gap-4'>
        <header>
          <h2 className='text-base font-semibold tracking-tight'>GitHub app</h2>
          <p className='text-sm text-muted-foreground'>
            Install the GitHub app to enable automatic updates.
          </p>
        </header>
        <GithubAppCard installations={installs.installations} />
      </section>
    </div>
  );
}
