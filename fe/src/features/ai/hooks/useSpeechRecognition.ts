import { useState, useEffect, useCallback } from 'react';

interface SpeechRecognitionResult {
  isListening: boolean;
  transcript: string;
  browserSupportsSpeech: boolean;
  startListening: () => void;
  stopListening: () => void;
}

export const useSpeechRecognition = (): SpeechRecognitionResult => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [browserSupportsSpeech, setBrowserSupportsSpeech] = useState(false);

  // Check if browser supports speech recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setBrowserSupportsSpeech(!!SpeechRecognition);
  }, []);

  // Initialize speech recognition
  const recognition = useCallback(() => {
    if (!browserSupportsSpeech) return null;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();

    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'vi-VN'; // Vietnamese language

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognitionInstance.onresult = (event: any) => {
      const current = event.resultIndex;
      const result = event.results[current];
      const transcriptValue = result[0].transcript;
      setTranscript(transcriptValue);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognitionInstance.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
    };

    return recognitionInstance;
  }, [browserSupportsSpeech]);

  const startListening = useCallback(() => {
    const recognitionInstance = recognition();
    if (!recognitionInstance) return;

    setTranscript('');
    setIsListening(true);
    recognitionInstance.start();
  }, [recognition]);

  const stopListening = useCallback(() => {
    const recognitionInstance = recognition();
    if (!recognitionInstance) return;

    recognitionInstance.stop();
    setIsListening(false);
  }, [recognition]);

  return {
    isListening,
    transcript,
    browserSupportsSpeech,
    startListening,
    stopListening,
  };
};

// Add TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
