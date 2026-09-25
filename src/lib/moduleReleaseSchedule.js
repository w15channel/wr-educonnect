/**
 * Calendário de contingência das liberações de 2026.
 *
 * Esta cópia local é deliberada: o acesso do aluno não pode depender da
 * execução de uma automação paga nem da disponibilidade da API. Os registros
 * de ModuleReleaseSchedule continuam sendo lidos, mas nunca podem adiar uma
 * data já garantida por este calendário.
 */
export const FALLBACK_MODULE_RELEASE_SCHEDULE = Object.freeze([
  { module_number: 2, release_at: '2026-09-24T00:00:00-03:00' },
  { module_number: 3, release_at: '2026-10-03T00:00:00-03:00' },
  { module_number: 4, release_at: '2026-10-11T00:00:00-03:00' },
  { module_number: 5, release_at: '2026-10-20T00:00:00-03:00' },
  { module_number: 6, release_at: '2026-10-28T00:00:00-03:00' },
  { module_number: 7, release_at: '2026-11-06T00:00:00-03:00' },
  { module_number: 8, release_at: '2026-11-14T00:00:00-03:00' },
  { module_number: 9, release_at: '2026-11-23T00:00:00-03:00' },
  { module_number: 10, release_at: '2026-12-01T00:00:00-03:00' },
]);

export function mergeModuleReleaseSchedules(remoteSchedule = []) {
  const releases = new Map(FALLBACK_MODULE_RELEASE_SCHEDULE.map(item => [item.module_number, item]));

  for (const item of remoteSchedule) {
    const moduleNumber = Number(item?.module_number);
    const releaseTime = Date.parse(item?.release_at);
    if (moduleNumber < 2 || moduleNumber > 10 || !Number.isFinite(releaseTime)) continue;

    const fallback = releases.get(moduleNumber);
    // A ferramenta de calendário pode antecipar a liberação, nunca atrasá-la.
    if (!fallback || releaseTime < Date.parse(fallback.release_at)) {
      releases.set(moduleNumber, { ...item, module_number: moduleNumber });
    }
  }

  return [...releases.values()].sort((a, b) => a.module_number - b.module_number);
}
