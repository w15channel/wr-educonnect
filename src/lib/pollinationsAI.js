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

const LUNA_MODEL_ID = 'gpt_6_luna';
const LLM_WRAPPER_KEYS = ['response', 'result', 'data', 'output', 'content', 'text'];

function unwrapLunaResult(value, schema) {
  const expectedKeys = Object.keys(schema?.properties || {});
  const queue = [value];
  const visited = new Set();

  while (queue.length) {
    const candidate = queue.shift();
    if (candidate === null || candidate === undefined || visited.has(candidate)) continue;
    if (typeof candidate === 'string') {
      const text = candidate.trim();
      if (!text) continue;
      try {
        queue.unshift(parsePollinationsJson(text));
        continue;
      } catch {
        if (!schema) return text;
        continue;
      }
    }
    if (typeof candidate !== 'object') continue;
    visited.add(candidate);

    if (Array.isArray(candidate.choices)) {
      const message = candidate.choices[0]?.message?.content;
      if (message !== undefined) queue.unshift(message);
    }
    if (!schema || expectedKeys.some((key) => Object.prototype.hasOwnProperty.call(candidate, key))) {
      return candidate;
    }
    for (const key of LLM_WRAPPER_KEYS) {
      if (candidate[key] !== undefined) queue.push(candidate[key]);
    }
  }

  if (schema) throw new Error(`A resposta do GPT Luna 6 não contém os campos esperados: ${expectedKeys.join(', ')}.`);
  throw new Error('A IA retornou uma resposta vazia.');
}

/** Executa o modelo GPT Luna 6 no backend, evitando chamadas bloqueadas no navegador. */
export async function invokeLunaAI({ prompt, response_json_schema: schema }) {
  if (!prompt?.trim()) throw new Error('O prompt da IA não pode estar vazio.');
  const session = getSession();
  let data;
  try {
    ({ data } = await base44.functions.invoke('generateChapterText', {
      prompt,
      response_json_schema: schema,
      admin_email: session?.email,
    }));
  } catch (error) {
    throw new Error(error?.response?.data?.error || error?.message || 'Não foi possível gerar o conteúdo com GPT Luna 6.');
  }
  return unwrapLunaResult(data?.result ?? data, schema);
}

/**
 * Geração histórica dos demais textos do portal pela IA da Grok. A chave fica
 * guardada no servidor; os demais geradores continuam usando este fluxo.
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
export const LUNA_TEXT_MODEL = LUNA_MODEL_ID;
