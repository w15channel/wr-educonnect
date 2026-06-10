/**
 * buildStudentAcademicData
 * ─────────────────────────
 * Computes a student's academic summary from raw entity data —
 * the same logic used by HistoricoAcademico — so it can be reused
 * by the certificate generator and any future consumer.
 *
 * @param {object} params
 * @param {string}   params.studentEmail
 * @param {Array}    params.scoreItems       - all ScoreItems (will be filtered)
 * @param {Array}    params.lessons          - RecordedLesson list for the course
 * @param {Array}    params.liveSessions     - LiveSession list for the course
 * @param {Array}    params.tasks            - Task list for the course
 * @param {Array}    params.pairings         - TherapistPairing list (all)
 * @returns {object} { rows, totalHours, totalScore, totalMaxScore, approvalRate, averageGrade, classes }
 */

export const HOURS_MAP = {
  lesson: 2,
  live_attendance: 2,
  task: 1,
  quiz: 1.5,
  forum: 0.5,
  therapist: 1,
};

function roundScore(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
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

  // averageGrade on a 0–10 scale using ratio
  const avgRaw = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 10 : 0;
  const averageGrade = String(Math.round(avgRaw * 10) / 10).replace('.', ',');

  // Build `classes` array for the certificate back page:
  // Group evaluated rows by category label with summed hours and averaged grade
  const categoryMap = {};
  evaluatedRows.forEach((r) => {
    if (!categoryMap[r.category]) {
      categoryMap[r.category] = { title: r.category, hours: 0, scoreSum: 0, maxSum: 0, count: 0 };
    }
    categoryMap[r.category].hours += r.hours;
    categoryMap[r.category].scoreSum += r.score !== null ? r.score : 0;
    categoryMap[r.category].maxSum += r.max;
    categoryMap[r.category].count += 1;
  });

  let uid = 0;
  const classes = Object.values(categoryMap).map((c) => {
    const gradeNum = c.maxSum > 0 ? (c.scoreSum / c.maxSum) * 10 : 0;
    const gradeStr = String(Math.round(gradeNum * 10) / 10).replace('.', ',');
    return { id: String(++uid), title: c.title, hours: c.hours, grade: gradeStr };
  });

  return { rows, totalHours, totalScore, totalMaxScore, approvalRate, averageGrade, classes };
}