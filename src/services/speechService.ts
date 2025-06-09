import type { SpeechResult } from '../types';

export class SpeechRecognitionService {
  private recognition: any;
  private synthesis: SpeechSynthesis | null = null;

  constructor() {
    this.initSpeechSynthesis();
  }

  public initSpeechRecognition(
    onStart: () => void,
    onResult: (result: SpeechResult) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'th-TH';
    this.recognition.maxAlternatives = 3;
    
    this.recognition.onstart = onStart;
    
    this.recognition.onresult = (event: any) => {
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
          
          onResult(newResult);
        } else {
          interimTranscript += transcript;
        }
      }
    };
    
    this.recognition.onerror = (event: any) => {
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
      onError(errorMessage);
    };
    
    this.recognition.onend = onEnd;
  }

  private initSpeechSynthesis() {
    this.synthesis = window.speechSynthesis;
  }

  public startListening() {
    if (this.recognition) {
      this.recognition.start();
    }
  }

  public stopListening() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  public testSpeech(text: string) {
    if (this.synthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'th-TH';
      this.synthesis.speak(utterance);
    }
  }
} 