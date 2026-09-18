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
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);

  const stop = useCallback(() => {
    requestRef.current += 1;
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
    if (audioRef.current) {
      audioRef.current.pause();
      releaseBase44VoiceAudio(audioRef.current);
      audioRef.current = null;
    }
    fallback.stop();
    setLoading(true);
    setSpeaking(true);

    try {
      // A voz Base44 é sempre a primeira tentativa; o navegador só assume em caso de falha.
      const audio = await createBase44VoiceAudio(text, { force });

      // O único caso sem áudio é quando o próprio usuário desligou a voz.
      if (!audio) {
        if (requestId === requestRef.current) {
          setLoading(false);
          setSpeaking(false);
        }
        return;
      }

      if (requestId !== requestRef.current) {
        releaseBase44VoiceAudio(audio);
        return;
      }
      setLoading(false);
      audioRef.current = audio;
      let usedFallback = false;
      const useFallback = () => {
        if (usedFallback || requestId !== requestRef.current) return;
        usedFallback = true;
        releaseBase44VoiceAudio(audio);
        audioRef.current = null;
        setSpeaking(false);
        fallback.speak(text, { force });
      };
      audio.onended = () => {
        releaseBase44VoiceAudio(audio);
        if (requestId === requestRef.current) {
          audioRef.current = null;
          setSpeaking(false);
        }
      };
      audio.onerror = useFallback;
      await audio.play();
    } catch {
      if (requestId === requestRef.current) {
        setLoading(false);
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