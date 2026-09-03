import { describe, expect, it } from 'vitest';
import { highlightKey, isWeeklyHighlight, splitWeeklyHighlights } from './chatHighlights';

const now = new Date('2026-09-03T12:00:00Z').getTime();
const monitor = { id: 'm1', feedType: 'achievement', isCollective: true, kind: 'monitor', occurredAt: '2026-09-01T12:00:00Z' };

describe('destaques semanais do chat', () => {
  it('fixa monitoria recente e não lida', () => expect(isWeeklyHighlight(monitor, new Set(), now)).toBe(true));
  it('remove lidos e itens com mais de sete dias', () => {
    expect(isWeeklyHighlight(monitor, new Set([highlightKey(monitor)]), now)).toBe(false);
    expect(isWeeklyHighlight({ ...monitor, occurredAt: '2026-08-20T12:00:00Z' }, new Set(), now)).toBe(false);
  });
  it('mantém os fixados antes do restante do feed', () => {
    const ordinary = { id: 'post', feedType: 'encouragement', occurredAt: '2026-09-03T11:00:00Z' };
    expect(splitWeeklyHighlights([ordinary, monitor], new Set(), now)).toEqual({ pinned: [monitor], regular: [ordinary] });
  });
});
