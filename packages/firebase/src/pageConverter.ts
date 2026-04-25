import type { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { pageSchema, type Page } from '@mcoe/schemas';

export const pageConverter: FirestoreDataConverter<Page> = {
  toFirestore(page) {
    const validated = pageSchema.parse(page);
    const { id: _id, ...data } = validated;
    return data;
  },
  fromFirestore(snap: QueryDocumentSnapshot) {
    return pageSchema.parse({ ...snap.data(), id: snap.id });
  },
};
