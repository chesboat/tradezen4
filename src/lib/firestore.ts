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
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase';
import { auth } from './firebase';

export interface FirestoreDocument {
  id: string;
  [key: string]: any;
}

export class FirestoreService<T extends FirestoreDocument> {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  private getUserId(): string {
    const user = auth.currentUser;
    if (!user) throw new Error('User must be authenticated');
    return user.uid;
  }

  private getCollection() {
    const userId = this.getUserId();
    return collection(db, `users/${userId}/${this.collectionName}`);
  }

  async create(data: Omit<T, 'id'>): Promise<T> {
    const docRef = doc(this.getCollection());
    const documentData = {
      ...data,
      id: docRef.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, documentData);
    return documentData as T;
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    const docRef = doc(this.getCollection(), id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(this.getCollection(), id);
    await deleteDoc(docRef);
  }

  async getById(id: string): Promise<T | null> {
    const docRef = doc(this.getCollection(), id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as T : null;
  }

  async getAll(): Promise<T[]> {
    const querySnapshot = await getDocs(this.getCollection());
    return querySnapshot.docs.map(doc => doc.data() as T);
  }

  async query(constraints: QueryConstraint[]): Promise<T[]> {
    const q = query(this.getCollection(), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as T);
  }
}