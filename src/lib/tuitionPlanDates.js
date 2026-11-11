export const TUITION_DAYS = Array.from({ length: 28 }, (_, index) => index + 1);

/** Hoje no formato AAAA-MM-DD, no fuso de Brasília. */
export function todayIso(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  return parts;
}

export function formatCurrency(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatShortDate(isoDay) {
  const [year, month, day] = String(isoDay || '').slice(0, 10).split('-');
  if (!year || !month || !day) return '';
  return `${day}/${month}/${year}`;
}