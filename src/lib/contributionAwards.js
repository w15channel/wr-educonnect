export const DAY_MS = 24 * 60 * 60 * 1000;
export const CONTRIBUTION_STUDENT_FEATURE_DAYS = 15;
export const CONTRIBUTION_WALL_HIGHLIGHT_DAYS = 7;

export function hasPositiveContribution(tuition) {
  const value = Number(tuition?.paid_amount);
  return tuition?.status === 'paid' && Number.isFinite(value) && value > 0;
}

export function isActiveForDays(date, days, now = Date.now()) {
  const timestamp = new Date(date || 0).getTime();
  return Number.isFinite(timestamp) && timestamp <= now && now < timestamp + days * DAY_MS;
}

export function isContributionAwardFeatured(achievement, viewerEmail, now = Date.now()) {
  return achievement?.kind === 'tuition'
    && String(achievement.studentEmail || '').toLowerCase() === String(viewerEmail || '').toLowerCase()
    && isActiveForDays(achievement.occurredAt, CONTRIBUTION_STUDENT_FEATURE_DAYS, now);
}

export function isContributionWallHighlight(achievement, now = Date.now()) {
  return achievement?.kind === 'tuition'
    && isActiveForDays(achievement.occurredAt, CONTRIBUTION_WALL_HIGHLIGHT_DAYS, now);
}
