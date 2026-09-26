const ENDPOINT = Deno.env.get('POLLINATIONS_TEXT_URL') || 'https://text.pollinations.ai/openai';
const MODEL = Deno.env.get('POLLINATIONS_TEXT_MODEL') || 'openai';

function jsonFromText(text: string) {
  const clean = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(clean.slice(start, end + 1));
    throw new Error('Pollinations retornou JSON inválido.');
  }
}

export async function invokePollinations({ prompt, response_json_schema: schema }: {
  prompt: string;
  response_json_schema?: Record<string, unknown>;
}) {
  const key = Deno.env.get('POLLINATIONS_API_KEY');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (key) headers.Authorization = `Bearer ${key}`;
  const formattedPrompt = schema
    ? `${prompt}\n\nFORMATO OBRIGATÓRIO: responda somente com JSON válido, sem markdown, seguindo este JSON Schema:\n${JSON.stringify(schema)}`
    : prompt;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST', headers, signal: controller.signal,
      body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: formattedPrompt }], temperature: 0.35, stream: false }),
    });
    if (!response.ok) throw new Error(`Pollinations indisponível (${response.status}).`);
    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    const text = Array.isArray(content) ? content.map((part: any) => part?.text || '').join('') : String(content || '');
    if (!text.trim()) throw new Error('Pollinations retornou uma resposta vazia.');
    return schema ? jsonFromText(text) : text.trim();
  } finally {
    clearTimeout(timeout);
  }
}

export const POLLINATIONS_PROVIDER = `pollinations:${MODEL}`;
