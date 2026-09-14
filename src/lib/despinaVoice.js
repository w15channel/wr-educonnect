import { base44 } from '@/api/base44Client';

export async function createDespinaAudio(text) {
  const response = await base44.functions.invoke('generateDespinaVoice', { text: String(text) });
  const base64 = response?.data?.audio;
  if (!base64) throw new Error('Áudio da voz Despina indisponível.');

  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
  const audio = new Audio(url);
  audio.despinaUrl = url;
  return audio;
}

export function releaseDespinaAudio(audio) {
  if (!audio?.despinaUrl) return;
  audio.onended = null;
  audio.onerror = null;
  URL.revokeObjectURL(audio.despinaUrl);
  audio.despinaUrl = null;
  audio.removeAttribute('src');
  audio.load();
}