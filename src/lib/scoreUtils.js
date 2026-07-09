export const SCORE_DECIMAL_PLACES = 1;

export const SCORE_RULES = {
  lesson: 2,
  task: 5,
  quiz: 50,
  exam: 50,
  therapist: 10,
  liveAttendance: 0,
};

export function roundScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round((numeric + Number.EPSILON) * 10) / 10;
}

export function sumRoundedScores(values) {
  return values.reduce((total, value) => roundScore(total + roundScore(value)), 0);
}

export function formatScore(value, decimalPlaces = SCORE_DECIMAL_PLACES) {
  return roundScore(value).toFixed(decimalPlaces).replace('.', ',');
}

export function isTherapistScoreItem(item) {
  return item?.category === 'therapist' || String(item?.ref_id || '').startsWith('therapist_pairing:');
}

export function isStudyScoreItem(item) {
  return ['lesson', 'task', 'quiz', 'exam'].includes(item?.category) && !isTherapistScoreItem(item);
}

export function rankingScoreValue(item) {
  if (item?.category === 'live_attendance') return 0;
  return roundScore(item?.score);
}

// Registros salvos pela plataforma vêm sem sufixo de fuso (ex: "2026-07-09T17:11:57.279000"),
// o que faz o navegador interpretar como horário LOCAL do usuário em vez de UTC — deslocando a
// data por horas dependendo do fuso do aluno. Datas geradas por nós (ex: closure.closed_at via
// toISOString()) já vêm com "Z". Esta função força a interpretação como UTC quando não há
// indicador de fuso, garantindo comparações de corte de período consistentes para todos.
export function parseUtcDate(dateStr) {
  if (!dateStr) return null;
  const hasTimezone = /Z$|[+-]\d{2}:?\d{2}$/i.test(dateStr);
  const normalized = hasTimezone ? dateStr : `${dateStr}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}