import React, { useState, useEffect, useRef } from 'react';
import { Edit2, Trash2, Check, X, Database, Wifi, WifiOff } from 'lucide-react';

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyA6jSiXetvK69mpza4Wix3rJSYjwpwkCsY",
  authDomain: "speech-recognition-app-428d5.firebaseapp.com",
  projectId: "speech-recognition-app-428d5",
  storageBucket: "speech-recognition-app-428d5.firebasestorage.app",
  messagingSenderId: "304047990028",
  appId: "1:304047990028:web:50673396794ed093c61529",
  measurementId: "G-9BDGD063PZ"
};

// Initialize Firebase (Dynamic Import)
let db: any = null;
let firebaseApp: any = null;
let firebaseAPI: any = null;

const initializeFirebase = async () => {
  try {
    // Import Firebase modules from npm package
    const { initializeApp } = await import('firebase/app');
    const { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } = await import('firebase/firestore');
    
    // Initialize Firebase
    firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp);
    
    // Real Firebase API
    interface FirestoreData {
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

    interface SaveResult {
      id: string;
    }

    interface FirebaseAPI {
      saveToFirestore: (data: FirestoreData) => Promise<SaveResult>;
      updateInFirestore: (id: string, data: FirestoreData) => Promise<boolean>;
      deleteFromFirestore: (id: string) => Promise<boolean>;
    }

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
    } as FirebaseAPI;
    
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    return false;
  }
};

interface SpeechResult {
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

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const App: React.FC = () => {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [results, setResults] = useState<SpeechResult[]>([]);
  const [error, setError] = useState<string>('');
  const [interimText, setInterimText] = useState<string>('');
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [initializingFirebase, setInitializingFirebase] = useState(true);
  
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    checkSupport();
    initSpeechSynthesis();
    setupFirebase();
  }, []);

  const setupFirebase = async () => {
    setInitializingFirebase(true);
    try {
      const success = await initializeFirebase();
      setFirebaseReady(success);
      if (success) {
        setError('🔥 Firebase เชื่อมต่อสำเร็จ!');
        setTimeout(() => setError(''), 3000);
      } else {
        setError('⚠️ Firebase ไม่สามารถเชื่อมต่อได้ - จะใช้งานแบบออฟไลน์');
      }
    } catch (error) {
      console.error('Firebase setup error:', error);
      setFirebaseReady(false);
      setError('⚠️ Firebase ไม่สามารถเชื่อมต่อได้ - จะใช้งานแบบออฟไลน์');
    } finally {
      setInitializingFirebase(false);
    }
  };

  const checkSupport = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      initSpeechRecognition();
    } else {
      setIsSupported(false);
    }
  };

  const initSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'th-TH';
    recognition.maxAlternatives = 3;
    
    recognition.onstart = () => {
      setIsListening(true);
      setError('');
      setInterimText('');
    };
    
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          
          const newResult: SpeechResult = {
            id: Math.random().toString(36).substr(2, 9),
            text: transcript,
            confidence: confidence,
            timestamp: new Date(),
            alternatives: Array.from(event.results[i]).map((alt: any) => ({
              text: alt.transcript,
              confidence: alt.confidence || null
            })),
            isEditing: false,
            editedText: transcript,
            isSaved: false
          };
          
          setResults(prev => [newResult, ...prev]);
          setInterimText('');
        } else {
          interimTranscript += transcript;
        }
      }
      
      if (interimTranscript) {
        setInterimText(interimTranscript);
      }
    };
    
    recognition.onerror = (event: any) => {
      setIsListening(false);
      
      let errorMessage = 'เกิดข้อผิดพลาด: ';
      switch(event.error) {
        case 'no-speech':
          errorMessage += 'ไม่ได้ยินเสียงพูด';
          break;
        case 'audio-capture':
          errorMessage += 'ไม่สามารถเข้าถึงไมโครโฟนได้';
          break;
        case 'not-allowed':
          errorMessage += 'ไม่ได้รับอนุญาตให้ใช้ไมโครโฟน';
          break;
        case 'network':
          errorMessage += 'เกิดปัญหาเครือข่าย';
          break;
        case 'language-not-supported':
          errorMessage += 'ไม่รองรับภาษาไทย';
          break;
        default:
          errorMessage += event.error;
      }
      
      setError(errorMessage);
    };
    
    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
    };
    
    recognitionRef.current = recognition;
  };

  const initSpeechSynthesis = () => {
    if ('speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis;
    }
  };

  const startListening = () => {
    if (!recognitionRef.current || isListening) return;
    
    try {
      setError('');
      recognitionRef.current.start();
    } catch (error: any) {
      setError('ไม่สามารถเริ่มการรับเสียงได้: ' + error.message);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const clearResults = () => {
    setResults([]);
    setError('');
  };

  const testSpeech = () => {
    if (synthesisRef.current) {
      const utterance = new SpeechSynthesisUtterance('สวัสดีครับ ระบบเสียงทำงานปกติ');
      utterance.lang = 'th-TH';
      utterance.rate = 0.9;
      synthesisRef.current.speak(utterance);
    } else {
      setError('เบราว์เซอร์ไม่รองรับการพูด');
    }
  };

  const startEditing = (id: string) => {
    setResults(prev => prev.map(result => 
      result.id === id 
        ? { ...result, isEditing: true, editedText: result.text }
        : result
    ));
  };

  const cancelEditing = (id: string) => {
    setResults(prev => prev.map(result => 
      result.id === id 
        ? { ...result, isEditing: false, editedText: result.text }
        : result
    ));
  };

  const saveEdit = (id: string) => {
    setResults(prev => prev.map(result => 
      result.id === id 
        ? { 
            ...result, 
            text: result.editedText || result.text,
            isEditing: false,
            timestamp: new Date(),
            isSaved: false // Reset save status when edited
          }
        : result
    ));
  };

  const handleEditTextChange = (id: string, newText: string) => {
    setResults(prev => prev.map(result => 
      result.id === id 
        ? { ...result, editedText: newText }
        : result
    ));
  };

  // Real Firebase save function
  const saveToDatabase = async (id: string) => {
    if (!firebaseReady || !firebaseAPI) {
      setError('❌ Firebase ไม่พร้อมใช้งาน');
      return;
    }

    const result = results.find(r => r.id === id);
    if (!result) return;

    setSavingIds(prev => new Set([...prev, id]));

    try {
      const dataToSave = {
        text: result.text,
        confidence: result.confidence,
        timestamp: result.timestamp.toISOString(),
        alternatives: result.alternatives
      };

      let firebaseId = result.firebaseId;

      if (result.isSaved && firebaseId) {
        // Update existing document
        await firebaseAPI.updateInFirestore(firebaseId, dataToSave);
        setError('✅ อัพเดทข้อมูลสำเร็จ!');
      } else {
        // Create new document
        const response = await firebaseAPI.saveToFirestore(dataToSave);
        firebaseId = response.id;
        setError('✅ บันทึกข้อมูลใหม่สำเร็จ!');
      }

      // Update local state
      setResults(prev => prev.map(r => 
        r.id === id ? { ...r, isSaved: true, firebaseId } : r
      ));

      setTimeout(() => setError(''), 3000);

    } catch (error) {
      console.error('Save error:', error);
      setError('❌ เกิดข้อผิดพลาดในการบันทึก: ' + (error as Error).message);
    } finally {
      setSavingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // Real Firebase delete function
  const deleteFromDatabase = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบข้อมูลนี้?')) return;

    const result = results.find(r => r.id === id);
    if (!result) return;

    setSavingIds(prev => new Set([...prev, id]));

    try {
      // Delete from Firebase if it was saved
      if (firebaseReady && firebaseAPI && result.isSaved && result.firebaseId) {
        await firebaseAPI.deleteFromFirestore(result.firebaseId);
      }
      
      // Remove from local state
      setResults(prev => prev.filter(r => r.id !== id));
      
      setError('✅ ลบข้อมูลสำเร็จ!');
      setTimeout(() => setError(''), 3000);

    } catch (error) {
      console.error('Delete error:', error);
      setError('❌ เกิดข้อผิดพลาดในการลบ: ' + (error as Error).message);
    } finally {
      setSavingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const getMicButtonClass = () => {
    if (isListening) {
      return 'w-30 h-30 rounded-full border-none cursor-pointer text-4xl transition-all duration-300 shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white animate-pulse';
    } else if (isSupported) {
      return 'w-30 h-30 rounded-full border-none cursor-pointer text-4xl transition-all duration-300 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white hover:scale-110';
    } else {
      return 'w-30 h-30 rounded-full border-none cursor-not-allowed text-4xl transition-all duration-300 shadow-lg bg-gray-400 text-gray-600';
    }
  };

  const getMicText = () => {
    if (isListening) {
      return interimText ? (
        <div className="text-center">
          <div>🎤 กำลังฟัง... กดเพื่อหยุด</div>
          <div className="text-sm text-gray-600 mt-1">{interimText}</div>
        </div>
      ) : '🎤 กำลังฟัง... กดเพื่อหยุด';
    } else if (isSupported === null) {
      return 'กำลังโหลด...';
    } else if (isSupported) {
      return 'กดเพื่อเริ่มพูด';
    } else {
      return 'ไม่รองรับ';
    }
  };

  const formatConfidence = (confidence: number | null) => {
    return confidence ? `${(confidence * 100).toFixed(1)}%` : 'ไม่ระบุ';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-700 flex items-center justify-center p-5">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-4xl w-full">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-8">
           ระบบรายรับด้วยเสียง🎤
        </h1>
        
        {/* Firebase Status */}
        <div className={`text-center mb-5 p-4 rounded-xl font-bold ${
          initializingFirebase
            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
            : firebaseReady 
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-orange-100 text-orange-800 border border-orange-200'
        }`}>
          <div className="flex items-center justify-center gap-2">
            {initializingFirebase ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full"></div>
                🔥 กำลังเชื่อมต่อ Firebase...
              </>
            ) : firebaseReady ? (
              <>
                <Wifi size={20} />
                🔥 Firebase พร้อมใช้งาน
              </>
            ) : (
              <>
                <WifiOff size={20} />
                ⚠️ ใช้งานแบบออฟไลน์
              </>
            )}
          </div>
        </div>
        
        {/* Speech Recognition Status */}
        <div className={`text-center mb-5 p-4 rounded-xl font-bold ${
          isSupported === null 
            ? 'bg-gray-100 text-gray-700'
            : isSupported 
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {isSupported === null && '🔍 กำลังตรวจสอบการรองรับ...'}
          {isSupported === true && '✅ เบราว์เซอร์รองรับ Speech Recognition'}
          {isSupported === false && (
            <>
              ❌ เบราว์เซอร์ไม่รองรับ Speech Recognition
              <br />
              <small>กรุณาใช้ Google Chrome</small>
            </>
          )}
        </div>
        
        {/* Microphone */}
        <div className="text-center my-10">
          <button
            onClick={handleMicClick}
            className={getMicButtonClass()}
            disabled={!isSupported}
          >
            🎤
          </button>
          <div className="mt-4 text-lg font-bold text-gray-600">
            {getMicText()}
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex gap-3 justify-center mb-5">
          <button
            onClick={clearResults}
            className="px-5 py-3 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 transition-colors"
          >
            🗑️ ล้างผลลัพธ์
          </button>
          <button
            onClick={testSpeech}
            className="px-5 py-3 bg-cyan-600 text-white rounded-lg font-bold hover:bg-cyan-700 transition-colors"
          >
            🔊 ทดสอบเสียง
          </button>
          <button
            onClick={setupFirebase}
            className="px-5 py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition-colors"
            disabled={initializingFirebase}
          >
            🔥 เชื่อมต่อ Firebase ใหม่
          </button>
        </div>
        
        {/* Error/Success Messages */}
        {error && (
          <div className={`border rounded-xl p-4 mb-5 ${
            error.includes('✅') 
              ? 'bg-green-100 text-green-800 border-green-200'
              : error.includes('⚠️')
              ? 'bg-orange-100 text-orange-800 border-orange-200'
              : error.includes('🔥')
              ? 'bg-blue-100 text-blue-800 border-blue-200'
              : 'bg-red-100 text-red-800 border-red-200'
          }`}>
            {error}
          </div>
        )}
        
        {/* Results */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">📝 ผลลัพธ์การทดสอบ:</h3>
          <div className="space-y-4">
            {results.length === 0 ? (
              <p className="text-center text-gray-500 py-5">ยังไม่มีผลลัพธ์</p>
            ) : (
              results.map((result, index) => (
                <div key={result.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-xs text-gray-500">
                      #{results.length - index} - {result.timestamp.toLocaleString('th-TH')}
                      {result.isSaved && (
                        <span className="ml-2 text-green-600">
                          💾 บันทึกแล้ว
                          {result.firebaseId && (
                            <span className="ml-1 text-xs bg-green-100 px-1 rounded">
                              ID: {result.firebaseId.slice(0, 8)}...
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {!result.isEditing && (
                        <>
                          <button
                            onClick={() => startEditing(result.id)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="แก้ไข"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => saveToDatabase(result.id)}
                            disabled={savingIds.has(result.id) || !firebaseReady}
                            className={`p-1 rounded transition-colors ${
                              firebaseReady 
                                ? 'text-green-600 hover:bg-green-100' 
                                : 'text-gray-400 cursor-not-allowed'
                            } disabled:opacity-50`}
                            title={firebaseReady ? (result.isSaved ? 'อัพเดท' : 'บันทึก') : 'Firebase ไม่พร้อม'}
                          >
                            {savingIds.has(result.id) ? (
                              <div className="animate-spin w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
                            ) : (
                              <Database size={16} />
                            )}
                          </button>
                          <button
                            onClick={() => deleteFromDatabase(result.id)}
                            disabled={savingIds.has(result.id)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                            title="ลบ"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                      
                      {result.isEditing && (
                        <>
                          <button
                            onClick={() => saveEdit(result.id)}
                            className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                            title="บันทึกการแก้ไข"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => cancelEditing(result.id)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="ยกเลิกการแก้ไข"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Text Display/Edit */}
                  {result.isEditing ? (
                    <textarea
                      value={result.editedText || ''}
                      onChange={(e) => handleEditTextChange(result.id, e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="แก้ไขข้อความที่นี่..."
                    />
                  ) : (
                    <div className="text-base text-gray-800 font-medium mb-1">
                      "{result.text}"
                    </div>
                  )}
                  
                  <div className="text-xs text-green-600 mb-2">
                    ความแม่นยำ: {formatConfidence(result.confidence)}
                  </div>
                  
                  {result.alternatives && result.alternatives.length > 1 && !result.isEditing && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs text-gray-600">
                        ตัวเลือกอื่นๆ
                      </summary>
                      <div className="mt-2 text-xs space-y-1">
                        {result.alternatives.slice(1).map((alt, i) => (
                          <div 
                            key={i}
                            className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                            onClick={() => handleEditTextChange(result.id, alt.text)}
                            title="คลิกเพื่อใช้ข้อความนี้"
                          >
                            • "{alt.text}" ({formatConfidence(alt.confidence)})
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        
       
        
        {/* Examples */}
        <div className="bg-amber-50 rounded-xl p-5 mb-8">
          <h3 className="text-amber-800 text-lg font-semibold mb-4">
            💡 ประโยคตัวอย่างสำหรับทดสอบ:
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              '🛒 "ขายน้ำ 20 บาท"',
              '🛒 "ซื้อข้าว 50 บาท"',
              '💰 "รายได้ 100 บาท"',
              '💸 "จ่ายค่าไฟ 200 บาท"',
              '🍜 "ขายก๋วยเตี๋ยว 35 บาท"',
              '🧴 "ซื้อน้ำยาล้างจาน 25 บาท"',
              '📱 "ค่าโทรศัพท์ 299 บาท"',
              '⛽ "ค่าน้ำมัน 500 บาท"'
            ].map((example, index) => (
              <li
                key={index}
                className="bg-white p-3 rounded-lg border-l-4 border-amber-500 text-sm"
              >
                {example}
              </li>
            ))}
          </ul>
        </div>
        {/* <div className="flex-column justify-center mb-5">
          <button
            onClick={}
            className="px-5 py-3 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 transition-colors mb-3"
          >
            💰 ดูรายรับวันนี้
          </button>
          <button
            onClick={}
            className="px-5 py-3 bg-cyan-600 text-white rounded-lg font-bold hover:bg-cyan-700 transition-colors mb-3"
          >
            💰 เลือกวันที่ต้องการดูรายรับ
          </button>
        </div>*/}
        
      </div>
    </div>
  );
};

export default App;