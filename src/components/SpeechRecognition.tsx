import React, { useState, useEffect, useRef } from 'react';
import { Edit2, Trash2, Check, X, Database, Wifi, WifiOff } from 'lucide-react';
import type { SpeechResult } from '../types';
import { SpeechRecognitionService } from '../services/speechService';
import { initializeFirebase, saveToFirestore, updateInFirestore, deleteFromFirestore } from '../services/firebaseService';

const SpeechRecognition: React.FC = () => {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [results, setResults] = useState<SpeechResult[]>([]);
  const [error, setError] = useState<string>('');
  const [interimText, setInterimText] = useState<string>('');
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [initializingFirebase, setInitializingFirebase] = useState(true);
  
  const speechServiceRef = useRef<SpeechRecognitionService | null>(null);

  useEffect(() => {
    checkSupport();
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
      speechServiceRef.current = new SpeechRecognitionService();
      speechServiceRef.current.initSpeechRecognition(
        () => {
          setIsListening(true);
          setError('');
          setInterimText('');
        },
        (result) => {
          setResults(prev => [result, ...prev]);
          setInterimText('');
        },
        (errorMessage) => {
          setIsListening(false);
          setError(errorMessage);
        },
        () => {
          setIsListening(false);
        }
      );
    } else {
      setIsSupported(false);
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      speechServiceRef.current?.stopListening();
    } else {
      speechServiceRef.current?.startListening();
    }
  };

  const clearResults = () => {
    setResults([]);
    setError('');
  };

  const startEditing = (id: string) => {
    setResults(prev =>
      prev.map(result =>
        result.id === id ? { ...result, isEditing: true } : result
      )
    );
  };

  const cancelEditing = (id: string) => {
    setResults(prev =>
      prev.map(result =>
        result.id === id
          ? { ...result, isEditing: false, editedText: result.text }
          : result
      )
    );
  };

  const saveEdit = (id: string) => {
    setResults(prev =>
      prev.map(result =>
        result.id === id
          ? { ...result, isEditing: false, text: result.editedText || result.text }
          : result
      )
    );
  };

  const handleEditTextChange = (id: string, newText: string) => {
    setResults(prev =>
      prev.map(result =>
        result.id === id ? { ...result, editedText: newText } : result
      )
    );
  };

  const saveToDatabase = async (id: string) => {
    const result = results.find(r => r.id === id);
    if (!result) return;

    setSavingIds(prev => new Set(prev).add(id));
    try {
      const data = {
        text: result.text,
        confidence: result.confidence,
        timestamp: result.timestamp.toISOString(),
        alternatives: result.alternatives
      };

      const saveResult = await saveToFirestore(data);
      setResults(prev =>
        prev.map(r =>
          r.id === id
            ? { ...r, isSaved: true, firebaseId: saveResult.id }
            : r
        )
      );
    } catch (error) {
      console.error('Error saving to database:', error);
      setError('❌ ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setSavingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const deleteFromDatabase = async (id: string) => {
    const result = results.find(r => r.id === id);
    if (!result?.firebaseId) return;

    setSavingIds(prev => new Set(prev).add(id));
    try {
      await deleteFromFirestore(result.firebaseId);
      setResults(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting from database:', error);
      setError('❌ ไม่สามารถลบข้อมูลได้');
    } finally {
      setSavingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const getMicButtonClass = () => {
    if (!isSupported) return 'bg-gray-400 cursor-not-allowed';
    if (isListening) return 'bg-red-500 hover:bg-red-600';
    return 'bg-blue-500 hover:bg-blue-600';
  };

  const getMicText = () => {
    if (!isSupported) return 'ไม่รองรับการใช้งาน';
    if (isListening) return 'หยุดการฟัง';
    return 'เริ่มการฟัง';
  };

  const formatConfidence = (confidence: number | null) => {
    if (confidence === null) return 'N/A';
    return `${(confidence * 100).toFixed(1)}%`;
  };

  if (isSupported === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="bg-red-100 p-4 rounded-full mb-4">
          <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">ไม่รองรับการใช้งาน</h2>
        <p className="text-gray-600">ขออภัย เบราว์เซอร์ของคุณไม่รองรับการใช้งาน Speech Recognition</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center space-y-4">
        <button
          onClick={handleMicClick}
          className={`${getMicButtonClass()} text-white font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-50 shadow-lg`}
          disabled={!isSupported}
        >
          <div className="flex items-center space-x-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <span>{getMicText()}</span>
          </div>
        </button>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg w-full max-w-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {interimText && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg w-full max-w-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700 italic">{interimText}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {results.map(result => (
          <div
            key={result.id}
            className="bg-white rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-lg"
          >
            {result.isEditing ? (
              <div className="space-y-4">
                <textarea
                  value={result.editedText}
                  onChange={(e) => handleEditTextChange(result.id, e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  rows={3}
                />
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => saveEdit(result.id)}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Check size={18} />
                    <span>บันทึก</span>
                  </button>
                  <button
                    onClick={() => cancelEditing(result.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <X size={18} />
                    <span>ยกเลิก</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-lg text-gray-800 mb-3">{result.text}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      ความแม่นยำ: {formatConfidence(result.confidence)}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(result.timestamp).toLocaleString('th-TH')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => startEditing(result.id)}
                      className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
                      title="แก้ไข"
                    >
                      <Edit2 size={18} />
                    </button>
                    {firebaseReady && !result.isSaved && (
                      <button
                        onClick={() => saveToDatabase(result.id)}
                        disabled={savingIds.has(result.id)}
                        className="text-green-500 hover:text-green-700 transition-colors duration-200 disabled:opacity-50"
                        title="บันทึกลงฐานข้อมูล"
                      >
                        <Database size={18} />
                      </button>
                    )}
                    {result.isSaved && (
                      <button
                        onClick={() => deleteFromDatabase(result.id)}
                        disabled={savingIds.has(result.id)}
                        className="text-red-500 hover:text-red-700 transition-colors duration-200 disabled:opacity-50"
                        title="ลบออกจากฐานข้อมูล"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {results.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={clearResults}
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>ล้างผลลัพธ์ทั้งหมด</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SpeechRecognition; 