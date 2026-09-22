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
  const shouldListenRef = useRef(false);
  const restartTimerRef = useRef(null);
  const resultRef = useRef(onResult);
  resultRef.current = onResult;

  const stop = useCallback(() => {
    shouldListenRef.current = false;
    clearTimeout(restartTimerRef.current);
    restartTimerRef.current = null;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const start = useCallback(() => {
    if (!supported || recognitionRef.current) return;
    shouldListenRef.current = true;
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
    recognition.onend = () => {
      if (recognitionRef.current === recognition) recognitionRef.current = null;
      if (!shouldListenRef.current) {
        setListening(false);
        return;
      }

      // Chromium encerra sessões de reconhecimento mesmo com `continuous`
      // após alguns segundos de silêncio. Reinicie enquanto o usuário não
      // desligar explicitamente o microfone.
      restartTimerRef.current = setTimeout(() => {
        restartTimerRef.current = null;
        if (!shouldListenRef.current || recognitionRef.current) return;
        try {
          recognitionRef.current = recognition;
          recognition.start();
        } catch {
          recognitionRef.current = null;
          shouldListenRef.current = false;
          setListening(false);
        }
      }, 150);
    };
    recognition.onerror = (event) => {
      if (['not-allowed', 'service-not-allowed', 'audio-capture'].includes(event.error)) {
        shouldListenRef.current = false;
        setListening(false);
      }
    };
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [Recognition, supported]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  useEffect(() => () => {
    shouldListenRef.current = false;
    clearTimeout(restartTimerRef.current);
    recognitionRef.current?.abort();
  }, []);

  return { supported, listening, start, stop, toggle };
}
