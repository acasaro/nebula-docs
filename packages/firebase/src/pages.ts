import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import type { Block, Page, SpaceId } from '@mcoe/schemas';
import { getAuthInstance } from './init';
import { getDb } from './init';
import { pageConverter } from './pageConverter';

function pagesCollection(spaceId: SpaceId) {
  return collection(getDb(), 'spaces', spaceId, 'pages').withConverter(pageConverter);
}

function pageDoc(spaceId: SpaceId, pageId: string) {
  return doc(getDb(), 'spaces', spaceId, 'pages', pageId).withConverter(pageConverter);
}

function currentUid(): string {
  const user = getAuthInstance().currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.uid;
}

/* ── reads ─────────────────────────────────────────────────────────── */

export async function getPageBySlug(
  spaceId: SpaceId,
  slug: string
): Promise<Page | null> {
  const q = query(
    pagesCollection(spaceId),
    where('slug', '==', slug),
    where('status', '==', 'published'),
    limit(1)
  );
  const snap = await getDocs(q);
  return snap.empty ? null : snap.docs[0]!.data();
}

export function subscribeToPageBySlug(
  spaceId: SpaceId,
  slug: string,
  onChange: (page: Page | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    pagesCollection(spaceId),
    where('slug', '==', slug),
    where('status', '==', 'published'),
    limit(1)
  );
  return onSnapshot(
    q,
    (snap) => onChange(snap.empty ? null : snap.docs[0]!.data()),
    onError
  );
}

export type PageQueryState =
  | { status: 'loading' }
  | { status: 'success'; page: Page | null }
  | { status: 'error'; error: Error };

export function useSubscribeToPageBySlug(
  spaceId: SpaceId,
  slug: string
): PageQueryState {
  const [state, setState] = useState<PageQueryState>({ status: 'loading' });

  useEffect(() => {
    setState({ status: 'loading' });
    const unsubscribe = subscribeToPageBySlug(
      spaceId,
      slug,
      (page) => setState({ status: 'success', page }),
      (error) => setState({ status: 'error', error })
    );
    return unsubscribe;
  }, [spaceId, slug]);

  return state;
}

export async function getPageById(
  spaceId: SpaceId,
  pageId: string
): Promise<Page | null> {
  const snap = await getDoc(pageDoc(spaceId, pageId));
  return snap.exists() ? snap.data() : null;
}

export function useSubscribeToPageById(spaceId: SpaceId, pageId: string): PageQueryState {
  const [state, setState] = useState<PageQueryState>({ status: 'loading' });

  useEffect(() => {
    setState({ status: 'loading' });
    const unsubscribe = onSnapshot(
      pageDoc(spaceId, pageId),
      (snap) => setState({ status: 'success', page: snap.exists() ? snap.data() : null }),
      (error) => setState({ status: 'error', error })
    );
    return unsubscribe;
  }, [spaceId, pageId]);

  return state;
}

export type PagesListState =
  | { status: 'loading' }
  | { status: 'success'; pages: Page[] }
  | { status: 'error'; error: Error };

export function useSubscribeToPagesInSpace(spaceId: SpaceId): PagesListState {
  const [state, setState] = useState<PagesListState>({ status: 'loading' });

  useEffect(() => {
    setState({ status: 'loading' });
    const q = query(pagesCollection(spaceId), orderBy('sidebarOrder'));
    const unsubscribe = onSnapshot(
      q,
      (snap) => setState({ status: 'success', pages: snap.docs.map((d) => d.data()) }),
      (error) => setState({ status: 'error', error })
    );
    return unsubscribe;
  }, [spaceId]);

  return state;
}

/* ── writes (require auth) ─────────────────────────────────────────── */

export interface CreatePageInput {
  spaceId: SpaceId;
  slug: string;
  title: string;
  parentId?: string | null;
  sidebarOrder?: number;
}

export async function createPage(input: CreatePageInput): Promise<Page> {
  const uid = currentUid();
  const id = crypto.randomUUID();
  const page: Page = {
    id,
    spaceId: input.spaceId,
    slug: input.slug,
    title: input.title,
    status: 'draft',
    parentId: input.parentId ?? null,
    sidebarOrder: input.sidebarOrder ?? 0,
    blocks: [],
    publishedBlocks: [],
    lockedBy: null,
    updatedAt: Date.now(),
    updatedBy: uid,
    version: 0,
  };
  await setDoc(pageDoc(input.spaceId, id), page);
  return page;
}

export interface SavePageDraftInput {
  spaceId: SpaceId;
  pageId: string;
  title: string;
  blocks: Block[];
}

export async function savePageDraft(input: SavePageDraftInput): Promise<void> {
  const uid = currentUid();
  await updateDoc(pageDoc(input.spaceId, input.pageId), {
    title: input.title,
    blocks: input.blocks,
    updatedAt: Date.now(),
    updatedBy: uid,
  });
}

export async function publishPage(spaceId: SpaceId, pageId: string): Promise<void> {
  const uid = currentUid();
  const page = await getPageById(spaceId, pageId);
  if (!page) throw new Error(`Page not found: ${pageId}`);
  await updateDoc(pageDoc(spaceId, pageId), {
    publishedBlocks: page.blocks,
    status: 'published',
    updatedAt: Date.now(),
    updatedBy: uid,
    version: page.version + 1,
  });
}

export async function deletePage(spaceId: SpaceId, pageId: string): Promise<void> {
  // Soft-delete via status change keeps audit history; hard delete via deleteDoc
  // would lose context. Stick with hard delete for MVP — revisit when audit lands.
  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(pageDoc(spaceId, pageId));
}
