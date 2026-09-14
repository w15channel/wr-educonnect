import { base44 } from '@/api/base44Client';

export async function createBase44VoiceAudio(text) {
  const response = await base44.integrations.Core.GenerateSpeech({
    text: String(text),
    voice: 'honey',
    language_code: 'pt',
  });
  const url = response?.url;
  if (!url) throw new Error('Áudio da Luna indisponível.');
  return new Audio(url);
}

export function releaseBase44VoiceAudio(audio) {
  if (!audio) return;
  audio.onended = null;
  audio.onerror = null;
  audio.removeAttribute('src');
  audio.load();
}
