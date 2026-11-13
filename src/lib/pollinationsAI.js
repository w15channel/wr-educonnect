import { base44 } from '@/api/base44Client';
import { getSession } from '@/lib/customAuth';

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

/**
 * Geração de textos de todo o portal pela IA da Grok. A chave fica guardada no
 * servidor; o nome histórico da função foi mantido para os pontos que a utilizam.
 */
export async function invokePollinations({ prompt, response_json_schema: schema, temperature = 0.35 }) {
  if (!prompt?.trim()) throw new Error('O prompt da IA não pode estar vazio.');
  let data;
  try {
    ({ data } = await base44.functions.invoke('generateText', {
      prompt: formattedPrompt(prompt, schema),
      temperature,
      access_code_id: getSession()?.codeId,
    }));
  } catch (error) {
    throw new Error(error?.response?.data?.error || error?.message || 'A IA da Grok está indisponível.');
  }
  const text = String(data?.text || '').trim();
  if (!text) throw new Error('A IA retornou uma resposta vazia.');
  return schema ? parsePollinationsJson(text) : text;
}

export const POLLINATIONS_TEXT_MODEL = 'grok';