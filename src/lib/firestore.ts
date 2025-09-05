import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  updateDoc,
  onSnapshot,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase';
import { auth } from './firebase';

export interface FirestoreDocument {
  id: string;
  [key: string]: any;
}

// Remove undefined values recursively so Firestore doesn't reject writes
function removeUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    // Preserve arrays (including empty arrays) but clean their items
    return value.map((item) => removeUndefined(item)) as unknown as T;
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const result: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue;
      const cleaned = removeUndefined(v as unknown as T);
      // Only skip assigning truly empty plain objects. Keep arrays even if empty.
      if (
        cleaned &&
        typeof cleaned === 'object' &&
        !(cleaned instanceof Date) &&
        !Array.isArray(cleaned) &&
        Object.keys(cleaned as Record<string, unknown>).length === 0
      ) {
        continue;
      }
      result[key] = cleaned as unknown as T;
    }
    return result as unknown as T;
  }
  return value;
}

export class FirestoreService<T extends FirestoreDocument> {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  private getUserId(): string {
    const user = auth.currentUser;
    if (!user) {
      console.error('FirestoreService: No authenticated user found');
      throw new Error('User must be authenticated');
    }
    console.log('FirestoreService: Current user ID:', user.uid);
    return user.uid;
  }

  private getCollection() {
    const userId = this.getUserId();
    return collection(db, `users/${userId}/${this.collectionName}`);
  }

  async create(data: Omit<T, 'id'>): Promise<T> {
    try {
      console.log('FirestoreService: Starting create with data:', data);
      const docRef = doc(this.getCollection());
      console.log('FirestoreService: Created doc reference:', docRef.path);
      const baseData = {
        ...data,
        id: docRef.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as T;
      const documentData = removeUndefined(baseData) as unknown as T;
    console.log('FirestoreService: Attempting to save document:', documentData);
    await setDoc(docRef, documentData);
    console.log('FirestoreService: Document saved successfully');
    return documentData as unknown as T;
    } catch (error) {
      console.error('FirestoreService: Error creating document:', error);
      throw error;
    }
  }

  // Upsert helper when you want to control the document ID
  async setWithId(id: string, data: T): Promise<void> {
    const docRef = doc(this.getCollection(), id);
    const toWrite = removeUndefined({ ...data, id }) as unknown as { [x: string]: any };
    await setDoc(docRef, toWrite);
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    const docRef = doc(this.getCollection(), id);
    const updateData = removeUndefined({
      ...data,
      updatedAt: new Date().toISOString(),
    }) as Partial<T> as unknown as { [x: string]: any };
    await updateDoc(docRef, updateData);
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(this.getCollection(), id);
    await deleteDoc(docRef);
  }

  async getById(id: string): Promise<T | null> {
    const docRef = doc(this.getCollection(), id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { ...docSnap.data(), id: docSnap.id } as T : null;
  }

  async getAll(): Promise<T[]> {
    // Unified source of truth: Firestore only; consumers should subscribe for live updates.
    const querySnapshot = await getDocs(this.getCollection());
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as T);
  }

  async query(constraints: QueryConstraint[]): Promise<T[]> {
    const q = query(this.getCollection(), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as T);
  }

  listenAll(onChange: (docs: T[]) => void, onError?: (error: unknown) => void): () => void {
    const col = this.getCollection();
    const unsubscribe = onSnapshot(col, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as T));
      onChange(docs);
    }, (error) => {
      if (onError) onError(error);
      else console.error('FirestoreService.listenAll error:', error);
    });
    return unsubscribe;
  }
}