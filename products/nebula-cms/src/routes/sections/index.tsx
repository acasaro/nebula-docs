import { lazy, Suspense } from 'react';
import { Navigate, type RouteObject } from 'react-router';
import { LoadingScreen } from 'src/components/loading-screen';
import { RequireAuth, SignInPage } from 'src/auth';
import { AppLayout } from 'src/layouts/AppLayout';

const PageList = lazy(() =>
  import('src/pages/PageList').then((m) => ({ default: m.PageList }))
);
const PageEditor = lazy(() =>
  import('src/pages/PageEditor').then((m) => ({ default: m.PageEditor }))
);

const fallback = <LoadingScreen />;

export const routesSection: RouteObject[] = [
  {
    path: 'sign-in',
    element: <SignInPage />,
  },
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <Suspense fallback={fallback}><PageList /></Suspense>,
      },
      {
        path: 'page/:pageId',
        element: <Suspense fallback={fallback}><PageEditor /></Suspense>,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
];
