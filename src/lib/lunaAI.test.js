import { afterEach, describe, expect, it, vi } from 'vitest';
import { invokeLunaAI, LUNA_PUTER_MODELS } from './lunaAI';

const schema = { type: 'object', properties: { answer: { type: 'string' } } };

afterEach(() => {
  delete globalThis.puter;
  vi.restoreAllMocks();
});

describe('invokeLunaAI', () => {
  it('não aciona o Puter quando o servidor original responde', async () => {
    const chat = vi.fn();
    globalThis.puter = { ai: { chat } };

    const result = await invokeLunaAI({
      prompt: 'Olá', responseJsonSchema: schema,
      primary: vi.fn().mockResolvedValue({ answer: 'Resposta principal' }),
    });

    expect(result).toEqual({ answer: { answer: 'Resposta principal' }, provider: 'primary' });
    expect(chat).not.toHaveBeenCalled();
  });

  it('tenta Claude, DeepSeek e OpenAI nessa ordem até obter resposta', async () => {
    const chat = vi.fn()
      .mockRejectedValueOnce(new Error('Claude indisponível'))
      .mockResolvedValueOnce({ message: { content: '```json\n{"answer":"Resposta reserva"}\n```' } });
    globalThis.puter = { ai: { chat } };

    const result = await invokeLunaAI({
      prompt: 'Olá', responseJsonSchema: schema,
      primary: vi.fn().mockRejectedValue(new Error('Sem créditos')),
    });

    expect(result.answer.answer).toBe('Resposta reserva');
    expect(result.provider).toBe(`puter:${LUNA_PUTER_MODELS[1]}`);
    expect(chat.mock.calls.map(call => call[1].model)).toEqual(LUNA_PUTER_MODELS.slice(0, 2));
  });

  it('propaga uma falha consolidada quando nenhuma alternativa está disponível', async () => {
    await expect(invokeLunaAI({
      prompt: 'Olá', responseJsonSchema: schema,
      primary: vi.fn().mockRejectedValue(new Error('Servidor fora do ar')),
    })).rejects.toThrow('Puter não está disponível');
  });
});
