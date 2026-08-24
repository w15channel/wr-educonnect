// Início do histórico público solicitado para o Mural de Superação.
export const OVERCOMING_WALL_CUTOFF = new Date('2026-07-15T00:00:00.000Z').getTime();

const MSN_ACTION_PREFIXES = ['[MSN_ACTION]', '[MSN_ATTENTION]'];

export function isLegacyMsnAction(message) {
  const content = message?.content?.trim() || '';
  return MSN_ACTION_PREFIXES.some((prefix) => content.startsWith(prefix));
}

export function isSinceOvercomingWallCutoff(date) {
  if (!date) return false;
  const timestamp = new Date(date).getTime();
  return Number.isFinite(timestamp) && timestamp >= OVERCOMING_WALL_CUTOFF;
}
