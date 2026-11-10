import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { GEMINI_READER_VOICE, normalizeSpeechText, requestBase44VoiceUrl } from './base44Voice';

describe('Voz Gemini Eclipse para leitura', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => vi.unstubAllGlobals());

  it('configura a voz padrão como Eclipse do Gemini', () => {
    expect(GEMINI_READER_VOICE).toBe('Eclipse');
  });

  it('normaliza o texto removendo HTML e espaços excessivos', () => {
    expect(normalizeSpeechText('<p>Texto de <strong>aula</strong></p>')).toBe('Texto de aula');
  });

  it('chama /api/tts com a voz Eclipse', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ audioBase64: 'UklGRg==', mimeType: 'audio/wav' }),
    });

    const url = await requestBase44VoiceUrl('Olá, aluno!');
    expect(url).toContain('data:audio/wav;base64,UklGRg==');
    expect(fetch).toHaveBeenCalledWith('/api/tts', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ text: 'Olá, aluno!', voice: 'Eclipse' }),
    }));
  });
});