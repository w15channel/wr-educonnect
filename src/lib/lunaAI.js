import { invokePollinations, POLLINATIONS_TEXT_MODEL } from './pollinationsAI';

/**
 * Gera o diálogo da Luna diretamente pela API OpenAI-compatible do Pollinations.
 * A chave é opcional para o acesso público; quando configurada, deve ser uma
 * chave publicável e restrita por origem, pois este código roda no navegador.
 */
export async function invokeLunaAI({ prompt, responseJsonSchema }) {
  const answer = await invokePollinations({ prompt, response_json_schema: responseJsonSchema, temperature: 0.4 });
  if (!answer?.answer) throw new Error('Resposta sem o campo obrigatório "answer".');
  return { answer, provider: `pollinations:${POLLINATIONS_TEXT_MODEL}` };
}

export const LUNA_POLLINATIONS_MODEL = POLLINATIONS_TEXT_MODEL;
