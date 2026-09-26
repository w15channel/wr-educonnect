const POLLINATIONS_ENDPOINT = import.meta.env.VITE_POLLINATIONS_TEXT_URL
  || 'https://text.pollinations.ai/openai';
const POLLINATIONS_MODEL = import.meta.env.VITE_POLLINATIONS_TEXT_MODEL || 'openai';
const DEFAULT_TIMEOUT_MS = 45_000;

function extractText(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) return content.map((part) => part?.text || '').join('').trim();
  return typeof payload === 'string' ? payload.trim() : '';
}

export function parsePollinationsJson(value) {
  if (value && typeof value === 'object') return value;
  const clean = String(value || '').trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  if (!clean) throw new Error('A IA retornou uma resposta vazia.');
  try {
    return JSON.parse(clean);
  } catch {
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(clean.slice(start, end + 1));
    throw new Error('A IA retornou um JSON inválido.');
  }
}

function formattedPrompt(prompt, schema) {
  if (!schema) return prompt;
  return `${prompt}\n\nFORMATO OBRIGATÓRIO: responda somente com JSON válido, sem markdown ou comentários, seguindo este JSON Schema:\n${JSON.stringify(schema)}`;
}

/** Provedor temporário comum para todas as experiências generativas do portal. */
export async function invokePollinations({ prompt, response_json_schema: schema, temperature = 0.35, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  if (!prompt?.trim()) throw new Error('O prompt da IA não pode estar vazio.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const headers = { 'Content-Type': 'application/json' };
  const apiKey = import.meta.env.VITE_POLLINATIONS_API_KEY;
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  try {
    const response = await fetch(POLLINATIONS_ENDPOINT, {
      method: 'POST', headers, signal: controller.signal,
      body: JSON.stringify({
        model: POLLINATIONS_MODEL,
        messages: [{ role: 'user', content: formattedPrompt(prompt, schema) }],
        temperature,
        stream: false,
      }),
    });
    if (!response.ok) throw new Error(`Pollinations indisponível (${response.status}).`);
    const text = extractText(await response.json());
    if (!text) throw new Error('A IA retornou uma resposta vazia.');
    return schema ? parsePollinationsJson(text) : text;
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('O Pollinations demorou além do limite. Tente novamente.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const POLLINATIONS_TEXT_MODEL = POLLINATIONS_MODEL;
