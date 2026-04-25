import { initializeFirebase } from '@mcoe/firebase';
import { CONFIG } from './global-config';

initializeFirebase(CONFIG.firebase);
