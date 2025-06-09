import React, { useState, useEffect } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { initializeFirebase, getFirebaseAPI } from '../services/firebaseService';
import MicrophoneButton from '../components/MicrophoneButton';
import StatusIndicators from '../components/StatusIndicators';
import ResultsList from '../components/ResultsList';
import ExamplePhrases from '../components/ExamplePhrases';

const SpeechRecognitionPage: React.FC = () => {
  const {
    isSupported,
    isListening,
    results,
    error,
    interimText,
    startListening,
    stopListening,
    clearResults,
    setResults,
    setError
  } = useSpeechRecognition();

  const { testSpeech } = useSpeechSynthesis();

  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [initializingFirebase, setInitializingFirebase] = useState(true);

  useEffect(() => {
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

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
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
            isSaved: false
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

  const saveToDatabase = async (id: string) => {
    if (!firebaseReady) {
      setError('❌ Firebase ไม่พร้อมใช้งาน');
      return;
    }

    const firebaseAPI = getFirebaseAPI();
    if (!firebaseAPI) return;

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
        await firebaseAPI.updateInFirestore(firebaseId, dataToSave);
        setError('✅ อัพเดทข้อมูลสำเร็จ!');
      } else {
        const response = await firebaseAPI.saveToFirestore(dataToSave);
        firebaseId = response.id;
        setError('✅ บันทึกข้อมูลใหม่สำเร็จ!');
      }

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

  // Add a return statement with JSX to render the component
  return (
    <div>
      <h1>Speech Recognition Page</h1>
      <StatusIndicators
        firebaseReady={firebaseReady}
        initializingFirebase={initializingFirebase}
        isSupported={isSupported}
      />
      <ExamplePhrases />
      <MicrophoneButton
        isListening={isListening}
        isSupported={isSupported}
        onMicClick={handleMicClick}
        interimText={interimText}
        onClick={handleMicClick}
        disabled={!isSupported}
      />
      <ResultsList
        results={results}
        savingIds={savingIds}
        firebaseReady={firebaseReady}
        onStartEditing={startEditing}
        onCancelEditing={cancelEditing}
        onSaveEdit={saveEdit}
        onEditTextChange={handleEditTextChange}
        onSaveToDatabase={saveToDatabase}
        onDeleteFromDatabase={() => {}} // Provide your delete handler if available
      />
      <button onClick={clearResults}>Clear Results</button>
    </div>
  );
};