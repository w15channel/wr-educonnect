// Contrato estrutural das aulas: cabeçalho, 6 tópicos e 6 parágrafos de 60–65 palavras em cada tópico.
export const PROFESSOR_LINE = 'Prof. William Ribeiro | WR-EDU® | Instituto de Desenvolvimento Humano';
export const DIVIDER_LINE = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
export const TOPIC_COUNT = 6;
export const PARAGRAPHS_PER_TOPIC = 6;
export const MIN_WORDS = 60;
export const MAX_WORDS = 65;

const TOPIC_TITLE = /^([1-6])[.)]\s+(.+)$/;

export const countWords = (text = '') => String(text).trim().split(/\s+/).filter(Boolean).length;
export const isInRange = (paragraph) => {
  const count = countWords(paragraph);
  return count >= MIN_WORDS && count <= MAX_WORDS;
};

const normalizeParagraph = (value = '') => String(value).replace(/\s+/g, ' ').trim();

/** Analisa o formato final em blocos, tolerando quebras simples inseridas pela IA dentro dos parágrafos. */
export function parseLesson(text = '') {
  const topics = [];
  const blocks = String(text)
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((block) => block.split('\n').map((line) => line.trim()).filter(Boolean).join(' '))
    .filter(Boolean);

  for (const block of blocks) {
    const headingMatch = block.match(TOPIC_TITLE);
    if (headingMatch) {
      topics.push({ title: headingMatch[2].trim(), paragraphs: [] });
      continue;
    }
    if (!topics.length) continue; // Ignora as três linhas do cabeçalho institucional.

    // Se houve quebra de linha interna e a IA agrupou o título com o parágrafo,
    // o texto será contado como um bloco e a validação apontará a inconsistência.
    topics[topics.length - 1].paragraphs.push(normalizeParagraph(block));
  }
  return topics;
}

/** Remonta o texto em formato canônico, sem depender da formatação devolvida pela IA. */
export function buildLessonText(lessonTitle, topics) {
  const header = [String(lessonTitle || '').trim().toUpperCase(), PROFESSOR_LINE, DIVIDER_LINE].join('\n');
  const body = topics.flatMap((topic, index) => [
    `${index + 1}. ${String(topic.title || '').trim().toUpperCase()}`,
    ...topic.paragraphs.map(normalizeParagraph),
  ]);
  return [header, ...body].join('\n\n');
}

export function analyzeLesson(topics) {
  const issues = [];
  if (!Array.isArray(topics) || topics.length !== TOPIC_COUNT) {
    issues.push(`A aula tem ${Array.isArray(topics) ? topics.length : 0} tópicos (devem ser ${TOPIC_COUNT}).`);
  }
  let outOfRange = 0;
  const topicWordTotals = [];

  (Array.isArray(topics) ? topics : []).forEach((topic, index) => {
    const title = String(topic?.title || '').trim();
    if (!title) issues.push(`Tópico ${index + 1}: título ausente.`);
    else if (title !== title.toLocaleUpperCase('pt-BR')) issues.push(`Tópico ${index + 1}: o título deve estar em maiúsculas.`);

    const paragraphs = Array.isArray(topic?.paragraphs) ? topic.paragraphs : [];
    if (paragraphs.length !== PARAGRAPHS_PER_TOPIC) {
      issues.push(`Tópico ${index + 1}: ${paragraphs.length} parágrafos (devem ser ${PARAGRAPHS_PER_TOPIC}).`);
    }
    const bad = paragraphs
      .map((paragraph, paragraphIndex) => ({ number: paragraphIndex + 1, words: countWords(paragraph) }))
      .filter((item) => item.words < MIN_WORDS || item.words > MAX_WORDS);
    outOfRange += bad.length;
    if (bad.length) {
      issues.push(`Tópico ${index + 1}: ${bad.map((item) => `parágrafo ${item.number} com ${item.words} palavras`).join(', ')}.`);
    }

    const total = paragraphs.reduce((sum, paragraph) => sum + countWords(paragraph), 0);
    topicWordTotals.push(total);
    if (total < MIN_WORDS * PARAGRAPHS_PER_TOPIC || total > MAX_WORDS * PARAGRAPHS_PER_TOPIC) {
      issues.push(`Tópico ${index + 1}: ${total} palavras no corpo (o intervalo permitido é 360–390, sem contar o título).`);
    }
  });

  if (topicWordTotals.length === TOPIC_COUNT && Math.max(...topicWordTotals) - Math.min(...topicWordTotals) > 30) {
    issues.push('A diferença de extensão entre tópicos excede 30 palavras.');
  }
  return {
    topicCount: Array.isArray(topics) ? topics.length : 0,
    paragraphCount: (Array.isArray(topics) ? topics : []).reduce((total, topic) => total + (Array.isArray(topic?.paragraphs) ? topic.paragraphs.length : 0), 0),
    outOfRange,
    topicWordTotals,
    issues,
    valid: issues.length === 0,
  };
}
