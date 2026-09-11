import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Ditado por voz (fala → texto) usando o reconhecimento de voz do navegador.
 * Entrega o texto reconhecido em pt-BR para ser colado no campo de escrita.
 */
export default function useVoiceDictation({ onResult }) {
  const Recognition = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;
  const supported = Boolean(Recognition);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const resultRef = useRef(onResult);
  resultRef.current = onResult;

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    if (!supported || recognitionRef.current) return;
    const recognition = new Recognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) text += event.results[i][0].transcript;
      }
      if (text.trim()) resultRef.current?.(text.trim());
    };
    recognition.onend = () => { recognitionRef.current = null; setListening(false); };
    recognition.onerror = () => { recognitionRef.current = null; setListening(false); };
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [Recognition, supported]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  return { supported, listening, start, stop, toggle };
}