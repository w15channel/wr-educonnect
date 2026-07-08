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
