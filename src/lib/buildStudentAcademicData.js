/**
 * buildStudentAcademicData
 * ─────────────────────────
 * Computes a student's academic summary from raw entity data.
 * Used by HistoricoAcademico, AcademicItemSelector, and the certificate generator.
 *
 * GROUPING RULES (for `classes` / document output):
 *   - Aulas Gravadas  → grouped by module (lesson title prefix before " - " or first word)
 *                       label: "Módulo X — N aulas assistidas"
 *                       hours: sum; score: sum of points; max: sum of max
 *   - Trabalhos (task/quiz) → ONE row "Trabalhos de Classe"
 *                             hours: sum; score: sum; max: sum
 *   - Aulas ao Vivo → ONE row "Aulas ao Vivo"
 *                     hours: sum; score: sum; max: sum
 *   - Other categories → kept as-is
 *
 * HOURS_MAP (per item):
 *   lesson           → 2h
 *   live_attendance  → 2h
 *   task             → 0.5h  (30 min)
 *   quiz             → 1.5h
 *   forum            → 0.5h
 *   therapist        → 1h
 */

export const HOURS_MAP = {
  lesson: 2,
  live_attendance: 2,
  task: 0.5,
  quiz: 1.5,
  forum: 0.5,
  therapist: 1,
};

function roundScore(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
}

/**
 * Extract module label from a lesson title.
 * Tries to detect "Módulo X" or "Mod. X" prefix; falls back to first word.
 */
function extractModule(title) {
  if (!title) return 'Módulo';
  // Match "Módulo X", "Modulo X", "Mod. X", "Mod X" at the start (case-insensitive)
  const modMatch = title.match(/^(m[oó]d(?:ulo)?\.?\s*\d+)/i);
  if (modMatch) return modMatch[1].trim();
  // Alternatively split on " - " or " – "
  const dashMatch = title.split(/\s+[-–]\s+/)[0];
  if (dashMatch && dashMatch.length < 40) return dashMatch.trim();
  return title.slice(0, 30).trim();
}

export function buildStudentAcademicData({ studentEmail, scoreItems, lessons, liveSessions, tasks, pairings }) {
  const verifiedScores = scoreItems.filter(
    (s) => s.student_email === studentEmail && s.verified
  );

  const rows = [];

  // ── Aulas gravadas ──
  lessons.forEach((l) => {
    const si = verifiedScores.find((s) => s.category === 'lesson' && s.ref_id === l.id);
    rows.push({
      key: `lesson_${l.id}`,
      category: 'Aula Gravada',
      title: l.title,
      moduleLabel: extractModule(l.title),
      score: si?.score ?? null,
      max: 10,
      hours: HOURS_MAP.lesson,
      status: si ? 'Avaliado' : 'Pendente',
    });
  });

  // ── Aulas ao vivo ──
  liveSessions.forEach((l) => {
    const si = verifiedScores.find((s) => s.category === 'live_attendance' && s.ref_id === l.id);
    rows.push({
      key: `live_attendance_${l.id}`,
      category: 'Aula ao Vivo',
      title: l.title,
      score: si?.score ?? null,
      max: 1,
      hours: HOURS_MAP.live_attendance,
      status: si ? 'Avaliado' : 'Pendente',
    });
  });

  // ── Tarefas / Provas ──
  tasks.forEach((t) => {
    const cat = t.type === 'quiz' ? 'quiz' : 'task';
    const si = verifiedScores.find((s) => s.category === cat && s.ref_id === t.id);
    rows.push({
      key: `${cat}_${t.id}`,
      category: t.type === 'quiz' ? 'Prova' : 'Tarefa',
      title: t.title,
      score: si?.score ?? null,
      max: t.max_grade || 10,
      hours: t.type === 'quiz' ? HOURS_MAP.quiz : HOURS_MAP.task,
      status: si ? 'Avaliado' : 'Pendente',
    });
  });

  // ── Terapeuta da semana ──
  const myPairings = pairings.filter(
    (p) => p.therapist_email === studentEmail || p.patient_email === studentEmail
  );
  myPairings.forEach((p, i) => {
    const role = p.therapist_email === studentEmail ? 'Terapeuta' : 'Paciente';
    const si = verifiedScores.find((s) => s.category === 'therapist' && s.ref_id === p.id);
    rows.push({
      key: `therapist_${p.id}`,
      category: 'Terapia da Semana',
      title: `Sessão ${i + 1} (${role})`,
      score: si?.score ?? null,
      max: 10,
      hours: HOURS_MAP.therapist,
      status: si ? 'Avaliado' : 'Pendente',
    });
  });

  // ── Totals (only evaluated rows) ──
  const evaluatedRows = rows.filter((r) => r.status === 'Avaliado');
  const totalScore = evaluatedRows.reduce(
    (sum, r) => roundScore(sum + (r.score !== null ? roundScore(r.score) : 0)),
    0
  );
  const totalMaxScore = evaluatedRows.reduce((sum, r) => roundScore(sum + roundScore(r.max)), 0);
  const totalHours = evaluatedRows.reduce((sum, r) => sum + r.hours, 0);
  const approvalRate =
    totalMaxScore > 0
      ? String(Math.round((totalScore / totalMaxScore) * 1000) / 10)
      : '0';

  // notaTotal: sum of all points on a 0–N scale (NOT a mathematical average)
  const notaTotal = String(roundScore(totalScore)).replace('.', ',');

  // ── Build `classes` array for certificate back / historico document ──
  // Rules:
  //   1. task + quiz → ONE merged row "Trabalhos de Classe"
  //   2. live_attendance → ONE merged row "Aulas ao Vivo"
  //   3. lesson → grouped by module label (e.g. "Módulo 1")
  //   4. Others → per category

  const taskRows    = evaluatedRows.filter(r => r.category === 'Tarefa' || r.category === 'Prova');
  const liveRows    = evaluatedRows.filter(r => r.category === 'Aula ao Vivo');
  const lessonRows  = evaluatedRows.filter(r => r.category === 'Aula Gravada');
  const otherRows   = evaluatedRows.filter(r =>
    r.category !== 'Tarefa' && r.category !== 'Prova' &&
    r.category !== 'Aula ao Vivo' && r.category !== 'Aula Gravada'
  );

  let uid = 0;
  const classes = [];

  // Lessons grouped by module
  const moduleMap = {};
  lessonRows.forEach((r) => {
    const mod = r.moduleLabel || extractModule(r.title);
    if (!moduleMap[mod]) moduleMap[mod] = { hours: 0, scoreSum: 0, maxSum: 0, count: 0 };
    moduleMap[mod].hours    += r.hours;
    moduleMap[mod].scoreSum += r.score !== null ? r.score : 0;
    moduleMap[mod].maxSum   += r.max;
    moduleMap[mod].count    += 1;
  });
  Object.entries(moduleMap).forEach(([mod, data]) => {
    classes.push({
      id: String(++uid),
      title: `${mod} — ${data.count} aula${data.count > 1 ? 's' : ''} assistida${data.count > 1 ? 's' : ''}`,
      hours: data.hours,
      grade: String(roundScore(data.scoreSum)).replace('.', ','),
      pointsLabel: true, // signal to renderer that this is a points sum, not an average
    });
  });

  // Live sessions — single merged row
  if (liveRows.length > 0) {
    const liveHours = liveRows.reduce((s, r) => s + r.hours, 0);
    const liveScore = roundScore(liveRows.reduce((s, r) => s + (r.score !== null ? r.score : 0), 0));
    classes.push({
      id: String(++uid),
      title: `Aulas ao Vivo — ${liveRows.length} presença${liveRows.length > 1 ? 's' : ''} confirmada${liveRows.length > 1 ? 's' : ''}`,
      hours: liveHours,
      grade: String(liveScore).replace('.', ','),
      pointsLabel: true,
    });
  }

  // Tasks+Quizzes — single merged row
  if (taskRows.length > 0) {
    const taskHours = taskRows.reduce((s, r) => s + r.hours, 0);
    const taskScore = roundScore(taskRows.reduce((s, r) => s + (r.score !== null ? r.score : 0), 0));
    classes.push({
      id: String(++uid),
      title: `Trabalhos de Classe — ${taskRows.length} entrega${taskRows.length > 1 ? 's' : ''}`,
      hours: taskHours,
      grade: String(taskScore).replace('.', ','),
      pointsLabel: true,
    });
  }

  // Other categories (therapist, etc.) — per category as before
  const otherCatMap = {};
  otherRows.forEach((r) => {
    if (!otherCatMap[r.category]) otherCatMap[r.category] = { hours: 0, scoreSum: 0, maxSum: 0, count: 0 };
    otherCatMap[r.category].hours    += r.hours;
    otherCatMap[r.category].scoreSum += r.score !== null ? r.score : 0;
    otherCatMap[r.category].maxSum   += r.max;
    otherCatMap[r.category].count    += 1;
  });
  Object.entries(otherCatMap).forEach(([cat, data]) => {
    classes.push({
      id: String(++uid),
      title: cat,
      hours: data.hours,
      grade: String(roundScore(data.scoreSum)).replace('.', ','),
      pointsLabel: true,
    });
  });

  return { rows, totalHours, totalScore, totalMaxScore, approvalRate, notaTotal, classes };
}