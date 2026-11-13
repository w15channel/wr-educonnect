import { afterEach, describe, expect, it, vi } from 'vitest';
import { base44 } from '@/api/base44Client';
import { invokeLunaAI } from './lunaAI';

vi.mock('@/api/base44Client', () => ({ base44: { functions: { invoke: vi.fn() } } }));

const schema = { type: 'object', properties: { answer: { type: 'string' } } };

afterEach(() => { vi.clearAllMocks(); });

describe('invokeLunaAI', () => {
  it('gera o diálogo pela IA da Grok através do servidor', async () => {
    base44.functions.invoke.mockResolvedValue({ data: { text: '```json\n{"answer":"Olá da Luna"}\n```' } });

    const result = await invokeLunaAI({ prompt: 'Olá', responseJsonSchema: schema });

    expect(result).toEqual({ answer: { answer: 'Olá da Luna' }, provider: 'grok' });
    expect(base44.functions.invoke).toHaveBeenCalledOnce();
    const [name, payload] = base44.functions.invoke.mock.calls[0];
    expect(name).toBe('generateText');
    expect(payload.prompt).toContain('Olá');
  });

  it('informa a indisponibilidade da Grok sem tentar outro provedor', async () => {
    base44.functions.invoke.mockRejectedValue({ response: { data: { error: 'A IA da Grok está indisponível (429).' } } });

    await expect(invokeLunaAI({ prompt: 'Olá', responseJsonSchema: schema }))
      .rejects.toThrow('A IA da Grok está indisponível (429)');
  });

  it('rejeita uma resposta sem o campo obrigatório', async () => {
    base44.functions.invoke.mockResolvedValue({ data: { text: '{"links":[]}' } });

    await expect(invokeLunaAI({ prompt: 'Olá', responseJsonSchema: schema }))
      .rejects.toThrow('Resposta sem o campo obrigatório');
  });
});