import { useCallback, useEffect, useRef, useState } from 'react';
import useOwlVoice from '@/hooks/useOwlVoice';
import { createBase44VoiceAudio, releaseBase44VoiceAudio } from '@/lib/base44Voice';

/**
 * Voz consistente da Luna, com narração nativa como reserva.
 * - Respeita o mute: se desligado, NÃO gera voz por IA.
 * - Usa cache: reaproveita áudio já gerado para o mesmo texto.
 */
export default function useLunaVoice() {
  const fallback = useOwlVoice();
  const audioRef = useRef(null);
  const requestRef = useRef(0);
  const timeoutRef = useRef(null);
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);

  const stop = useCallback(() => {
    requestRef.current += 1;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      releaseBase44VoiceAudio(audioRef.current);
      audioRef.current = null;
    }
    fallback.stop();
    setLoading(false);
    setSpeaking(false);
  }, [fallback.stop]);

  const speak = useCallback(async (text, { force = false } = {}) => {
    if (!text || (!force && !fallback.enabled)) return;

    requestRef.current += 1;
    const requestId = requestRef.current;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      releaseBase44VoiceAudio(audioRef.current);
      audioRef.current = null;
    }
    fallback.stop();
    setLoading(true);
    setSpeaking(true);

    let audio = null;
    let fallbackStarted = false;
    const startFallback = () => {
      if (fallbackStarted || requestId !== requestRef.current) return;
      fallbackStarted = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (audio) {
        audio.pause();
        releaseBase44VoiceAudio(audio);
        audio = null;
      }
      audioRef.current = null;
      setLoading(false);
      setSpeaking(false);
      fallback.speak(text, { force });
    };

    // Se a voz Base44 não começar em até cinco segundos, a voz nativa assume.
    timeoutRef.current = setTimeout(startFallback, 5000);

    try {
      audio = await createBase44VoiceAudio(text, { force });
      if (requestId !== requestRef.current || fallbackStarted) {
        if (audio) releaseBase44VoiceAudio(audio);
        return;
      }
      if (!audio) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        setLoading(false);
        setSpeaking(false);
        return;
      }

      audioRef.current = audio;
      audio.onended = () => {
        releaseBase44VoiceAudio(audio);
        if (requestId === requestRef.current) {
          audioRef.current = null;
          setSpeaking(false);
        }
      };
      audio.onerror = startFallback;
      await audio.play();
      if (!fallbackStarted && requestId === requestRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        setLoading(false);
      }
    } catch {
      startFallback();
    }
  }, [fallback.enabled, fallback.speak, fallback.stop]);

  const toggle = useCallback(() => {
    if (fallback.enabled) stop();
    fallback.toggle();
  }, [fallback.enabled, fallback.toggle, stop]);

  useEffect(() => () => {
    requestRef.current += 1;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      releaseBase44VoiceAudio(audioRef.current);
    }
  }, []);

  return {
    supported: typeof Audio !== 'undefined' || fallback.supported,
    enabled: fallback.enabled,
    speaking: speaking || fallback.speaking,
    loading,
    toggle,
    speak,
    stop,
  };
}