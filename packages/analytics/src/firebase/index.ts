import { initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import {
  getAnalytics,
  isSupported,
  logEvent,
  setUserId as fbSetUserId,
  setUserProperties as fbSetUserProperties,
  type Analytics,
} from "firebase/analytics";
import { setProvider } from "../core";
import type { AnalyticsProvider } from "../provider";

interface BootstrapOptions {
  firebaseConfig: FirebaseOptions;
  environment: string;
}

let app: FirebaseApp | null = null;

/**
 * Initialize Firebase Analytics and register it as the active provider.
 * Safe to call multiple times — subsequent calls are no-ops. Must be
 * called from a browser context.
 *
 * Events fired before `isSupported()` resolves are queued by the core and
 * flushed into Firebase once the provider registers — keeps `firePageView`
 * during the same tick reliable.
 */
export function bootstrapFirebase({ firebaseConfig, environment }: BootstrapOptions): void {
  if (typeof window === "undefined" || app) return;

  app = initializeApp(firebaseConfig);

  isSupported()
    .then((supported) => {
      if (!supported || !app) return;
      const analyticsInstance: Analytics = getAnalytics(app);
      fbSetUserProperties(analyticsInstance, { environment });

      const provider: AnalyticsProvider = {
        name: "firebase",
        send: (name, params) => logEvent(analyticsInstance, name, params),
        setUserId: (id) => fbSetUserId(analyticsInstance, id),
        setUserProperties: (props) => fbSetUserProperties(analyticsInstance, props),
      };
      setProvider(provider, { environment });
    })
    .catch((err) => {
      if (environment === "development") {
        console.warn("[analytics] firebase init failed", err);
      }
    });
}
