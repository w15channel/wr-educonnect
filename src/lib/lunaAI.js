const PUTER_MODELS = [
  'anthropic/claude-opus-5',
  'deepseek/deepseek-v4-pro',
  'openai/gpt-5.5',
];

const FALLBACK_TIMEOUT_MS = 45_000;

function withTimeout(promise, timeoutMs = FALLBACK_TIMEOUT_MS) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Tempo limite excedido.')), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function getPuterText(response) {
  if (typeof response === 'string') return response;
  if (typeof response?.message?.content === 'string') return response.message.content;
  if (Array.isArray(response?.message?.content)) {
    return response.message.content.map(part => part?.text || '').join('');
  }
  if (typeof response?.text === 'string') return response.text;
  return '';
}

function parseJsonResponse(value) {
  if (value && typeof value === 'object') return value;
  const text = String(value || '').trim();
  if (!text) throw new Error('A IA retornou uma resposta vazia.');

  const withoutFence = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(withoutFence);
  } catch {
    const start = withoutFence.indexOf('{');
    const end = withoutFence.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(withoutFence.slice(start, end + 1));
    throw new Error('A IA de contingência retornou um formato inválido.');
  }
}

function fallbackPrompt(prompt, responseJsonSchema) {
  return `${prompt}\n\nINSTRUÇÃO DE FORMATO: responda somente com JSON válido, sem markdown nem texto antes ou depois, obedecendo a este JSON Schema:\n${JSON.stringify(responseJsonSchema)}`;
}

/**
 * Usa o provedor original da Luna e, apenas se ele falhar, tenta a cadeia
 * independente do Puter. O fallback mantém a ordem Claude → DeepSeek → OpenAI.
 */
export async function invokeLunaAI({ prompt, responseJsonSchema, primary }) {
  try {
    const answer = await primary();
    if (answer?.answer) return { answer, provider: 'primary' };
    throw new Error('O servidor principal retornou uma resposta vazia.');
  } catch (primaryError) {
    const puter = globalThis.puter;
    if (!puter?.ai?.chat) {
      throw new AggregateError([primaryError], 'O servidor principal falhou e o Puter não está disponível.');
    }

    const errors = [primaryError];
    for (const model of PUTER_MODELS) {
      try {
        const response = await withTimeout(puter.ai.chat(
          fallbackPrompt(prompt, responseJsonSchema),
          { model },
        ));
        const answer = parseJsonResponse(getPuterText(response));
        if (!answer?.answer) throw new Error('Resposta sem o campo obrigatório "answer".');
        return { answer, provider: `puter:${model}` };
      } catch (error) {
        errors.push(error);
      }
    }

    throw new AggregateError(errors, 'Nenhum provedor da Luna respondeu.');
  }
}

export const LUNA_PUTER_MODELS = Object.freeze([...PUTER_MODELS]);
