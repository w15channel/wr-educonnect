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
 * @param {Array}    params.tasks              - Task list for the course
 * @param {Array}    params.exams              - Exam list for the course
 * @param {Array}    params.examSubs           - ExamSubmission list for the student
 * @param {Array}    params.pairings           - TherapistPairing list (all)
 * @param {Array}    [params.challengeResponses] - DailyChallengeResponse list (all)
 * @returns {object} { rows, totalHours, totalScore, totalMaxScore, approvalRate, averageGrade, classes }
 */

export const HOURS_MAP = {
  lesson: 2,
  task: 0.5,   // 30 minutos por entrega
  quiz: 1.5,
  exam: 2,     // 2 horas por prova
  forum: 0.5,
  therapist: 1,
  ofensiva: 0, // pontos apenas, sem CH
};

export const STUDY_SCORE_RULES = {
  lesson: 2,
  task: 5,
  quiz: 50,
  exam: 50,
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
      max: STUDY_SCORE_RULES.lesson,
      hours: HOURS_MAP.lesson,
      status: si ? 'Avaliado' : 'Pendente',
      notes: si?.notes || '',
      module: Number(l.module_number) || null,
    });
  });

  // Lives não entram na pontuação de estudos/histórico/certificado.

  // ── Tarefas / Provas (Task entity) ──
  tasks.forEach((t) => {
    const cat = t.type === 'quiz' ? 'quiz' : 'task';
    const si = verifiedScores.find((s) => s.category === cat && s.ref_id === t.id);
    rows.push({
      key: `${cat}_${t.id}`,
      category: t.type === 'quiz' ? 'Prova' : 'Tarefa',
      title: t.title,
      score: si?.score ?? null,
      max: t.type === 'quiz' ? STUDY_SCORE_RULES.quiz : STUDY_SCORE_RULES.task,
      hours: t.type === 'quiz' ? HOURS_MAP.quiz : HOURS_MAP.task,
      status: si ? 'Avaliado' : 'Pendente',
      notes: si?.notes || '',
      module: Number(t.module_number) || null,
    });
  });

  // ── Provas (Exam entity via ExamSubmission) ──
  if (exams && exams.length > 0 && examSubs && examSubs.length > 0) {
    examSubs.forEach((sub) => {
      const exam = exams.find((e) => e.id === sub.exam_id);
      if (!exam || sub.status !== 'graded') return;
      const si = verifiedScores.find((s) => s.category === 'exam' && (s.ref_id === exam.id || s.ref_id === `exam:${exam.id}`));
      rows.push({
        key: `exam_${exam.id}`,
        category: 'Prova',
        title: exam.title,
        score: si?.score ?? STUDY_SCORE_RULES.exam,
        max: STUDY_SCORE_RULES.exam,
        hours: HOURS_MAP.exam,
        status: 'Avaliado',
        notes: sub.feedback || si?.notes || '',
        module: Number(String(exam.module_ref || '').match(/\d+/)?.[0]) || null,
      });
    });
  }

  // Somente aulas assistidas, trabalhos entregues e provas compõem a pontuação de estudos.

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
  // Tarefas:        uma linha única "Trabalhos Entregues" com somatória
  // Provas:         uma linha única "Provas" com somatória

  const GROUPED_CATEGORIES = new Set(['Tarefa', 'Prova']);
  const GROUP_LABELS = {
    'Tarefa': 'Trabalhos Entregues',
    'Prova': 'Provas',
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
