import { describe, expect, it } from 'vitest';
import { FALLBACK_MODULE_RELEASE_SCHEDULE, mergeModuleReleaseSchedules } from './moduleReleaseSchedule';

describe('calendário independente de liberação', () => {
  it('mantém as nove datas mesmo sem resposta da API', () => {
    expect(mergeModuleReleaseSchedules()).toEqual(FALLBACK_MODULE_RELEASE_SCHEDULE);
  });

  it('permite antecipar, mas não adiar, a data garantida', () => {
    const schedule = mergeModuleReleaseSchedules([
      { module_number: 2, release_at: '2026-10-01T00:00:00-03:00' },
      { module_number: 3, release_at: '2026-10-01T00:00:00-03:00' },
    ]);
    expect(schedule[0].release_at).toBe('2026-09-24T00:00:00-03:00');
    expect(schedule[1].release_at).toBe('2026-09-24T00:00:00-03:00');
  });

  it('ignora registros inválidos', () => {
    expect(mergeModuleReleaseSchedules([{ module_number: 11, release_at: 'inválida' }]))
      .toEqual(FALLBACK_MODULE_RELEASE_SCHEDULE);
  });
});
