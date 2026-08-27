import { parseUtcDate } from '@/lib/scoreUtils';

/**
 * Atribuição de módulo por aluno.
 *
 * Todo aluno começa no Módulo 1, independentemente da data de ingresso. Quando o
 * admin libera o módulo seguinte (em /adm/scorecontrol), gravamos um
 * StudentModuleUnlock com o instante da liberação — a partir dele, tudo que o
 * aluno pontuar passa a valer para o novo módulo. Assim o histórico anterior
 * permanece no módulo em que foi feito, sem precisar reetiquetar registros.
 */
export function groupUnlocksByEmail(unlocks = []) {
  const map = new Map();
  unlocks.forEach((unlock) => {
    const email = unlock?.student_email;
    if (!email) return;
    if (!map.has(email)) map.set(email, []);
    map.get(email).push(unlock);
  });
  return map;
}

export function resolveStudentModuleAt(unlocks = [], dateStr) {
  const at = parseUtcDate(dateStr) || new Date();
  let moduleNumber = 1;
  unlocks.forEach((unlock) => {
    const unlockedAt = parseUtcDate(unlock?.unlocked_at);
    const number = Number(unlock?.module_number) || 0;
    if (unlockedAt && unlockedAt <= at && number > moduleNumber) moduleNumber = number;
  });
  return moduleNumber;
}

export function resolveCurrentStudentModule(unlocks = []) {
  return resolveStudentModuleAt(unlocks, new Date().toISOString());
}

/** Módulo de um ScoreItem: o módulo liberado ao aluno quando ele pontuou. */
export function resolveItemModule(item, unlocks = []) {
  return resolveStudentModuleAt(unlocks, item?.created_date);
}
