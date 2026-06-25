const ELEVENLABS_TTS_URL = 'https://api.elevenlabs.io/v1/text-to-speech/WR-THERAPHY';
const MODEL_ID = 'eleven_multilingual_v2';

function getTextFromPayload(payload: unknown) {
  if (typeof payload === 'string') return payload;
  if (!payload || typeof payload !== 'object') return '';

  const data = payload as Record<string, unknown>;
  const nestedData = data.data && typeof data.data === 'object'
    ? data.data as Record<string, unknown>
    : null;

  return String(data.text || data.input || nestedData?.text || nestedData?.input || '');
}

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonError('Método não permitido. Envie uma requisição POST com o texto para narrar.', 405);
  }

  const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
  if (!apiKey) {
    return jsonError('Secret ELEVENLABS_API_KEY não configurado.', 500);
  }

  const payload = await req.json().catch(() => ({}));
  const text = getTextFromPayload(payload).trim();

  if (!text) {
    return jsonError('O campo text é obrigatório para gerar o áudio da apostila.', 400);
  }

  try {
    const elevenLabsResponse = await fetch(ELEVENLABS_TTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
      }),
    });

    if (!elevenLabsResponse.ok) {
      const details = await elevenLabsResponse.text().catch(() => '');
      return jsonError(
        `Falha ao gerar áudio na ElevenLabs (${elevenLabsResponse.status}).${details ? ` ${details}` : ''}`,
        elevenLabsResponse.status,
      );
    }

    const audio = await elevenLabsResponse.arrayBuffer();
    return new Response(audio, {
      status: 200,
      headers: {
        'Content-Type': elevenLabsResponse.headers.get('content-type') || 'audio/mpeg',
        'Content-Disposition': 'inline; filename="apostila-reader.mp3"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return jsonError(`Erro ao conectar com a ElevenLabs: ${message}`, 500);
  }
});
