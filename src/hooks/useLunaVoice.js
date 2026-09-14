import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import useOwlVoice from '@/hooks/useOwlVoice';

/** Voz consistente da Luna, com narração nativa como reserva. */
export default function useLunaVoice() {
  const fallback = useOwlVoice();
  const audioRef = useRef(null);
  const requestRef = useRef(0);
  const [speaking, setSpeaking] = useState(false);

  const stop = useCallback(() => {
    requestRef.current += 1;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
      audioRef.current = null;
    }
    fallback.stop();
    setSpeaking(false);
  }, [fallback.stop]);

  const speak = useCallback(async (text, { force = false } = {}) => {
    if (!text || (!force && !fallback.enabled)) return;

    requestRef.current += 1;
    const requestId = requestRef.current;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    fallback.stop();
    setSpeaking(true);

    try {
      const result = await base44.integrations.Core.GenerateSpeech({
        text: String(text),
        voice: 'honey',
        language_code: 'pt',
      });
      if (requestId !== requestRef.current) return;
      if (!result?.url) throw new Error('Áudio da Luna indisponível');

      const audio = new Audio(result.url);
      audioRef.current = audio;
      let usedFallback = false;
      const useFallback = () => {
        if (usedFallback || requestId !== requestRef.current) return;
        usedFallback = true;
        audioRef.current = null;
        setSpeaking(false);
        fallback.speak(text, { force });
      };
      audio.onended = () => {
        if (requestId === requestRef.current) {
          audioRef.current = null;
          setSpeaking(false);
        }
      };
      audio.onerror = useFallback;
      await audio.play();
    } catch {
      if (requestId === requestRef.current) {
        audioRef.current = null;
        setSpeaking(false);
        fallback.speak(text, { force });
      }
    }
  }, [fallback.enabled, fallback.speak, fallback.stop]);

  const toggle = useCallback(() => {
    if (fallback.enabled) stop();
    fallback.toggle();
  }, [fallback.enabled, fallback.toggle, stop]);

  useEffect(() => () => {
    requestRef.current += 1;
    audioRef.current?.pause();
  }, []);

  return {
    supported: typeof Audio !== 'undefined' || fallback.supported,
    enabled: fallback.enabled,
    speaking: speaking || fallback.speaking,
    toggle,
    speak,
    stop,
  };
}