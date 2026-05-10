const NUMERIC_FIELDS = ['order', 'sequence', 'position', 'lesson_number', 'module_order', 'sort_order'];
const DATE_FIELDS = ['scheduled_at', 'deadline', 'pairing_date', 'created_date', 'updated_date', 'confirmed_at'];

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function extractSequenceNumber(item) {
  for (const field of NUMERIC_FIELDS) {
    const value = toFiniteNumber(item?.[field]);
    if (value !== null) return value;
  }

  const text = [item?.title, item?.ref_title, item?.topic, item?.content]
    .filter(Boolean)
    .join(' ');
  const match = text.match(/(?:^|\b)(?:aula|live|presen[cç]a|tarefa|atividade|prova|f[oó]rum|sess[aã]o|terapeuta)?\s*(\d{1,4})(?:[ªº°\-.\s]|$)/i);
  return match ? Number(match[1]) : null;
}

export function extractChronologicalTime(item) {
  for (const field of DATE_FIELDS) {
    if (!item?.[field]) continue;
    const time = new Date(item[field]).getTime();
    if (Number.isFinite(time)) return time;
  }
  return Number.MAX_SAFE_INTEGER;
}

export function compareSequencedItems(a, b) {
  const aNumber = extractSequenceNumber(a);
  const bNumber = extractSequenceNumber(b);

  if (aNumber !== null && bNumber !== null && aNumber !== bNumber) {
    return aNumber - bNumber;
  }

  if (aNumber !== null && bNumber === null) return -1;
  if (aNumber === null && bNumber !== null) return 1;

  const aTime = extractChronologicalTime(a);
  const bTime = extractChronologicalTime(b);
  if (aTime !== bTime) return aTime - bTime;

  const aText = String(a?.title || a?.ref_title || a?.topic || a?.content || '');
  const bText = String(b?.title || b?.ref_title || b?.topic || b?.content || '');
  return aText.localeCompare(bText, 'pt-BR', { numeric: true, sensitivity: 'base' });
}

export function sortBySequence(items = []) {
  return [...items].sort(compareSequencedItems);
}
