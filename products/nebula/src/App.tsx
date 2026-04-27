import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { isFirebaseConfigured } from '@/lib/firebase';
import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DevIconPicker } from '@/routes/DevIconPicker';
import { Home } from '@/routes/Home';
import { InstallCallback } from '@/routes/InstallCallback';
import { NotConfigured } from '@/routes/NotConfigured';
import { RepoBrowser } from '@/routes/RepoBrowser';
import { SettingsGithubApp } from '@/routes/SettingsGithubApp';
import { SettingsGitRepo } from '@/routes/SettingsGitRepo';
import { SignIn } from '@/routes/SignIn';

export function App() {
  if (!isFirebaseConfigured()) {
    return <NotConfigured />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<Home />} />
            <Route path="repo/:owner/:repo" element={<RepoBrowser />} />
            <Route path="settings/github-app" element={<SettingsGithubApp />} />
            <Route path="settings/git" element={<SettingsGitRepo />} />
            <Route path="install/callback" element={<InstallCallback />} />
            <Route path="dev/icons" element={<DevIconPicker />} />
            {/* Legacy redirects */}
            <Route
              path="settings/github"
              element={<Navigate to="/settings/github-app" replace />}
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
