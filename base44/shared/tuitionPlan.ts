/**
 * Plano de contribuição mensal definido pelo próprio aluno.
 *
 * O aluno escolhe o valor e o dia do vencimento; a plataforma passa a lançar a
 * mensalidade de cada mês já com essa data. Todas as datas são calculadas no
 * fuso de Brasília, para o dia escolhido não escorregar de mês.
 */

const TIME_ZONE = 'America/Sao_Paulo';

export const TUITION_DAYS = Array.from({ length: 28 }, (_, index) => index + 1);

function dateParts(date = new Date()) {
  const [year, month, day] = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date).split('-').map(Number);
  return { year, month, day };
}

const isoDate = (year, month, day) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

/** Hoje no formato AAAA-MM-DD (fuso de Brasília). */
export function todayInBrasilia(date = new Date()) {
  const { year, month, day } = dateParts(date);
  return isoDate(year, month, day);
}

/** Referência do mês no mesmo formato usado em Mensalidades: "Novembro - 2026". */
export function monthRefFor(date = new Date()) {
  const parts = new Intl.DateTimeFormat('pt-BR', { timeZone: TIME_ZONE, month: 'long', year: 'numeric' }).formatToParts(date);
  const month = parts.find((part) => part.type === 'month')?.value || '';
  const year = parts.find((part) => part.type === 'year')?.value || '';
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} - ${year}`;
}

/** Referência do mês de uma data AAAA-MM-DD. */
export function monthRefFromDate(isoDay) {
  const [year, month] = String(isoDay).split('-').map(Number);
  if (!year || !month) return monthRefFor();
  return monthRefFor(new Date(Date.UTC(year, month - 1, 15, 12)));
}

/** Chave comparável do mês: "2026-11". */
export function monthKey(date = new Date()) {
  const { year, month } = dateParts(date);
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function isValidDueDay(day) {
  const value = Number(day);
  return Number.isInteger(value) && value >= 1 && value <= 28;
}

export function normalizeAmount(value) {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100) / 100;
}

/** Vencimento no mês corrente, no dia escolhido pelo aluno. */
export function dueDateInCurrentMonth(day, date = new Date()) {
  const { year, month } = dateParts(date);
  return isoDate(year, month, Number(day));
}

/**
 * Primeiro vencimento do plano: o próximo dia escolhido que ainda não passou.
 * Quem escolhe o dia 5 no dia 11 começa a contribuir no mês seguinte.
 */
export function firstDueDate(day, date = new Date()) {
  const { year, month, day: today } = dateParts(date);
  if (Number(day) >= today) return isoDate(year, month, Number(day));
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return isoDate(nextYear, nextMonth, Number(day));
}