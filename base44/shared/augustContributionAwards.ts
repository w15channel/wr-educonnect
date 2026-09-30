export const AUGUST_2026_CONTRIBUTORS = Object.freeze([
  'marih',
  'diane',
  'cristiane',
  'ageane',
  'lidiane',
  'andrezza',
]);

export const AUGUST_2026_AWARD_PREFIX = 'contribution:2026-08:';
export const AUGUST_2026_MESSAGE_PREFIX = 'august-2026-diamond:';

export const normalizeIdentity = (value: unknown) => String(value || '')
  .trim()
  .toLocaleLowerCase('pt-BR')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

export function contributorName(code: Record<string, unknown>) {
  return normalizeIdentity(code?.profile_name || code?.student_name).split(/\s+/)[0] || '';
}

export function isSelectedAugustContributor(code: Record<string, unknown>) {
  return AUGUST_2026_CONTRIBUTORS.includes(contributorName(code));
}

export function isAugust2026(value: unknown) {
  const reference = normalizeIdentity(value);
  return reference === '2026-08' || (reference.includes('agosto') && reference.includes('2026'));
}

export function augustAwardKey(email: unknown) {
  return `${AUGUST_2026_AWARD_PREFIX}${normalizeIdentity(email)}`;
}

export function augustMessageKey(email: unknown) {
  return `${AUGUST_2026_MESSAGE_PREFIX}${normalizeIdentity(email)}`;
}

export function isDiamondRecognitionPost(post: Record<string, unknown>) {
  const sourceId = String(post?.source_id || '');
  const copy = normalizeIdentity(`${post?.title || ''} ${post?.message || ''}`);
  return sourceId.startsWith(AUGUST_2026_MESSAGE_PREFIX)
    || copy.includes('diamante da contribuicao')
    || copy.includes('seu diamante');
}
