import { invokePollinations } from '@/lib/pollinationsAI';
import { analyzeLesson, isInRange, MIN_WORDS, MAX_WORDS, PARAGRAPHS_PER_TOPIC, TOPIC_COUNT } from '@/lib/apostilaStructure';

const wordRange = `${MIN_WORDS} a ${MAX_WORDS} palavras`;
const topicRepairSchema = {
  type: 'object',
  properties: {
    topics: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          paragraphs: { type: 'array', items: { type: 'string' } },
        },
        required: ['title', 'paragraphs'],
        additionalProperties: false,
      },
    },
  },
  required: ['topics'],
  additionalProperties: false,
};

const changesSchema = {
  type: 'object',
  properties: {
    changes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          topic_index: { type: 'integer' },
          paragraph_index: { type: 'integer' },
          paragraphs: { type: 'array', items: { type: 'string' } },
        },
        required: ['topic_index', 'paragraph_index', 'paragraphs'],
        additionalProperties: false,
      },
    },
  },
  required: ['changes'],
  additionalProperties: false,
};

const validParagraphs = (paragraphs) => Array.isArray(paragraphs)
  && paragraphs.length === PARAGRAPHS_PER_TOPIC
  && paragraphs.every((paragraph) => typeof paragraph === 'string' && isInRange(paragraph));

/** Faz no máximo uma chamada de ajuste, apenas para os trechos que falharam na validação. */
export async function repairLesson(topics, lessonTitle, onStage, originalText = '') {
  if (analyzeLesson(topics).valid) return topics;
  onStage?.(1, 1);

  // Se a geração inicial perdeu/criou tópicos, corrige a estrutura inteira em uma chamada, preservando o conteúdo recebido.
  if (topics.length !== TOPIC_COUNT) {
    const result = await invokePollinations({
      temperature: 0.2,
      response_json_schema: topicRepairSchema,
      prompt: `Ajuste o texto da aula "${lessonTitle}" para cumprir a estrutura sem iniciar uma nova redação do zero. Preserve e reorganize ao máximo o conteúdo existente. Complete ou remova tópicos conforme necessário para retornar EXATAMENTE ${TOPIC_COUNT} tópicos, cada um com EXATAMENTE ${PARAGRAPHS_PER_TOPIC} parágrafos. Cada parágrafo deve ter ${wordRange}; mantenha títulos técnicos em maiúsculas e o fechamento de cada tópico. Revise a contagem antes de responder. Retorne os tópicos completos no JSON solicitado.\n\nTÓPICOS EXTRAÍDOS:\n${JSON.stringify(topics)}\n\nTEXTO ORIGINAL GERADO:\n${originalText}`,
    });
    const repaired = Array.isArray(result?.topics) ? result.topics : [];
    if (repaired.length !== TOPIC_COUNT || repaired.some((topic) => !validParagraphs(topic?.paragraphs))) return topics;
    return repaired.map((topic) => ({
      title: String(topic.title || '').toUpperCase(),
      paragraphs: topic.paragraphs.map((paragraph) => paragraph.trim()),
    }));
  }

  // Com seis tópicos, envia apenas parágrafos fora da faixa ou o conteúdo dos tópicos com quantidade incorreta.
  const jobs = [];
  topics.forEach((topic, topicIndex) => {
    if (topic.paragraphs.length !== PARAGRAPHS_PER_TOPIC) {
      jobs.push({ topic_index: topicIndex + 1, paragraph_index: 0, content: topic.paragraphs.join('\n\n') || topic.title });
      return;
    }
    topic.paragraphs.forEach((paragraph, paragraphIndex) => {
      if (!isInRange(paragraph)) {
        jobs.push({ topic_index: topicIndex + 1, paragraph_index: paragraphIndex + 1, content: paragraph });
      }
    });
  });
  if (!jobs.length) return topics;

  const result = await invokePollinations({
    temperature: 0.2,
    response_json_schema: changesSchema,
    prompt: `Corrija somente os trechos listados da aula "${lessonTitle}". Preserve sentido, conceitos e tom técnico-didático. Para paragraph_index maior que zero, devolva exatamente um parágrafo revisado com ${wordRange}. Para paragraph_index igual a zero, redistribua o conteúdo do tópico em exatamente ${PARAGRAPHS_PER_TOPIC} parágrafos, cada um com ${wordRange}. Não altere os tópicos ou parágrafos não listados. Confira a contagem de palavras. Retorne uma alteração por item de entrada, mantendo topic_index e paragraph_index.\n\nITENS A CORRIGIR:\n${JSON.stringify(jobs)}`,
  });

  const repaired = topics.map((topic) => ({ ...topic, paragraphs: [...topic.paragraphs] }));
  (Array.isArray(result?.changes) ? result.changes : []).forEach((change) => {
    const topicIndex = Number(change.topic_index) - 1;
    const topic = repaired[topicIndex];
    if (!topic) return;
    const paragraphIndex = Number(change.paragraph_index);
    const paragraphs = Array.isArray(change.paragraphs) ? change.paragraphs.map((item) => String(item).trim()) : [];

    if (paragraphIndex === 0) {
      if (validParagraphs(paragraphs)) repaired[topicIndex].paragraphs = paragraphs;
      return;
    }
    if (paragraphIndex > 0 && paragraphIndex <= topic.paragraphs.length && paragraphs.length === 1 && isInRange(paragraphs[0])) {
      repaired[topicIndex].paragraphs[paragraphIndex - 1] = paragraphs[0];
    }
  });
  return repaired;
}
