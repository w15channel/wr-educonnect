const brazilParts = (date = new Date()) => Object.fromEntries(
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)])
);

const shiftMonth = (year, month, amount) => {
  const shifted = new Date(Date.UTC(year, month - 1 + amount, 15));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}`;
};

export function getTuitionPeriodRef(date = new Date()) {
  const { year, month, day } = brazilParts(date);
  return shiftMonth(year, month, day >= 5 ? 0 : -1);
}

export function formatTuitionPeriod(ref) {
  const [year, month] = String(ref || '').split('-').map(Number);
  if (!year || !month) return ref || '';
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, 15)));
}