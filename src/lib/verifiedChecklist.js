// Fresh live records take precedence; the audit supplements missed identities and pagination.
export function mergeVerifiedTuitions(live = [], verified = []) {
  const rows = new Map(verified.map(row => [row.id, row]));
  for (const row of live) {
    const saved = rows.get(row.id);
    if (!saved || Date.parse(row.updated_date || row.created_date) >= Date.parse(saved.updated_date || saved.created_date)) rows.set(row.id, row);
  }
  return [...rows.values()].sort((a, b) => Date.parse(b.created_date) - Date.parse(a.created_date));
}

export function applyChecklistVerification(checklist, verification, { taskIds = [], previousExamIds = [] } = {}) {
  if (!verification) return checklist;
  const sameIds = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...(b || [])].sort());
  const items = checklist.items.map(item => {
    if (item.key.startsWith('tuition')) return item; // Only the actual administrative payment status counts.
    if (item.key === 'tasks' && !sameIds(taskIds, verification.task_ids)) return item;
    if (item.key === 'previous_exam' && !sameIds(previousExamIds, verification.previous_exam_ids)) return item;
    const confirmed = verification.items?.find(row => row.key === item.key && row.target === item.target);
    if (!confirmed) return item;
    const current = Math.max(item.current, confirmed.current);
    return { ...item, current, done: current >= item.target };
  });
  return { ...checklist, items, complete: items.every(item => item.done), doneCount: items.filter(item => item.done).length };
}