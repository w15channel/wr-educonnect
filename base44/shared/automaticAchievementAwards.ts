export const TROPHY_PREFIX = 'module-trophy:';
const norm = value => String(value || '').trim().toLowerCase();
const day = 86400000;
const validDate = value => Number.isFinite(Date.parse(value));

export function contributionAward(tuition, student, now) {
  const amount = Number(tuition.paid_amount);
  if (tuition.status !== 'paid' || !Number.isFinite(amount) || amount <= 10) return null;
  const occurredAt = validDate(tuition.paid_date) ? new Date(`${tuition.paid_date.slice(0, 10)}T12:00:00-03:00`).toISOString() : now;
  return {
    dedupe_key: `tuition:${tuition.id}`, student_email: norm(student.email), course: student.course,
    kind: 'tuition', title: 'Diamante da Contribuição',
    message: 'conquistou o Diamante da Contribuição por apoiar voluntariamente nossa comunidade. 💎',
    mentioned_emails: [norm(student.email)], source_id: tuition.id, occurred_at: occurredAt,
    student_feature_until: new Date(Date.parse(occurredAt) + 15 * day).toISOString(),
    wall_highlight_until: new Date(Date.parse(occurredAt) + 7 * day).toISOString(),
  };
}

export function verifiedModuleAwards(student, verification, data, now) {
  const owns = row => student.aliases.includes(norm(row.student_email || row.author_email));
  return verification.modules.filter(module => module.complete && module.examDone && module.items.length > 0 && module.items.every(item => item.done)).map(module => {
    const proofIds = new Set(module.items.flatMap(item => item.source_ids || []));
    const evidence = Object.values(data).flat().filter(row => owns(row) && (proofIds.has(row.id) || (module.exam_ids || []).includes(row.exam_id)));
    const times = evidence.map(row => row.submitted_at || row.updated_date || row.created_date).filter(validDate);
    const occurredAt = times.length ? new Date(Math.max(...times.map(Date.parse))).toISOString() : now;
    return {
      dedupe_key: `${TROPHY_PREFIX}${student.course}:${norm(student.email)}:${module.moduleNumber}`,
      student_email: norm(student.email), course: student.course, kind: 'module', source_id: `mod${module.moduleNumber}`,
      title: `Troféu do Módulo ${module.moduleNumber}`, occurred_at: occurredAt,
      message: `concluiu o checklist e enviou a prova do Módulo ${module.moduleNumber}, conquistando seu troféu. 🏆`,
    };
  });
}

export async function saveAutomaticAwards(store, candidates, dryRun = false) {
  const records = [...new Map(candidates.map(row => [row.dedupe_key, row])).values()];
  let granted = 0;
  for (let offset = 0; records.length > offset; offset += 50) {
    const batch = records.slice(offset, offset + 50);
    const page = await store.Achievement.filter({ dedupe_key: { $in: batch.map(row => row.dedupe_key) } }, { distinct: 'dedupe_key', limit: 50 });
    const known = new Set(page.items);
    const missing = batch.filter(row => !known.has(row.dedupe_key));
    if (!dryRun && missing.length) {
      const result = await store.Achievement.upsert(missing, { key: 'dedupe_key' });
      granted += result.created;
    } else granted += missing.length;
    if (records.length > offset + 50) await new Promise(resolve => setTimeout(resolve, 250));
  }
  return granted;
}