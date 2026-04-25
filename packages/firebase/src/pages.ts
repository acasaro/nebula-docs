import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import type { Page, SpaceId } from '@mcoe/schemas';
import { getDb } from './init';
import { pageConverter } from './pageConverter';

function pagesCollection(spaceId: SpaceId) {
  return collection(getDb(), 'spaces', spaceId, 'pages').withConverter(pageConverter);
}

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
