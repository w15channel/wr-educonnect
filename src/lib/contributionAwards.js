export const DAY_MS = 24 * 60 * 60 * 1000;
export const CONTRIBUTION_STUDENT_FEATURE_DAYS = 15;
export const CONTRIBUTION_WALL_HIGHLIGHT_DAYS = 7;
export const MINIMUM_DIAMOND_CONTRIBUTION = 10;

export function hasPositiveContribution(tuition) {
  const value = Number(tuition?.paid_amount);
  return tuition?.status === 'paid' && Number.isFinite(value) && value > MINIMUM_DIAMOND_CONTRIBUTION;
}

const contributionPeriod = (tuition) => String(tuition?.month_ref || tuition?.due_date || '').trim();

/**
 * Retorna uma contribuição por aluno para o período mais recente lançado.
 * O período é calculado com todas as mensalidades (inclusive pendentes), para
 * não premiar por engano um pagamento antigo enquanto o mês atual está aberto.
 */
export function getLatestContributors(tuitions = []) {
  const periods = tuitions.map(contributionPeriod).filter(Boolean);
  if (!periods.length) return [];
  const latestPeriod = [...periods].sort((a, b) => b.localeCompare(a))[0];
  const seen = new Set();
  return tuitions.filter((tuition) => {
    const email = String(tuition?.student_email || '').trim().toLowerCase();
    if (contributionPeriod(tuition) !== latestPeriod || !email || seen.has(email) || !hasPositiveContribution(tuition)) return false;
    seen.add(email);
    return true;
  });
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
