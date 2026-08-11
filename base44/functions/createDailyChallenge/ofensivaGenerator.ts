/**
 * Gerador inteligente de ofensivas.
 *
 * Atua como uma "IA offline": compreende o tema da aula a partir do banco
 * de conhecimento extraído da apostila e monta 8 perguntas exclusivas,
 * não genéricas, com variação por dia e dificuldade controlada.
 *
 * Dificuldade (schema da trilha):
 *  - Fáceis: q1, q2, q4, q5, q7, q8  (slots 0,1,3,4,6,7)
 *  - Medianas (baús): q3, q6         (slots 2,5)
 */

import {
  findLessonKnowledge,
  flattenLessons,
  type LessonKnowledge,
} from './lessonKnowledge.ts';

export type GeneratedQuestion = {
  id: string;
  text: string;
  hint: string;
  difficulty: 'easy' | 'medium';
};

type TemplateFn = (ctx: QuestionContext) => string;

type QuestionContext = {
  theme: string;
  moduleTitle: string;
  concept: string;
  conceptB: string;
  technique: string;
  techniqueDetail: string;
  insight: string;
  focusPoint: string;
  dayLabel: string;
};

const EASY_SLOTS = new Set([0, 1, 3, 4, 6, 7]);
const MEDIUM_SLOTS = new Set([2, 5]);

/** Mulberry32 — PRNG determinístico para variar sem repetir o padrão. */
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(rng: () => number, list: T[], offset = 0): T {
  if (!list.length) throw new Error('Lista vazia no gerador de ofensiva');
  const idx = (Math.floor(rng() * list.length) + offset) % list.length;
  return list[idx];
}

function takeUnique<T>(rng: () => number, list: T[], count: number): T[] {
  if (!list.length) return [];
  const pool = [...list];
  const out: T[] = [];
  while (out.length < count && pool.length) {
    const i = Math.floor(rng() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  // Se a lista for curta, completa ciclando de forma uniforme
  let guard = 0;
  while (out.length < count && list.length && guard < count * 3) {
    out.push(list[guard % list.length]);
    guard += 1;
  }
  return out;
}

function shorten(text: string, max = 160): string {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 60 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

function stripTrailingPunct(s: string): string {
  return s.replace(/[.\s]+$/g, '').trim();
}

// ── Templates fáceis: identificação, reconhecimento, aplicação direta ────────
const EASY_TEMPLATES: TemplateFn[] = [
  (c) =>
    `Em uma frase, o que significa "${c.concept}" no contexto de "${c.theme}" e por que isso importa na primeira sessão?`,
  (c) =>
    `Cite um sinal clínico concreto que ajudaria você a reconhecer "${c.concept}" durante o atendimento de um paciente.`,
  (c) =>
    `Como você explicaria "${c.technique || c.concept}" para um paciente iniciante, em linguagem simples e acolhedora?`,
  (c) =>
    `Qual é a diferença prática entre apenas "saber sobre" "${c.theme}" e de fato aplicar "${c.concept}" na sessão?`,
  (c) =>
    `A partir da ideia de que ${stripTrailingPunct(shorten(c.insight, 140)).toLowerCase()}, qual atitude do terapeuta fica mais importante?`,
  (c) =>
    `Se o paciente demonstra dificuldade ligada a "${c.theme}", qual pergunta aberta e sem julgamento você faria primeiro?`,
  (c) =>
    `Qual cuidado ético básico o terapeuta precisa ter ao trabalhar "${c.concept}" para não expor nem pressionar o paciente?`,
  (c) =>
    `Descreva uma microação (algo que você faria em até 2 minutos de sessão) para observar "${c.technique || c.concept}" com mais clareza.`,
  (c) =>
    `O que um terapeuta iniciante costuma confundir ao encontrar "${c.concept}" pela primeira vez em um caso real?`,
  (c) =>
    `Como o ambiente da sessão (tom de voz, ritmo, setting) pode facilitar ou atrapalhar o trabalho com "${c.theme}"?`,
  (c) =>
    `Traduza o ponto da aula — "${shorten(c.focusPoint, 120)}" — em uma orientação prática para a sua próxima sessão.`,
  (c) =>
    `Qual comportamento de evitação do paciente pode aparecer quando o tema "${c.theme}" se aproxima, e como você o nomearia com suavidade?`,
];

// ── Templates medianos (baús): raciocínio clínico, integração, intervenção ───
const MEDIUM_TEMPLATES: TemplateFn[] = [
  (c) =>
    `Caso clínico: um paciente chega falando muito, mas evita o núcleo do sofrimento. Como "${c.concept}" e "${c.conceptB}" da aula "${c.theme}" ajudariam você a ler essa cena e escolher o próximo passo?`,
  (c) =>
    `Monte uma intervenção breve (o que você diria + o que observaria) usando "${c.technique || c.concept}"${c.techniqueDetail ? ` — lembrando que ${shorten(c.techniqueDetail, 110).toLowerCase()}` : ''} — sem quebrar a aliança.`,
  (c) =>
    `Como "${c.concept}" se conecta com vínculo terapêutico e adesão? Explique o risco de forçar o ritmo e uma alternativa mais segura.`,
  (c) =>
    `Compare "${c.concept}" e "${c.conceptB}" no tema "${c.theme}": em que momento clínico cada um orienta melhor a sua conduta?`,
  (c) =>
    `A aula destaca que ${stripTrailingPunct(shorten(c.insight, 150)).toLowerCase()}. Crie uma hipótese clínica inicial e uma pergunta de investigação coerente com isso.`,
  (c) =>
    `O paciente reage com resistência ao se aproximar de "${c.theme}". Como você usaria "${c.concept}" para validar, regular o campo e ainda avançar o trabalho?`,
  (c) =>
    `Transforme o aprendizado de "${c.theme}" em uma tarefa entre sessões realista, ética e mensurável, alinhada a "${c.concept}".`,
  (c) =>
    `Que erro de formulação (interpretar rápido demais, moralizar ou tecnicizar) pode surgir ao trabalhar "${c.concept}"? Como você se corrigiria na hora?`,
];

const EASY_HINTS = [
  (c: QuestionContext) =>
    `Nível fácil · Foque no conceito "${c.concept}" da aula "${c.theme}". Resposta curta, clara e clínica.`,
  (c: QuestionContext) =>
    `Nível fácil · Use um exemplo simples do consultório ligado a "${c.theme}". Evite teoria solta.`,
  (c: QuestionContext) =>
    `Nível fácil · Mostre que você entendeu o essencial de "${c.technique || c.concept}" e sabe nomeá-lo na prática.`,
];

const MEDIUM_HINTS = [
  (c: QuestionContext) =>
    `Baú (nível mediano) · Integre pelo menos dois elementos da aula "${c.theme}" (ex.: "${c.concept}" e "${c.conceptB}") e justifique a conduta.`,
  (c: QuestionContext) =>
    `Baú (nível mediano) · Descreva cena → leitura clínica → intervenção. Mantenha ética, vínculo e segurança.`,
  (c: QuestionContext) =>
    `Baú (nível mediano) · Vá além da definição: mostre raciocínio sobre função do comportamento e manejo do campo.`,
];

function buildContext(
  knowledge: LessonKnowledge,
  rng: () => number,
  usedConcepts: Set<string>,
): QuestionContext {
  const concepts = knowledge.concepts.length
    ? knowledge.concepts
    : [knowledge.theme];
  const insights = knowledge.insights.length
    ? knowledge.insights
    : [`Compreender ${knowledge.theme} muda a qualidade da escuta clínica.`];
  const focuses = knowledge.focuses.length
    ? knowledge.focuses
    : concepts.map((concept) => ({
        concept,
        point: `Observar ${concept} com presença e método.`,
      }));
  const techniques = knowledge.techniques.length
    ? knowledge.techniques
    : concepts;
  const techniqueDetails = knowledge.techniqueDetails.length
    ? knowledge.techniqueDetails
    : techniques.map((label) => ({
        label,
        detail: `aplicar ${label} com presença e ética`,
      }));

  // Prefer concepts still unused in this set of 8
  const freshConcepts = concepts.filter((c) => !usedConcepts.has(c));
  const conceptPool = freshConcepts.length ? freshConcepts : concepts;
  const concept = pick(rng, conceptPool);
  usedConcepts.add(concept);

  let conceptB = pick(rng, concepts);
  if (concepts.length > 1) {
    const others = concepts.filter((c) => c !== concept);
    conceptB = pick(rng, others.length ? others : concepts);
  }

  const tech = pick(rng, techniqueDetails);
  const focus = pick(rng, focuses);
  const insight = pick(rng, insights);

  return {
    theme: knowledge.theme,
    moduleTitle: knowledge.moduleTitle,
    concept,
    conceptB,
    technique: tech.label,
    techniqueDetail: tech.detail,
    insight,
    focusPoint: focus.point || insight,
    dayLabel: '',
  };
}

function selectTemplate(
  rng: () => number,
  templates: TemplateFn[],
  dayOffset: number,
  slot: number,
  usedTemplateIdx: Set<number>,
): { fn: TemplateFn; idx: number } {
  // Rotaciona a janela com dia + aleatoriedade da aula (rng já é seedado por lesson/tema)
  const rotation = (dayOffset * 3 + slot * 2 + Math.floor(rng() * templates.length)) % templates.length;
  const order = Array.from({ length: templates.length }, (_, i) => (rotation + i) % templates.length);
  for (const idx of order) {
    if (!usedTemplateIdx.has(idx)) {
      usedTemplateIdx.add(idx);
      return { fn: templates[idx], idx };
    }
  }
  const idx = order[Math.floor(rng() * order.length)] ?? 0;
  return { fn: templates[idx], idx };
}

/**
 * Gera 8 perguntas exclusivas para a aula/tema.
 * @param dayOffset varia o conjunto ao gerar vários dias do mesmo tema
 * @param salt seed extra (ex.: data YYYY-MM-DD) para divergir entre gerações
 */
export function buildQuestionsForLesson(
  knowledge: LessonKnowledge,
  dayOffset = 0,
  salt = '',
): GeneratedQuestion[] {
  const seed = hashString(`${knowledge.id}|${dayOffset}|${salt}|${knowledge.theme}`);
  const rng = mulberry32(seed ^ (dayOffset + 1) * 0x9e3779b9);
  const usedConcepts = new Set<string>();
  const usedEasyTpl = new Set<number>();
  const usedMediumTpl = new Set<number>();

  // Pré-embaralha pools para o dia
  const dayConcepts = takeUnique(rng, knowledge.concepts, Math.max(8, knowledge.concepts.length));
  // Garante diversidade injetando a ordem do dia no knowledge virtual
  const dayKnowledge: LessonKnowledge = {
    ...knowledge,
    concepts: dayConcepts.length ? dayConcepts : knowledge.concepts,
    insights: takeUnique(rng, knowledge.insights, knowledge.insights.length || 1),
    focuses: takeUnique(rng, knowledge.focuses, knowledge.focuses.length || 1),
    techniques: takeUnique(rng, knowledge.techniques, knowledge.techniques.length || 1),
    techniqueDetails: takeUnique(rng, knowledge.techniqueDetails, knowledge.techniqueDetails.length || 1),
  };

  return Array.from({ length: 8 }, (_, slot) => {
    const isMedium = MEDIUM_SLOTS.has(slot);
    const difficulty: 'easy' | 'medium' = isMedium ? 'medium' : 'easy';
    const templates = isMedium ? MEDIUM_TEMPLATES : EASY_TEMPLATES;
    const usedTpl = isMedium ? usedMediumTpl : usedEasyTpl;
    const { fn, idx } = selectTemplate(rng, templates, dayOffset, slot, usedTpl);
    const ctx = buildContext(dayKnowledge, rng, usedConcepts);
    ctx.dayLabel = `d${dayOffset + 1}`;

    const text = fn(ctx).replace(/\s+/g, ' ').trim();
    const hintPool = isMedium ? MEDIUM_HINTS : EASY_HINTS;
    const hint = hintPool[(idx + dayOffset + slot) % hintPool.length](ctx);

    return {
      id: `q${slot + 1}`,
      text,
      hint,
      difficulty,
    };
  });
}

export function buildQuestionsByIds(
  moduleId: string | null | undefined,
  lessonId: string | null | undefined,
  dayOffset = 0,
  salt = '',
): GeneratedQuestion[] {
  const knowledge = findLessonKnowledge(moduleId, lessonId);
  return buildQuestionsForLesson(knowledge, dayOffset, salt);
}

export function resolveLessonMeta(moduleId?: string | null, lessonId?: string | null) {
  const knowledge = findLessonKnowledge(moduleId, lessonId);
  return {
    knowledge,
    lessonId: knowledge.id,
    lessonTitle: knowledge.title,
    lessonRef: `${knowledge.moduleTitle} - ${knowledge.title}`,
    theme: knowledge.theme,
  };
}

/** Seleciona aula do calendário anual (automação diária).
 * Mantém o mesmo tema por ~7 dias e percorre todas as aulas de forma uniforme.
 */
export function pickLessonByDayOfYear(dayOfYear: number): LessonKnowledge {
  const all = flattenLessons();
  const safeDay = Number.isFinite(dayOfYear) ? Math.max(1, Math.floor(dayOfYear)) : 1;
  // Semana do ano → índice; o módulo garante cobertura cíclica de todas as aulas
  const weekIndex = Math.floor((safeDay - 1) / 7);
  const idx = ((weekIndex % all.length) + all.length) % all.length;
  return all[idx];
}

export { EASY_SLOTS, MEDIUM_SLOTS, findLessonKnowledge, flattenLessons };
