import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { createBase44VoiceAudio, normalizeTextForSpeech } from './base44Voice';

describe('narração sem integração paga', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => null) });
    vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Rede não permitida'); }));
  });
  afterEach(() => vi.unstubAllGlobals());
  it('delega texto novo à voz do dispositivo sem acessar a rede', async () => {
    expect(await createBase44VoiceAudio('Olá, aluno!')).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
  it('force não habilita geração paga', async () => {
    expect(await createBase44VoiceAudio('Aula completa', { force: true, useCache: false })).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
  it('respeita o silêncio e normaliza o texto', async () => {
    localStorage.getItem.mockReturnValue('off');
    expect(await createBase44VoiceAudio('Olá')).toBeNull();
    expect(normalizeTextForSpeech('Texto\n\n\n de aula')).toBe('Texto. de aula.');
  });
});