export const SCORE_DECIMAL_PLACES = 1;

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
