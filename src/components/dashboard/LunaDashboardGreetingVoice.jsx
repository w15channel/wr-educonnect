import React, { useEffect, useRef } from 'react';
import useLunaVoice from '@/hooks/useLunaVoice';

export default function LunaDashboardGreetingVoice({ text }) {
  const { speak } = useLunaVoice();
  const spokenRef = useRef(false);

  useEffect(() => {
    if (!text || spokenRef.current) return;
    spokenRef.current = true;
    speak(text, { force: true });
  }, [speak, text]);

  return null;
}