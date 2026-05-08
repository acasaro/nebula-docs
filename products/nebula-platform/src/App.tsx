import { Toaster as SonnerToaster } from 'sonner';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { isFirebaseConfigured } from '@/lib/firebase';
import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useGitSettings } from '@/lib/gitSettings';
import { useTheme } from '@/lib/theme';
import { Assets } from '@/routes/Assets';
import { DevIconPicker } from '@/routes/DevIconPicker';
import { Home } from '@/routes/Home';
import { InstallCallback } from '@/routes/InstallCallback';
import { NotConfigured } from '@/routes/NotConfigured';
import { RepoBrowser } from '@/routes/RepoBrowser';
import { SettingsGithubApp } from '@/routes/SettingsGithubApp';
import { SettingsGitRepo } from '@/routes/SettingsGitRepo';
import { SignIn } from '@/routes/SignIn';

function LegacyRepoRedirect() {
  const settings = useGitSettings();
  if (settings.status === 'loading') return null;
  if (settings.status === 'missing') {
    return <Navigate to="/settings/git" replace />;
  }
  return <Navigate to={`/editor/${settings.settings.defaultBranch}`} replace />;
}

/**
 * Toast portal — bottom-right, non-invasive. Sonner's `theme` prop has to
 * match our app theme explicitly: it doesn't read our `documentElement.dark`
 * class on its own, so we wire it via `useTheme()`. No `closeButton` —
 * toasts are ephemeral by design and auto-dismiss on Sonner's default timer;
 * the X added visual noise without earning its keep.
 */
function AppToaster() {
  const { theme } = useTheme();
  return (
    <SonnerToaster
      position='bottom-right'
      theme={theme}
      richColors
    />
  );
}

export function App() {
  if (!isFirebaseConfigured()) {
    return <NotConfigured />;
  }

  return (
    <BrowserRouter>
      <AppToaster />
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<Home />} />
            {/* Both shapes render RepoBrowser. The no-path form lets
                RepoBrowser pick a landing page from docs.json's nav after
                docs.json + the repo tree have loaded — see the
                "Land on the first reachable page" effect there. */}
            <Route path="editor/:branch" element={<RepoBrowser />} />
            <Route path="editor/:branch/~/*" element={<RepoBrowser />} />
            <Route path="assets" element={<Assets />} />
            <Route path="settings/github-app" element={<SettingsGithubApp />} />
            <Route path="settings/git" element={<SettingsGitRepo />} />
            <Route path="install/callback" element={<InstallCallback />} />
            <Route path="dev/icons" element={<DevIconPicker />} />
            {/* Legacy redirects */}
            <Route
              path="settings/github"
              element={<Navigate to="/settings/github-app" replace />}
            />
            <Route path="repo/:owner/:repo" element={<LegacyRepoRedirect />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
