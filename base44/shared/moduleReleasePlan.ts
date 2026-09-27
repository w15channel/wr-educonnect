export const pause = () => new Promise(resolve => setTimeout(resolve, 250));

export const FALLBACK_MODULE_RELEASE_SCHEDULE = [
  '2026-09-24', '2026-09-24', '2026-09-24', '2026-09-24', '2026-10-28',
  '2026-11-06', '2026-11-14', '2026-11-23', '2026-12-01',
].map((date, index) => ({ module_number: index + 2, release_at: `${date}T00:00:00-03:00` }));

export function completeReleaseSchedule(schedule = []) {
  const releases = new Map(FALLBACK_MODULE_RELEASE_SCHEDULE.map(item => [item.module_number, item]));
  for (const item of schedule) {
    const module = Number(item?.module_number);
    const time = Date.parse(item?.release_at);
    const fallback = releases.get(module);
    if (module >= 2 && module <= 10 && Number.isFinite(time) && (!fallback || time < Date.parse(fallback.release_at))) {
      releases.set(module, { ...item, module_number: module });
    }
  }
  return [...releases.values()].sort((a, b) => a.module_number - b.module_number);
}

export async function readAll(entity, filter = {}) {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const page = await entity.filter(filter, 'created_date', 500, offset);
    rows.push(...page);
    await pause();
    if (page.length < 500) return rows;
  }
}

// Somente a migração inicial preserva o acesso concedido pela regra antiga.
export function hadLegacyModuleTwo(code, data) {
  const course = code.course || 'tcc';
  const email = code.student_email || code.code;
  const courseLessons = data.lessons.filter(l => (l.course || 'tcc') === course && !l.is_hidden).sort((a, b) => (a.order || 0) - (b.order || 0)).slice(0, 5);
  const tasks = data.tasks.filter(t => (t.course || 'tcc') === course && !t.is_hidden && Number(t.module_number) === 1);
  const exams = data.exams.filter(e => (e.course || 'tcc') === course && e.is_published !== false && Number(String(e.module_ref || '').match(/\d+/)?.[0]) === 1);
  return exams.length > 0 && exams.every(e => data.examSubs.some(s => s.student_email === email && s.exam_id === e.id))
    && courseLessons.every(l => data.progress.some(p => p.student_email === email && p.lesson_id === l.id && p.watched))
    && tasks.every(t => data.submissions.some(s => s.student_email === email && s.task_id === t.id));
}

export function planModuleReleases(codes, unlocks, schedule, now, initialData = null) {
  const key = (email, course, module) => `${email}|${course || 'tcc'}|${module}`;
  const existing = new Set(unlocks.map(u => key(u.student_email, u.course, Number(u.module_number))));
  const due = schedule.filter(s => Date.parse(s.release_at) <= Date.parse(now));
  const records = [];
  for (const code of codes) {
    const email = code.student_email || code.code;
    if (!email) continue;
    const course = code.course || 'tcc';
    const add = (module, at, reason) => {
      const id = key(email, course, module);
      if (existing.has(id)) return;
      existing.add(id);
      records.push({ student_email: email, student_name: code.profile_name || code.student_name || email, course, module_number: module, unlocked_at: at, unlocked_by: reason });
    };
    if (initialData && !existing.has(key(email, course, 2))) {
      const profile = initialData.profiles.find(p => p.student_email === email && p.dashboard_course === course);
      const total = Number(code.pontuacao_total ?? profile?.pontuacao_total ?? profile?.points ?? 0);
      if (total >= 50 || hadLegacyModuleTwo(code, initialData)) add(2, now, total >= 50 ? 'sistema:transicao-50-pontos' : 'sistema:acesso-anterior');
    }
    for (const release of due) add(Number(release.module_number), release.release_at, 'sistema:calendario-2026');
  }
  return records;
}
