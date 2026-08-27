/**
 * academicModules
 * ───────────────
 * Identifica a qual módulo (1-10) uma atividade pertence.
 *
 * Toda atividade da plataforma precisa estar vinculada a um único módulo para
 * que o histórico do aluno não conte a mesma atividade em mais de um módulo.
 * Quando a atividade não traz o módulo gravado (fórum, debates, ofensivas
 * antigas etc.), usamos a janela de datas dos encerramentos de módulo
 * (ModuleClosure) e, em último caso, o módulo 1.
 */

export const DEFAULT_MODULE = 1;

/** Extrai o número do módulo de textos como "mod3", "Módulo 3", "mod10-a2". */
export function parseModuleNumber(value) {
  const match = String(value ?? '').match(/(\d{1,2})/);
  const parsed = match ? Number(match[1]) : NaN;
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 10 ? parsed : null;
}

const toTime = (value) => {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
};

/**
 * Descobre o módulo de uma atividade pela data em que ela aconteceu,
 * usando os períodos cadastrados nos encerramentos de módulo.
 */
export function resolveModuleByDate(dateValue, moduleClosures = []) {
  const time = toTime(dateValue);
  if (time === null) return null;

  const windows = moduleClosures
    .map((closure) => ({
      module: parseModuleNumber(closure.module_number),
      start: toTime(closure.period_start),
      end: toTime(closure.period_end) ?? toTime(closure.closed_at),
    }))
    .filter((w) => w.module)
    .sort((a, b) => (a.start ?? 0) - (b.start ?? 0));

  const inside = windows.find((w) => (w.start === null || time >= w.start) && (w.end === null || time <= w.end));
  if (inside) return inside.module;

  // Depois do último encerramento, a atividade pertence ao módulo seguinte.
  const last = windows[windows.length - 1];
  if (last && last.end !== null && time > last.end) {
    return Math.min(last.module + 1, 10);
  }
  return null;
}

/** Módulo definitivo da atividade — nunca nulo, para evitar duplicidade. */
export function resolveActivityModule({ explicitModule, dateValue, moduleClosures = [] }) {
  return (
    parseModuleNumber(explicitModule) ||
    resolveModuleByDate(dateValue, moduleClosures) ||
    DEFAULT_MODULE
  );
}