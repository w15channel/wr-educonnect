import { parseUtcDate } from '@/lib/scoreUtils';

/**
 * Atribuição de módulo por aluno.
 *
 * Todo aluno começa no Módulo 1, independentemente da data de ingresso. Quando o
 * admin libera o módulo seguinte (em /adm/scorecontrol), gravamos um
 * StudentModuleUnlock com o instante da liberação — a partir dele, tudo que o
 * aluno pontuar passa a valer para o novo módulo. Assim o histórico anterior
 * permanece no módulo em que foi feito, sem precisar reetiquetar registros.
 *
 * PRIORIDADE DE ATRIBUIÇÃO:
 * 1. module_number explícito no próprio ScoreItem (estampado pelo admin ou
 *    pela automação) — é a fonte autoritativa.
 * 2. fallbackModule (módulo da atividade de origem: lesson.module_number,
 *    task.module_number, exam.module_ref) — usado quando o ScoreItem não
 *    tem module_number, mas a atividade original pertence a um módulo claro.
 * 3. Linha do tempo de liberações do aluno (tempo) — usado apenas para
 *    atividades sem módulo próprio (fórum, ofensivas, etc.).
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

/**
 * Módulo de um ScoreItem.
 *
 * @param {object} item            - O ScoreItem (ou objeto com module_number/created_date).
 * @param {Array}  unlocks        - StudentModuleUnlock[] do aluno.
 * @param {number} [fallbackModule] - Módulo da atividade de origem (lesson/task/exam).
 *                                    Usado quando o ScoreItem não tem module_number.
 */
export function resolveItemModule(item, unlocks = [], fallbackModule = null) {
  // 1. module_number explícito no ScoreItem — autoritativo.
  const explicitModule = Number(item?.module_number);
  if (Number.isFinite(explicitModule) && explicitModule > 0) return explicitModule;

  // 2. Módulo da atividade de origem (lesson.module_number, task.module_number, etc.).
  const fallback = Number(fallbackModule);
  if (Number.isFinite(fallback) && fallback > 0) return fallback;

  // 3. Linha do tempo de liberações do aluno.
  return resolveStudentModuleAt(unlocks, item?.created_date);
}
