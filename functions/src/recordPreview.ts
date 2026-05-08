import { defineSecret } from 'firebase-functions/params';
import { makeRecordPreviewHandler } from './recordPreviewHandler';

const RECORD_PREVIEW_SECRET = defineSecret('RECORD_PREVIEW_SECRET');

export const recordPreview = makeRecordPreviewHandler({
  secret: RECORD_PREVIEW_SECRET,
});
