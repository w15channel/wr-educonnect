import { invokePollinations } from './pollinationsAI';

/** Gera o diálogo da Luna pela IA da Grok, com a chave guardada no servidor. */
export async function invokeLunaAI({ prompt, responseJsonSchema }) {
  const answer = await invokePollinations({ prompt, response_json_schema: responseJsonSchema, temperature: 0.4 });
  if (!answer?.answer) throw new Error('Resposta sem o campo obrigatório "answer".');
  return { answer, provider: 'grok' };
}