import { firebaseConfig } from '../config/firebase';
import type { SaveResult } from '../types/index';
import type { FirebaseAPI } from '../types/index';
import type { FirestoreData } from '../types/index';

let db: any = null;
let firebaseApp: any = null;
let firebaseAPI: FirebaseAPI | null = null;

export const initializeFirebase = async (): Promise<boolean> => {
  try {
    const { initializeApp } = await import('firebase/app');
    const { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } = await import('firebase/firestore');
    
    firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp);
    
    firebaseAPI = {
      saveToFirestore: async (data: FirestoreData): Promise<SaveResult> => {
        try {
          const docData = {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          const docRef = await addDoc(collection(db, 'speech-results'), docData);
          console.log('✅ Document written with ID: ', docRef.id);
          return { id: docRef.id };
        } catch (error) {
          console.error('❌ Error adding document: ', error);
          throw error;
        }
      },
      
      updateInFirestore: async (id: string, data: FirestoreData): Promise<boolean> => {
        try {
          const docRef = doc(db, 'speech-results', id);
          const updateData = {
            ...data,
            updatedAt: serverTimestamp()
          };
          await updateDoc(docRef, updateData);
          console.log('✅ Document updated successfully');
          return true;
        } catch (error) {
          console.error('❌ Error updating document: ', error);
          throw error;
        }
      },
      
      deleteFromFirestore: async (id: string): Promise<boolean> => {
        try {
          const docRef = doc(db, 'speech-results', id);
          await deleteDoc(docRef);
          console.log('✅ Document deleted successfully');
          return true;
        } catch (error) {
          console.error('❌ Error deleting document: ', error);
          throw error;
        }
      }
    };
    
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    return false;
  }
};

export const getFirebaseAPI = (): FirebaseAPI | null => {
  return firebaseAPI;
};