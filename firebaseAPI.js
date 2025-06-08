import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase.js';

const firebaseAPI = {
  saveToFirestore: async (data) => {
    const docRef = await addDoc(collection(db, 'speech-results'), data);
    return { id: docRef.id };
  },
  
  updateInFirestore: async (id, data) => {
    const docRef = doc(db, 'speech-results', id);
    await updateDoc(docRef, data);
    return true;
  },
  
  deleteFromFirestore: async (id) => {
    const docRef = doc(db, 'speech-results', id);
    await deleteDoc(docRef);
    return true;
  }
};