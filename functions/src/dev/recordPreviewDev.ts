import { defineSecret } from 'firebase-functions/params';
import { makeRecordPreviewHandler } from '../recordPreviewHandler';

const DEV_RECORD_PREVIEW_SECRET = defineSecret('DEV_RECORD_PREVIEW_SECRET');

export const recordPreviewDev = makeRecordPreviewHandler({
  secret: DEV_RECORD_PREVIEW_SECRET,
  databaseId: 'nebula-docs-plat-dev',
});
