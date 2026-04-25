import siteConfig from '@generated/docusaurus.config';
import type { FirebaseOptions } from 'firebase/app';
import { initializeFirebase } from '@mcoe/firebase';

if (typeof window !== 'undefined') {
  const firebaseConfig = siteConfig.customFields!.firebaseConfig as FirebaseOptions;
  initializeFirebase(firebaseConfig);
}
