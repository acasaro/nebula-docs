#!/usr/bin/env node
/**
 * Seed a single test page into Firestore for verifying the CMS render pipeline.
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT=/path/to/service-account.json \
 *     node scripts/seed-test-page.mjs
 *
 * Where to get the service account:
 *   Firebase Console -> Project Settings -> Service accounts -> Generate new private key
 *   Save the JSON somewhere outside the repo (do NOT commit).
 *
 * After running, the docs dev server should serve:
 *   /developers/test-cms-page
 */

import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const SA_PATH = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!SA_PATH) {
  console.error('FIREBASE_SERVICE_ACCOUNT env var must point to a service account JSON');
  process.exit(1);
}

const sa = JSON.parse(readFileSync(SA_PATH, 'utf8'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const pageId = randomUUID();
const calloutChildId = randomUUID();

const blocks = [
  {
    id: randomUUID(),
    type: 'heading',
    props: { level: 1, text: 'Welcome to the CMS' },
  },
  {
    id: randomUUID(),
    type: 'text',
    props: {
      markdown:
        'This page is rendered at runtime from Firestore. Inline marks: **bold**, *italic*, `inline code`, and a [link](https://example.com).',
    },
  },
  {
    id: randomUUID(),
    type: 'callout',
    props: { variant: 'tip', title: 'Pro tip' },
    children: [
      {
        id: calloutChildId,
        type: 'text',
        props: {
          markdown: 'Callouts can contain **other blocks** — including more callouts.',
        },
      },
    ],
  },
];

const page = {
  id: pageId,
  spaceId: 'developers',
  slug: 'test-cms-page',
  title: 'Test CMS Page',
  status: 'published',
  parentId: null,
  sidebarOrder: 0,
  blocks: [],
  publishedBlocks: blocks,
  lockedBy: null,
  updatedAt: Date.now(),
  updatedBy: 'seed-script',
  version: 1,
};

await db.collection('spaces').doc('developers').collection('pages').doc(pageId).set(page);

console.log(`✓ Seeded page id=${pageId} at /developers/${page.slug}`);
console.log(`  visit: http://localhost:3000/developers/${page.slug}`);
process.exit(0);
