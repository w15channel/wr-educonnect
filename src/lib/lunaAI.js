const POLLINATIONS_ENDPOINT = import.meta.env.VITE_POLLINATIONS_TEXT_URL
  || 'https://text.pollinations.ai/openai';
const POLLINATIONS_MODEL = import.meta.env.VITE_POLLINATIONS_TEXT_MODEL || 'openai';

const FALLBACK_TIMEOUT_MS = 45_000;

function withTimeout(promise, timeoutMs = FALLBACK_TIMEOUT_MS) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Tempo limite excedido.')), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function getPollinationsText(response) {
  const content = response?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map((part) => part?.text || '').join('');
  return typeof response === 'string' ? response : '';
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

function jsonPrompt(prompt, responseJsonSchema) {
  return `${prompt}\n\nINSTRUÇÃO DE FORMATO: responda somente com JSON válido, sem markdown nem texto antes ou depois, obedecendo a este JSON Schema:\n${JSON.stringify(responseJsonSchema)}`;
}

/**
 * Gera o diálogo da Luna diretamente pela API OpenAI-compatible do Pollinations.
 * A chave é opcional para o acesso público; quando configurada, deve ser uma
 * chave publicável e restrita por origem, pois este código roda no navegador.
 */
export async function invokeLunaAI({ prompt, responseJsonSchema }) {
  const headers = { 'Content-Type': 'application/json' };
  const apiKey = import.meta.env.VITE_POLLINATIONS_API_KEY;
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const response = await withTimeout(fetch(POLLINATIONS_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: POLLINATIONS_MODEL,
      messages: [{ role: 'user', content: jsonPrompt(prompt, responseJsonSchema) }],
      temperature: 0.4,
      stream: false,
    }),
  }));

  if (!response.ok) {
    throw new Error(`Pollinations indisponível (${response.status}).`);
  }

  const payload = await response.json();
  const answer = parseJsonResponse(getPollinationsText(payload));
  if (!answer?.answer) throw new Error('Resposta sem o campo obrigatório "answer".');
  return { answer, provider: `pollinations:${POLLINATIONS_MODEL}` };
}

export const LUNA_POLLINATIONS_MODEL = POLLINATIONS_MODEL;
