import { describe, expect, it } from 'vitest';
import {
  highlightKey,
  isWeeklyHighlight,
  splitWeeklyHighlights,
  WEEKLY_HIGHLIGHT_DURATION_MS,
} from './chatHighlights';

const now = new Date('2026-09-03T12:00:00Z').getTime();
const monitor = { id: 'm1', feedType: 'achievement', isCollective: true, kind: 'monitor', occurredAt: '2026-09-01T12:00:00Z' };

describe('destaques semanais do chat', () => {
  it('fixa monitoria recente e não lida', () => expect(isWeeklyHighlight(monitor, new Set(), now)).toBe(true));
  it('remove lidos e itens com mais de sete dias', () => {
    expect(isWeeklyHighlight(monitor, new Set([highlightKey(monitor)]), now)).toBe(false);
    expect(isWeeklyHighlight({ ...monitor, occurredAt: '2026-08-20T12:00:00Z' }, new Set(), now)).toBe(false);
  });
  it('fixa avisos recentes de dupla terapêutica', () => {
    const pairing = { id: 'pair-1', feedType: 'personal', source_type: 'therapist_pairing', occurredAt: '2026-09-02T12:00:00Z' };
    expect(isWeeklyHighlight(pairing, new Set(), now)).toBe(true);
  });
  it('não fixa itens futuros nem no limite exato de sete dias', () => {
    expect(isWeeklyHighlight({ ...monitor, occurredAt: new Date(now + 1).toISOString() }, new Set(), now)).toBe(false);
    expect(isWeeklyHighlight({ ...monitor, occurredAt: new Date(now - WEEKLY_HIGHLIGHT_DURATION_MS).toISOString() }, new Set(), now)).toBe(false);
  });
  it('mantém os fixados antes do restante do feed', () => {
    const ordinary = { id: 'post', feedType: 'encouragement', occurredAt: '2026-09-03T11:00:00Z' };
    expect(splitWeeklyHighlights([ordinary, monitor], new Set(), now)).toEqual({ pinned: [monitor], regular: [ordinary] });
  });
});
