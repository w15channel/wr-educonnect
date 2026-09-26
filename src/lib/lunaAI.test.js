import { afterEach, describe, expect, it, vi } from 'vitest';
import { invokeLunaAI, LUNA_POLLINATIONS_MODEL } from './lunaAI';

const schema = { type: 'object', properties: { answer: { type: 'string' } } };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('invokeLunaAI', () => {
  it('gera o diálogo pela API do Pollinations sem consumir a integração Base44', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '```json\n{"answer":"Olá da Luna"}\n```' } }] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await invokeLunaAI({ prompt: 'Olá', responseJsonSchema: schema });

    expect(result).toEqual({
      answer: { answer: 'Olá da Luna' },
      provider: `pollinations:${LUNA_POLLINATIONS_MODEL}`,
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://text.pollinations.ai/openai');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toMatchObject({
      model: LUNA_POLLINATIONS_MODEL,
      stream: false,
      messages: [{ role: 'user' }],
    });
  });

  it('informa a indisponibilidade do Pollinations sem tentar outro provedor', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }));

    await expect(invokeLunaAI({ prompt: 'Olá', responseJsonSchema: schema }))
      .rejects.toThrow('Pollinations indisponível (429)');
  });

  it('rejeita uma resposta sem o campo obrigatório', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"links":[]}' } }] }),
    }));

    await expect(invokeLunaAI({ prompt: 'Olá', responseJsonSchema: schema }))
      .rejects.toThrow('Resposta sem o campo obrigatório');
  });
});
