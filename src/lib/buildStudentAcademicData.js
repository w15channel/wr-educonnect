/**
 * buildStudentAcademicData
 * ─────────────────────────
 * Computes a student's academic summary from raw entity data.
 * Used by HistoricoAcademico, CertificateGenerator, and AcademicItemSelector.
 *
 * @param {object} params
 * @param {string}   params.studentEmail
 * @param {Array}    params.scoreItems         - all ScoreItems (filtered internally)
 * @param {Array}    params.lessons            - RecordedLesson list for the course
 * @param {Array}    params.liveSessions       - LiveSession list for the course
 * @param {Array}    params.tasks              - Task list for the course
 * @param {Array}    params.exams              - Exam list for the course
 * @param {Array}    params.examSubs           - ExamSubmission list for the student
 * @param {Array}    params.pairings           - TherapistPairing list (all)
 * @param {Array}    [params.challengeResponses] - DailyChallengeResponse list (all)
 * @returns {object} { rows, totalHours, totalScore, totalMaxScore, approvalRate, averageGrade, classes }
 */

export const HOURS_MAP = {
  lesson: 2,
  live_attendance: 2,
  task: 0.5,   // 30 minutos por entrega
  quiz: 1.5,
  exam: 2,     // 2 horas por prova
  forum: 0.5,
  therapist: 1,
  ofensiva: 0, // pontos apenas, sem CH
};

function roundScore(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
}

export function buildStudentAcademicData({
  studentEmail,
  scoreItems,
  lessons,
  liveSessions,
  tasks,
  exams = [],
  examSubs = [],
  pairings,
  challengeResponses = [],
}) {
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
      notes: si?.notes || '',
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
      notes: si?.notes || '',
    });
  });

  // ── Tarefas / Provas (Task entity) ──
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
      notes: si?.notes || '',
    });
  });

  // ── Provas (Exam entity via ExamSubmission) ──
  if (exams && exams.length > 0 && examSubs && examSubs.length > 0) {
    examSubs.forEach((sub) => {
      const exam = exams.find((e) => e.id === sub.exam_id);
      if (!exam || sub.status !== 'graded') return;
      const si = verifiedScores.find((s) => s.category === 'exam' && s.ref_id === exam.id);
      rows.push({
        key: `exam_${exam.id}`,
        category: 'Prova',
        title: exam.title,
        score: sub.grade ?? si?.score ?? null,
        max: exam.max_grade || 10,
        hours: HOURS_MAP.exam,
        status: 'Avaliado',
        notes: sub.feedback || si?.notes || '',
      });
    });
  }

  // ── Terapeuta da semana (via ScoreItems de categoria task com ref therapist_pairing:) ──
  const myPairings = pairings.filter(
    (p) => p.therapist_email === studentEmail || p.patient_email === studentEmail
  );
  myPairings.forEach((p, i) => {
    const role = p.therapist_email === studentEmail ? 'Terapeuta' : 'Paciente';
    const refId = `therapist_pairing:${p.id}:${role === 'Terapeuta' ? 'therapist' : 'patient'}`;
    const si = verifiedScores.find((s) => s.category === 'task' && s.ref_id === refId);
    rows.push({
      key: `therapist_${p.id}_${role}`,
      category: 'Terapia da Semana',
      title: `Sessão ${i + 1} (${role})`,
      score: si?.score ?? null,
      max: 10,
      hours: HOURS_MAP.therapist,
      status: si ? 'Avaliado' : 'Pendente',
      notes: si?.notes || '',
    });
  });

  // ── Ofensivas Diárias ──
  const myResponses = challengeResponses.filter(
    (r) => r.student_email === studentEmail && (r.points_earned || 0) > 0
  );
  myResponses.forEach((r) => {
    const refId = `ofensiva:${r.challenge_id}:${r.student_email}`;
    // Procura também pelo ScoreItem correspondente (categoria forum, ref_id = refId)
    const si = verifiedScores.find((s) => s.category === 'forum' && s.ref_id === refId);
    rows.push({
      key: `ofensiva_${r.challenge_id}`,
      category: 'Ofensiva Diária',
      title: `Ofensiva ${r.date || 'sem data'}`,
      score: si?.score ?? roundScore(r.points_earned || 0),
      max: si?.max_score ?? 1,
      hours: HOURS_MAP.ofensiva,
      status: 'Avaliado',
      notes: si?.notes || `${r.questions_answered || 0} perguntas respondidas`,
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

  // averageGrade = nota total (soma dos pontos obtidos, não uma média)
  const averageGrade = String(Math.round(totalScore * 10) / 10).replace('.', ',');

  // ── classes para verso do certificado ──
  // Aulas Gravadas: listadas individualmente
  // Aulas ao Vivo:  uma linha única "Aulas ao Vivo" com somatória
  // Tarefas:        uma linha única "Tarefas de Classe" com somatória
  // Provas:         uma linha única "Provas" com somatória
  // Terapia da Semana: uma linha única com somatória
  // Ofensivas:      uma linha única "Ofensivas Diárias" com somatória

  const GROUPED_CATEGORIES = new Set(['Aula ao Vivo', 'Tarefa', 'Prova', 'Terapia da Semana', 'Ofensiva Diária']);
  const GROUP_LABELS = {
    'Aula ao Vivo': 'Aulas ao Vivo',
    'Tarefa': 'Tarefas de Classe',
    'Prova': 'Provas',
    'Terapia da Semana': 'Terapia da Semana',
    'Ofensiva Diária': 'Ofensivas Diárias',
  };

  const classesMap = {}; // key -> { title, hours, scoreSum, maxSum }
  let uid = 0;

  evaluatedRows.forEach((r) => {
    if (r.category === 'Aula Gravada') {
      // individual
      uid++;
      classesMap[`individual_${uid}`] = {
        title: r.title,
        hours: r.hours,
        scoreSum: r.score !== null ? r.score : 0,
        maxSum: r.max,
        id: String(uid),
      };
    } else if (GROUPED_CATEGORIES.has(r.category)) {
      const groupKey = `group_${r.category}`;
      if (!classesMap[groupKey]) {
        uid++;
        classesMap[groupKey] = {
          title: GROUP_LABELS[r.category] || r.category,
          hours: 0,
          scoreSum: 0,
          maxSum: 0,
          id: String(uid),
        };
      }
      classesMap[groupKey].hours += r.hours;
      classesMap[groupKey].scoreSum += r.score !== null ? r.score : 0;
      classesMap[groupKey].maxSum += r.max;
    }
  });

  const classes = Object.values(classesMap).map((c) => ({
    id: c.id,
    title: c.title,
    hours: c.hours,
    // Nota total = soma dos pontos (não média)
    grade: String(Math.round(c.scoreSum * 10) / 10).replace('.', ','),
  }));

  return { rows, totalHours, totalScore, totalMaxScore, approvalRate, averageGrade, classes };
}