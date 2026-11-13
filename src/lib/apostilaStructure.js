// Estrutura padrão das aulas da apostila: cabeçalho, 6 tópicos e 6 parágrafos de 60 a 65 palavras por tópico.
export const PROFESSOR_LINE = 'Prof. William Ribeiro | WR-EDU® | Instituto de Desenvolvimento Humano';
export const DIVIDER_LINE = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
export const TOPIC_COUNT = 6;
export const PARAGRAPHS_PER_TOPIC = 6;
export const MIN_WORDS = 60;
export const MAX_WORDS = 65;

const TOPIC_TITLE = /^[1-9][.)]\s+\S/;

export const countWords = (text = '') => text.split(/\s+/).filter(Boolean).length;
export const isInRange = (paragraph) => {
  const count = countWords(paragraph);
  return count >= MIN_WORDS && count <= MAX_WORDS;
};

const cleanLine = (line) => line.replace(/^[#*\s]+|[*\s]+$/g, '').trim();

/** Lê o texto gerado e devolve os tópicos com seus parágrafos; o cabeçalho é descartado e remontado depois. */
export function parseLesson(text = '') {
  const topics = [];
  text.split(/\n+/).map(cleanLine).filter(Boolean).forEach((line) => {
    if (TOPIC_TITLE.test(line) && countWords(line) <= 16) {
      topics.push({ title: line.replace(/^[1-9][.)]\s+/, '').toUpperCase(), paragraphs: [] });
    } else if (topics.length) {
      topics[topics.length - 1].paragraphs.push(line);
    }
  });
  return topics;
}

/** Remonta a aula no formato final, com cabeçalho e numeração garantidos. */
export function buildLessonText(lessonTitle, topics) {
  const header = [lessonTitle.toUpperCase(), PROFESSOR_LINE, DIVIDER_LINE].join('\n');
  const body = topics.flatMap((topic, index) => [`${index + 1}. ${topic.title}`, ...topic.paragraphs]);
  return [header, ...body].join('\n\n');
}

export function analyzeLesson(topics) {
  const issues = [];
  if (topics.length !== TOPIC_COUNT) issues.push(`A aula tem ${topics.length} tópicos (devem ser ${TOPIC_COUNT}). Gere outra versão.`);
  let outOfRange = 0;
  topics.forEach((topic, index) => {
    if (topic.paragraphs.length !== PARAGRAPHS_PER_TOPIC) {
      issues.push(`Tópico ${index + 1}: ${topic.paragraphs.length} parágrafos (devem ser ${PARAGRAPHS_PER_TOPIC}).`);
    }
    const bad = topic.paragraphs
      .map((paragraph, paragraphIndex) => ({ number: paragraphIndex + 1, words: countWords(paragraph) }))
      .filter((item) => item.words < MIN_WORDS || item.words > MAX_WORDS);
    outOfRange += bad.length;
    if (bad.length) {
      issues.push(`Tópico ${index + 1}: ${bad.map((item) => `parágrafo ${item.number} com ${item.words} palavras`).join(', ')}.`);
    }
  });
  return {
    topicCount: topics.length,
    paragraphCount: topics.reduce((total, topic) => total + topic.paragraphs.length, 0),
    outOfRange,
    issues,
    valid: issues.length === 0,
  };
}