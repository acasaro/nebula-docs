import siteConfig from '@generated/docusaurus.config';
import type { FirebaseOptions } from 'firebase/app';
import { bootstrapAnalytics } from '@site/src/lib/analytics';

if (typeof window !== 'undefined') {
  const firebaseConfig = siteConfig.customFields!.firebaseConfig as FirebaseOptions;
  const environment = siteConfig.customFields!.environment as string;

  bootstrapAnalytics({ firebaseConfig, environment });
}
