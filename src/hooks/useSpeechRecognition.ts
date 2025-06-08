import { useState, useRef, useEffect } from 'react';
import type { SpeechResult } from '../types';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export const useSpeechRecognition = () => {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [results, setResults] = useState<SpeechResult[]>([]);
  const [error, setError] = useState<string>('');
  const [interimText, setInterimText] = useState<string>('');
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    checkSupport();
  }, []);

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
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;
        
        if (event.results[i].isFinal) {
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

  const clearResults = () => {
    setResults([]);
    setError('');
  };

  return {
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
  };
};