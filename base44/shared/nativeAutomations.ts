/**
 * Motor de automação nativo do WR-EDU.
 *
 * Regras puras, sem IA e sem integrações: recebem os registros já lidos do banco
 * e devolvem apenas o que precisa mudar. Assim o app se mantém atualizado por
 * código próprio, sem depender de automações externas, workflows ou créditos.
 */

/** Um aluno é considerado offline após este tempo sem sinal de presença. */
export const PRESENCE_WINDOW_MS = 5 * 60 * 1000;

/** Data de hoje (UTC) no formato usado pelos campos de data: AAAA-MM-DD. */
export function referenceDay(date: Date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/**
 * Regra: situação das mensalidades.
 * Vencida e ainda não paga vira "inadimplente".
 * Com vencimento futuro e não paga volta a "pendente" (caso o vencimento seja remarcado).
 * Registros pagos nunca são tocados.
 */
export function tuitionStatusChanges(tuitions, day: string = referenceDay()) {
  const changes = [];
  for (const tuition of tuitions || []) {
    if (!tuition?.id || !tuition.due_date) continue;
    if (tuition.status === 'paid') continue;
    const dueDate = String(tuition.due_date).slice(0, 10);
    const late = dueDate < day;
    if (late && tuition.status !== 'overdue') changes.push({ id: tuition.id, status: 'overdue' });
    else if (!late && tuition.status === 'overdue') changes.push({ id: tuition.id, status: 'pending' });
  }
  return changes;
}

/**
 * Regra: presença online.
 * Quando o aluno fecha o navegador sem avisar, o código de acesso fica marcado
 * como "online" para sempre. Aqui ele volta a offline após o tempo de tolerância.
 */
export function stalePresenceIds(codes, nowMs: number = Date.now(), windowMs: number = PRESENCE_WINDOW_MS) {
  return (codes || [])
    .filter((code) => code?.id && code.is_online === true)
    .filter((code) => {
      const seen = Date.parse(code.last_seen_at || code.last_login || '');
      return !Number.isFinite(seen) || nowMs - seen > windowMs;
    })
    .map((code) => code.id);
}