export interface SpeechResult {
  id: string;
  text: string;
  confidence: number | null;
  timestamp: Date;
  alternatives: Array<{
    text: string;
    confidence: number | null;
  }>;
  isEditing?: boolean;
  editedText?: string;
  isSaved?: boolean;
  firebaseId?: string;
}

export interface FirestoreData {
  text: string;
  confidence: number | null;
  timestamp: string;
  alternatives: Array<{
    text: string;
    confidence: number | null;
  }>;
  createdAt?: any;
  updatedAt?: any;
}

export interface SaveResult {
  id: string;
}

export interface FirebaseAPI {
  saveToFirestore: (data: FirestoreData) => Promise<SaveResult>;
  updateInFirestore: (id: string, data: FirestoreData) => Promise<boolean>;
  deleteFromFirestore: (id: string) => Promise<boolean>;
}