import { invokePollinations } from '@/lib/pollinationsAI';
import { analyzeLesson, countWords, isInRange, MIN_WORDS, MAX_WORDS, PARAGRAPHS_PER_TOPIC } from '@/lib/apostilaStructure';

const MAX_ROUNDS = 5;
const TARGET_WORDS = 63;
const OUTPUT_RULE = 'um por linha, separados por linha em branco, sem numeração, sem contagem de palavras e sem comentários';

const toLines = (text) => text.split(/\n+/).map((line) => line.replace(/^\[?\d+\]?[.):-]?\s+/, '').trim()).filter(Boolean);
const distance = (paragraph) => {
  const count = countWords(paragraph);
  return count < MIN_WORDS ? MIN_WORDS - count : Math.max(0, count - MAX_WORDS);
};

// Tópico com quantidade errada de parágrafos: redistribui o conteúdo em exatamente 6.
async function splitTopic(topic, lessonTitle) {
  const lines = toLines(await invokePollinations({
    temperature: 0.3,
    prompt: `Reorganize e desenvolva o texto abaixo, do tópico "${topic.title}" da aula "${lessonTitle}", em EXATAMENTE ${PARAGRAPHS_PER_TOPIC} parágrafos, cada um com 61 a 64 palavras, preservando o tema e a linguagem técnico-profissional e didática. O último parágrafo conclui a ideia do tópico.

${topic.paragraphs.join(' ') || topic.title}

Retorne APENAS os ${PARAGRAPHS_PER_TOPIC} parágrafos, ${OUTPUT_RULE}.`,
  }));
  return lines.length === PARAGRAPHS_PER_TOPIC ? { ...topic, paragraphs: lines } : topic;
}

// Tópico com 6 parágrafos: ajusta somente os que estão fora da faixa de palavras.
async function resizeParagraphs(topic) {
  const bad = topic.paragraphs.map((_, index) => index).filter((index) => !isInRange(topic.paragraphs[index]));
  if (!bad.length) return topic;
  const items = bad.map((index, position) => {
    const paragraph = topic.paragraphs[index];
    const count = countWords(paragraph);
    const action = count > TARGET_WORDS ? `remova ${count - TARGET_WORDS} palavras` : `acrescente ${TARGET_WORDS - count} palavras`;
    return `[${position + 1}] tem ${count} palavras: ${action}.\n${paragraph}`;
  });
  const lines = toLines(await invokePollinations({
    temperature: 0.3,
    prompt: `Ajuste o tamanho dos parágrafos abaixo para que cada um tenha entre 61 e 64 palavras, preservando o sentido, o tom técnico-didático e o conteúdo essencial. Altere o mínimo necessário.

${items.join('\n\n')}

Retorne APENAS os ${bad.length} parágrafos ajustados, na mesma ordem, ${OUTPUT_RULE}.`,
  }));
  if (lines.length !== bad.length) return topic;
  const paragraphs = [...topic.paragraphs];
  bad.forEach((index, position) => {
    if (distance(lines[position]) < distance(paragraphs[index])) paragraphs[index] = lines[position];
  });
  return { ...topic, paragraphs };
}

/** Corrige em rodadas somente os trechos que não cumprem a estrutura, até validar ou esgotar as tentativas. */
export async function repairLesson(topics, lessonTitle, onRound) {
  let current = topics;
  for (let round = 1; round <= MAX_ROUNDS && !analyzeLesson(current).valid; round += 1) {
    onRound?.(round, MAX_ROUNDS);
    current = await Promise.all(current.map((topic) => (
      topic.paragraphs.length === PARAGRAPHS_PER_TOPIC ? resizeParagraphs(topic) : splitTopic(topic, lessonTitle)
    )));
  }
  return current;
}