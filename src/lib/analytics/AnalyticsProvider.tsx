import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from '@docusaurus/router';
import { firePageView, installAutoTracker } from './autoTracker';

/**
 * Installs the document-level auto-tracker and fires `page_view` on each
 * route change. Renders children unchanged.
 */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const installed = useRef(false);

  useEffect(() => {
    if (installed.current) return;
    installed.current = true;
    const cleanup = installAutoTracker();
    return cleanup;
  }, []);

  useEffect(() => {
    firePageView(pathname, typeof document !== 'undefined' ? document.title : undefined);
  }, [pathname]);

  return <>{children}</>;
}
