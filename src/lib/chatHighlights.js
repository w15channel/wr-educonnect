export const WEEKLY_HIGHLIGHT_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export const MONITOR_MEDALS = {
  1: { emoji: '🥇', label: '1º lugar', tone: 'gold' },
  2: { emoji: '🥈', label: '2º lugar', tone: 'silver' },
  3: { emoji: '🥉', label: '3º lugar', tone: 'bronze' },
};

export function highlightKey(item) {
  return `${item.feedType}:${item.id}`;
}

export function isWeeklyHighlight(item, readKeys = new Set(), now = Date.now()) {
  const isTherapist = item.feedType === 'personal' && item.source_type === 'therapist_pairing';
  const isMonitor = item.feedType === 'achievement' && item.isCollective && item.kind === 'monitor';
  const occurredAt = new Date(item.occurredAt || 0).getTime();
  return (isTherapist || isMonitor)
    && Number.isFinite(occurredAt)
    && now - occurredAt >= 0
    && now - occurredAt < WEEKLY_HIGHLIGHT_DURATION_MS
    && !readKeys.has(highlightKey(item));
}

export function splitWeeklyHighlights(feed, readKeys, now = Date.now()) {
  const pinned = [];
  const regular = [];
  feed.forEach((item) => (isWeeklyHighlight(item, readKeys, now) ? pinned : regular).push(item));
  return { pinned, regular };
}
