import { useRef, useEffect, useState } from 'react';

export const useSpeechSynthesis = () => {
  const [isSupported, setIsSupported] = useState(false);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis;
      setIsSupported(true);
    }
  }, []);

  const speak = (text: string, lang: string = 'th-TH', rate: number = 0.9) => {
    if (synthesisRef.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      synthesisRef.current.speak(utterance);
    }
  };

  const testSpeech = () => {
    speak('สวัสดีครับ ระบบเสียงทำงานปกติ');
  };

  return {
    isSupported,
    speak,
    testSpeech
  };
};