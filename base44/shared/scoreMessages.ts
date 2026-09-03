/**
 * scoreMessages
 * ─────────────
 * Mensagens de pontuação encorajadoras — substituem os avisos técnicos
 * ("pontuado conforme a regra atual") por reconhecimento real do esforço.
 *
 * A escolha é DETERMINÍSTICA (hash do identificador), então recalcular a
 * pontuação não fica reescrevendo a mesma anotação com textos diferentes.
 */

function pick(list: string[], seed: string): string {
  let hash = 0;
  const key = String(seed || '');
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) % 1000003;
  return list[hash % list.length];
}

const fmt = (value: number) => String(Math.round((Number(value) + Number.EPSILON) * 1000) / 1000).replace('.', ',');

/** Keeps human-authored feedback and only falls back to automation when blank. */
export function preserveOrGenerateFeedback(
  submissionFeedback: unknown,
  scoreNotes: unknown,
  automaticFeedback: string,
): string {
  return String(submissionFeedback || scoreNotes || '').trim() || automaticFeedback;
}

const LESSON = [
  'Aula concluída com dedicação! Cada aula assistida te deixa mais perto do terapeuta que você quer ser. +2 pontos 💚',
  'Muito bem! Você está transformando conhecimento em prática. Aula creditada com +2 pontos ✨',
  'Excelente constância! Quem assiste, aprende — e quem aprende, cuida melhor. +2 pontos conquistados 🌱',
  'Parabéns pelo compromisso com o seu estudo! Aula validada: +2 pontos na sua caminhada 🎓',
];

const TASK = [
  'Muito bem! Cada trabalho entregue te deixa um passo mais perto da excelência. +{pts} pontos 🌟',
  'Que orgulho da sua entrega! Você está construindo repertório clínico de verdade. +{pts} pontos 👏',
  'Trabalho recebido com honra — sua dedicação aparece no texto. +{pts} pontos merecidos 💪',
  'Você cumpriu, e cumpriu bem! Continue nesse ritmo: +{pts} pontos para a sua trajetória 🚀',
];

const QUIZ = [
  'Prova entregue com coragem! Avaliar-se é parte da formação. +{pts} pontos conquistados 🏆',
  'Muito bem! Você encarou o desafio e saiu maior dele. +{pts} pontos 🎯',
  'Excelente! Cada prova consolida o que você já sabe. +{pts} pontos registrados ⭐',
];

const EXAM_GRADED = [
  'Prova corrigida com carinho pelo professor: {pts} pontos. Siga firme, você está evoluindo! 📘',
  'Avaliação concluída: {pts} pontos. Cada correção é um convite para ir além 🌟',
  'Resultado registrado: {pts} pontos. Orgulho da sua caminhada até aqui 💚',
];

const FORUM = [
  'Sua voz enriqueceu a {space}! Debater é aprender em dobro: +{pts} ponto(s) 💬',
  'Muito bem! Compartilhar ideias na {space} fortalece toda a turma. +{pts} ponto(s) ✨',
  'Participação valiosa na {space} — a turma cresce quando você fala. +{pts} ponto(s) 🌿',
];

const FORUM_REPLY = [
  'Você acolheu um colega na {space} — isso é postura de terapeuta! +{pts} ponto(s) 🤝',
  'Resposta generosa na {space}. Ajudar é a melhor forma de fixar o conteúdo. +{pts} ponto(s) 💛',
  'Muito bem por dialogar na {space}: sua escuta faz diferença. +{pts} ponto(s) ✨',
];

const OFENSIVA = [
  'Ofensiva do dia concluída ({answered}/8)! Sua constância é impressionante: +{pts} ponto(s) 🔥',
  'Que ritmo! Você manteve a chama acesa hoje ({answered}/8): +{pts} ponto(s) 🔥',
  'Mais um dia de treino mental ({answered}/8) — a disciplina está virando talento. +{pts} ponto(s) ⚡',
];

const THERAPIST = [
  'Relato enviado como {role} — experiência que vale ouro na sua formação. +10 pontos 💎',
  'Muito bem! Viver o processo como {role} amadurece o seu olhar clínico. +10 pontos 🌟',
  'Que entrega valiosa como {role}! A prática te forma de dentro para fora. +10 pontos 💚',
];

export function lessonScoreNote(refId = '') {
  return pick(LESSON, `lesson:${refId}`);
}

export function taskScoreNote(refId = '', points = 5, isQuiz = false) {
  const list = isQuiz ? QUIZ : TASK;
  return pick(list, `${isQuiz ? 'quiz' : 'task'}:${refId}`).replace('{pts}', fmt(points));
}

export function examScoreNote(refId = '', points = 0) {
  return pick(EXAM_GRADED, `exam:${refId}`).replace('{pts}', fmt(points));
}

export function forumScoreNote(refId = '', points = 0.1, space = 'Sala de Debates', isReply = false) {
  return pick(isReply ? FORUM_REPLY : FORUM, `${isReply ? 'reply' : 'post'}:${refId}`)
    .replace('{pts}', fmt(points))
    .replace('{space}', space);
}

export function ofensivaScoreNote(refId = '', points = 0, answered = 0) {
  return pick(OFENSIVA, `ofensiva:${refId}`)
    .replace('{pts}', fmt(points))
    .replace('{answered}', String(answered));
}

export function therapistScoreNote(refId = '', role = 'terapeuta') {
  return pick(THERAPIST, `therapist:${refId}`).replace('{role}', role);
}

export const LIVE_ATTENDANCE_NOTE = 'Presença registrada na live — obrigado por estar com a gente! (encontros ao vivo não somam pontos) 🎥';
