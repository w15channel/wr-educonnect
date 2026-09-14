import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

function pcmToWavBase64(pcmBase64) {
  const binary = atob(pcmBase64);
  const pcm = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) pcm[index] = binary.charCodeAt(index);

  const wav = new Uint8Array(44 + pcm.length);
  const view = new DataView(wav.buffer);
  const writeText = (offset, value) => {
    for (let index = 0; index < value.length; index += 1) wav[offset + index] = value.charCodeAt(index);
  };

  writeText(0, 'RIFF');
  view.setUint32(4, 36 + pcm.length, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 24000, true);
  view.setUint32(28, 48000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, 'data');
  view.setUint32(40, pcm.length, true);
  wav.set(pcm, 44);

  let wavBinary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < wav.length; offset += chunkSize) {
    wavBinary += String.fromCharCode(...wav.subarray(offset, offset + chunkSize));
  }
  return btoa(wavBinary);
}

export default async function(req) {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Método não permitido.' }, { status: 405 });

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado.' }, { status: 401 });

    const payload = await req.json();
    const text = String(payload?.text || '').trim();
    if (!text) return Response.json({ error: 'O texto é obrigatório.' }, { status: 400 });

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': secrets.get('GEMINI_API_KEY'),
      },
      body: JSON.stringify({
        model: 'gemini-3.1-flash-tts-preview',
        input: text,
        response_format: { type: 'audio' },
        generation_config: { speech_config: [{ voice: 'Despina' }] },
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      return Response.json({ error: `A voz Despina está indisponível (${response.status}).`, details }, { status: response.status });
    }

    const result = await response.json();
    const audioBlock = result?.output_audio
      || result?.steps?.find((step) => step?.type === 'model_output')?.content?.find((item) => item?.type === 'audio');
    const pcmAudio = audioBlock?.data;
    if (!pcmAudio) return Response.json({ error: 'O Google não retornou áudio.' }, { status: 502 });

    return Response.json({ audio: pcmToWavBase64(pcmAudio) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Erro ao gerar a voz Despina.' }, { status: 500 });
  }
}