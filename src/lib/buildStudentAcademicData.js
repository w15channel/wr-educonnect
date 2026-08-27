/**
 * buildStudentAcademicData
 * ─────────────────────────
 * Computes a student's academic summary DIRECTLY from raw delivery records
 * (LessonProgress, TaskSubmission, ExamSubmission, ForumPost/Reply,
 * TherapistPairing, Mentorship, DailyChallengeResponse).
 *
 * ScoreItems are used only as ENRICHMENT (custom score/notes set by the
 * teacher) — never as a gatekeeper. This removes the dependency on
 * background automations to populate the academic record.
 *
 * Used by HistoricoAcademico, CertificateGenerator, and AcademicItemSelector.
 *
 * @param {object} params
 * @param {string}   params.studentEmail
 * @param {Array}    params.scoreItems           - all ScoreItems (filtered internally)
 * @param {Array}    params.lessons              - RecordedLesson list for the course
 * @param {Array}    params.tasks                - Task list for the course
 * @param {Array}    [params.exams]              - Exam list for the course
 * @param {Array}    [params.examSubs]           - ExamSubmission list for the student
 * @param {Array}    [params.pairings]           - TherapistPairing list (all)
 * @param {Array}    [params.challengeResponses] - DailyChallengeResponse list (all)
 * @param {Array}    [params.lessonProgress]     - LessonProgress list (all)
 * @param {Array}    [params.taskSubmissions]    - TaskSubmission list (all)
 * @param {Array}    [params.forumPosts]         - ForumPost list (all)
 * @param {Array}    [params.forumReplies]       - ForumReply list (all)
 * @param {Array}    [params.mentorships]        - Mentorship list (all)
 * @returns {object} { rows, totalMinutes, totalHours, totalScore, totalMaxScore, approvalRate, averageGrade, classes }
 */

import { ACTIVITY_MINUTES, parseDurationToMinutes } from '@/lib/durationUtils';
import { resolveActivityModule, parseModuleNumber } from '@/lib/academicModules';
import { resolveItemModule } from '@/lib/moduleAttribution';

// A carga horária é contada em MINUTOS e exibida como tempo (HH:MM:SS).
export const MINUTES_MAP = ACTIVITY_MINUTES;

// Compatibilidade: mapa antigo em horas decimais.
export const HOURS_MAP = Object.fromEntries(
  Object.entries(ACTIVITY_MINUTES).map(([k, v]) => [k, v / 60])
);

const toHours = (minutes) => Math.round(((Number(minutes) || 0) / 60) * 1000) / 1000;

export const STUDY_SCORE_RULES = {
  lesson: 2,
  task: 5,
  quiz: 50,
  exam: 50,
  therapist: 10,
  mentorship: 10,
  forum: 0.1,
};

function roundScore(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
}

const normEmail = (v = '') => String(v || '').trim().toLowerCase();

export function buildStudentAcademicData({
  studentEmail,
  scoreItems = [],
  lessons = [],
  tasks = [],
  exams = [],
  examSubs = [],
  pairings = [],
  challengeResponses = [],
  lessonProgress = [],
  taskSubmissions = [],
  forumPosts = [],
  forumReplies = [],
  mentorships = [],
  challenges = [],
  moduleClosures = [],
}) {
  const challengeById = new Map(challenges.map((c) => [c.id, c]));
  const email = normEmail(studentEmail);

  // ScoreItems do aluno — usados apenas para enriquecer (nota/observação do
  // professor). Preferimos itens verificados quando existem duplicatas.
  const studentScores = scoreItems.filter((s) => normEmail(s.student_email) === email);
  const findScore = (category, refId) => {
    const matches = studentScores.filter((s) => s.category === category && s.ref_id === refId);
    return matches.find((s) => s.verified) || matches[0] || null;
  };

  const rows = [];

  // ── Aulas gravadas — "assistida" vem direto do LessonProgress ──
  const watchedLessonIds = new Set(
    lessonProgress.filter((p) => p.watched && normEmail(p.student_email) === email).map((p) => p.lesson_id)
  );
  lessons.forEach((l) => {
    const si = findScore('lesson', l.id);
    const done = !!si || watchedLessonIds.has(l.id);
    // A carga da aula é a duração do vídeo cadastrada pelo professor.
    const lessonMinutes = parseDurationToMinutes(l.duration);
    rows.push({
      key: `lesson_${l.id}`,
      category: 'Aula Gravada',
      title: l.title,
      score: done ? roundScore(si?.score ?? STUDY_SCORE_RULES.lesson) : null,
      max: STUDY_SCORE_RULES.lesson,
      minutes: lessonMinutes,
      hours: toHours(lessonMinutes),
      status: done ? 'Avaliado' : 'Pendente',
      notes: si?.notes || '',
      module: Number(l.module_number) || null,
    });
  });

  // Lives não entram na pontuação de estudos/histórico/certificado.

  // ── Tarefas / Provas (Task entity) — "entregue" vem do TaskSubmission ──
  const submittedTaskIds = new Set(
    taskSubmissions.filter((s) => normEmail(s.student_email) === email).map((s) => s.task_id)
  );
  tasks.forEach((t) => {
    const cat = t.type === 'quiz' ? 'quiz' : 'task';
    const si = findScore(cat, t.id);
    const done = !!si || submittedTaskIds.has(t.id);
    const maxPts = t.type === 'quiz' ? STUDY_SCORE_RULES.quiz : STUDY_SCORE_RULES.task;
    rows.push({
      key: `${cat}_${t.id}`,
      category: t.type === 'quiz' ? 'Prova' : 'Tarefa',
      title: t.title,
      score: done ? roundScore(si?.score ?? maxPts) : null,
      max: maxPts,
      minutes: t.type === 'quiz' ? ACTIVITY_MINUTES.quiz : ACTIVITY_MINUTES.task,
      hours: toHours(t.type === 'quiz' ? ACTIVITY_MINUTES.quiz : ACTIVITY_MINUTES.task),
      status: done ? 'Avaliado' : 'Pendente',
      notes: si?.notes || '',
      module: Number(t.module_number) || null,
    });
  });

  // ── Provas (Exam entity via ExamSubmission) ──
  examSubs.forEach((sub) => {
    if (sub.status !== 'graded' || normEmail(sub.student_email) !== email) return;
    const exam = exams.find((e) => e.id === sub.exam_id);
    if (!exam) return;
    const si = findScore('exam', `exam:${exam.id}`) || findScore('exam', exam.id);
    const grade = roundScore(Math.min(Number(si?.score ?? sub.grade ?? STUDY_SCORE_RULES.exam) || 0, STUDY_SCORE_RULES.exam));
    rows.push({
      key: `exam_${exam.id}`,
      category: 'Prova',
      title: exam.title,
      score: grade,
      max: STUDY_SCORE_RULES.exam,
      minutes: ACTIVITY_MINUTES.exam,
      hours: toHours(ACTIVITY_MINUTES.exam),
      status: 'Avaliado',
      notes: sub.feedback || si?.notes || '',
      module: Number(String(exam.module_ref || '').match(/\d+/)?.[0]) || null,
    });
  });

  // ── Atividades complementares ─────────────────────────────────────────────

  // Fórum e Sala de Debates — publicações do aluno
  forumPosts
    .filter((p) => normEmail(p.author_email) === email)
    .forEach((p) => {
      const si = findScore('forum', p.id);
      const space = p.space === 'debates' ? 'Sala de Debates' : 'Fórum';
      rows.push({
        key: `forum_${p.id}`,
        category: 'Fórum',
        title: `Publicação — ${space}`,
        score: roundScore(si?.score ?? STUDY_SCORE_RULES.forum),
        max: 0.4,
        minutes: ACTIVITY_MINUTES.forum,
        hours: toHours(ACTIVITY_MINUTES.forum),
        status: 'Avaliado',
        notes: si?.notes || '',
        module: null,
        date: p.created_date,
      });
    });

  // Respostas a colegas no fórum/debates
  const postById = new Map(forumPosts.map((p) => [p.id, p]));
  forumReplies
    .filter((r) => normEmail(r.author_email) === email)
    .forEach((r) => {
      const parent = postById.get(r.post_id);
      if (!parent || normEmail(parent.author_email) === email) return;
      const si = findScore('forum', r.id);
      const space = r.space === 'debates' ? 'Sala de Debates' : 'Fórum';
      rows.push({
        key: `forum_${r.id}`,
        category: 'Fórum',
        title: `Resposta a colega — ${space}`,
        score: roundScore(si?.score ?? STUDY_SCORE_RULES.forum),
        max: 0.4,
        minutes: ACTIVITY_MINUTES.forum,
        hours: toHours(ACTIVITY_MINUTES.forum),
        status: 'Avaliado',
        notes: si?.notes || '',
        module: null,
        date: r.created_date,
      });
    });

  // Terapeuta da Semana — relatos enviados (como terapeuta e como paciente)
  pairings.forEach((p) => {
    const roles = [
      { role: 'therapist', ok: normEmail(p.therapist_email) === email && p.therapist_submitted, label: 'Relato Terapeuta da Semana' },
      { role: 'patient', ok: normEmail(p.patient_email) === email && p.patient_submitted, label: 'Relato Terapeuta da Semana — Paciente' },
    ];
    roles.forEach(({ role, ok, label }) => {
      if (!ok) return;
      const refId = `therapist_pairing:${p.id}:${role}`;
      const si = findScore('task', refId) || findScore('therapist', refId);
      rows.push({
        key: `task_${refId}`,
        category: 'Terapeuta da Semana',
        title: `${label} (${p.pairing_date || 'data não informada'})`,
        score: roundScore(si?.score ?? STUDY_SCORE_RULES.therapist),
        max: STUDY_SCORE_RULES.therapist,
        minutes: ACTIVITY_MINUTES.therapist,
        hours: toHours(ACTIVITY_MINUTES.therapist),
        status: 'Avaliado',
        notes: si?.notes || '',
        module: Number(p.module_number) || null,
        date: p.pairing_date || p.created_date,
      });
    });
  });

  // Mentorias — participações registradas pelo admin
  mentorships
    .filter((m) => m.status !== 'cancelada' && (m.participant_emails || []).map(normEmail).includes(email))
    .forEach((m) => {
      const si = findScore('mentorship', m.id);
      rows.push({
        key: `mentorship_${m.id}`,
        category: 'Mentoria',
        title: `Mentoria: ${m.theme || 'Encontro'} (${m.date || 'data não informada'})`,
        score: roundScore(si?.score ?? STUDY_SCORE_RULES.mentorship),
        max: STUDY_SCORE_RULES.mentorship,
        minutes: Number(m.duration_minutes) || ACTIVITY_MINUTES.mentorship,
        hours: toHours(Number(m.duration_minutes) || ACTIVITY_MINUTES.mentorship),
        status: 'Avaliado',
        notes: si?.notes || '',
        module: Number(m.module_number) || null,
        date: m.date || m.created_date,
      });
    });

  // Ofensivas Diárias — respostas com pontos ganhos
  challengeResponses
    .filter((r) => normEmail(r.student_email) === email && roundScore(r.points_earned) > 0)
    .forEach((r) => {
      const refId = `ofensiva:${r.challenge_id}:${r.student_email}`;
      const si = findScore('forum', refId) || findScore('ofensiva', refId);
      // A ofensiva herda o módulo registrado na geração do desafio.
      const challenge = challengeById.get(r.challenge_id);
      const challengeModule =
        parseModuleNumber(challenge?.module_number) ||
        parseModuleNumber(challenge?.lesson_id) ||
        parseModuleNumber(challenge?.lesson_ref);
      rows.push({
        key: `forum_${refId}`,
        category: 'Ofensiva Diária',
        title: `Ofensiva Diária (${r.date || 'data'})${challengeModule ? ` — Módulo ${challengeModule}` : ''}`,
        score: roundScore(si?.score ?? r.points_earned),
        max: 1,
        minutes: ACTIVITY_MINUTES.ofensiva,
        hours: toHours(ACTIVITY_MINUTES.ofensiva),
        status: 'Avaliado',
        notes: si?.notes || '',
        module: challengeModule || null,
        date: r.date || r.created_date,
      });
    });

  // ── Módulo definitivo de cada atividade ──
  // Nenhuma atividade fica sem módulo: quando não há módulo gravado, ele é
  // deduzido pela data (períodos dos encerramentos de módulo). Assim cada
  // atividade aparece em um único módulo do histórico, sem duplicidade.
  rows.forEach((row) => {
    row.module = resolveActivityModule({
      explicitModule: row.module,
      dateValue: row.date,
      moduleClosures,
    });
  });

  // ── Totals (only evaluated rows) ──
  const evaluatedRows = rows.filter((r) => r.status === 'Avaliado');
  const totalScore = evaluatedRows.reduce(
    (sum, r) => roundScore(sum + (r.score !== null ? roundScore(r.score) : 0)),
    0
  );
  const totalMaxScore = evaluatedRows.reduce((sum, r) => roundScore(sum + roundScore(r.max)), 0);
  const totalMinutes = evaluatedRows.reduce((sum, r) => sum + (Number(r.minutes) || 0), 0);
  const totalHours = toHours(totalMinutes);
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
  // Complementares: uma linha única "Atividades Complementares" com somatória

  const GROUPED_CATEGORIES = new Set(['Tarefa', 'Prova', 'Fórum', 'Terapeuta da Semana', 'Mentoria', 'Ofensiva Diária']);
  const GROUP_LABELS = {
    'Tarefa': 'Trabalhos Entregues',
    'Prova': 'Provas',
    'Fórum': 'Atividades Complementares',
    'Terapeuta da Semana': 'Atividades Complementares',
    'Mentoria': 'Atividades Complementares',
    'Ofensiva Diária': 'Atividades Complementares',
  };

  const classesMap = {}; // key -> { title, hours, scoreSum, maxSum }
  let uid = 0;

  evaluatedRows.forEach((r) => {
    if (r.category === 'Aula Gravada') {
      // individual
      uid++;
      classesMap[`individual_${uid}`] = {
        title: r.title,
        minutes: Number(r.minutes) || 0,
        hours: r.hours,
        scoreSum: r.score !== null ? r.score : 0,
        maxSum: r.max,
        id: String(uid),
      };
    } else if (GROUPED_CATEGORIES.has(r.category)) {
      const groupKey = `group_${GROUP_LABELS[r.category] || r.category}`;
      if (!classesMap[groupKey]) {
        uid++;
        classesMap[groupKey] = {
          title: GROUP_LABELS[r.category] || r.category,
          minutes: 0,
          hours: 0,
          scoreSum: 0,
          maxSum: 0,
          id: String(uid),
        };
      }
      classesMap[groupKey].minutes += Number(r.minutes) || 0;
      classesMap[groupKey].hours = toHours(classesMap[groupKey].minutes);
      classesMap[groupKey].scoreSum += r.score !== null ? r.score : 0;
      classesMap[groupKey].maxSum += r.max;
    }
  });

  const classes = Object.values(classesMap).map((c) => ({
    id: c.id,
    title: c.title,
    minutes: c.minutes,
    hours: c.hours,
    // Nota total = soma dos pontos (não média)
    grade: String(Math.round(c.scoreSum * 10) / 10).replace('.', ','),
  }));

  return { rows, totalMinutes, totalHours, totalScore, totalMaxScore, approvalRate, averageGrade, classes };
}

/**
 * Single source of truth used by the academic history, score control and
 * ranking.  In addition to rebuilding activities from their source entities,
 * it keeps verified, manually-created ScoreItems that have no source record.
 */
export function buildStudentScoreSummary(params, { studentUnlocks = [], moduleNumber = null } = {}) {
  const academic = buildStudentAcademicData(params);
  const email = normEmail(params.studentEmail);
  const evaluatedRows = academic.rows.filter((row) => row.status === 'Avaliado');
  const representedKeys = new Set();

  evaluatedRows.forEach((row) => {
    representedKeys.add(row.key);
    // New ofensivas use category `ofensiva`, while legacy records used `forum`.
    if (row.key.startsWith('forum_ofensiva:')) representedKeys.add(row.key.replace(/^forum_/, 'ofensiva_'));
    // Therapist records also changed category during the data migration.
    if (row.key.startsWith('task_therapist_pairing:')) representedKeys.add(row.key.replace(/^task_/, 'therapist_'));
  });

  const complementaryRows = (params.scoreItems || [])
    .filter((item) => normEmail(item.student_email) === email && item.verified)
    .filter((item) => !representedKeys.has(`${item.category}_${String(item.ref_id || '').replace(/^exam:/, '')}`))
    .map((item) => ({
      key: `complementary_${item.id || `${item.category}_${item.ref_id}`}`,
      category: 'Atividade Complementar',
      title: item.ref_title || 'Atividade complementar',
      score: roundScore(item.score),
      max: roundScore(item.max_score || item.score),
      minutes: 0,
      hours: 0,
      status: 'Avaliado',
      notes: item.notes || '',
      module: resolveActivityModule({
        explicitModule: item.module_number,
        dateValue: item.created_date,
        moduleClosures: params.moduleClosures || [],
      }),
    }));

  // Keep the same individual module timeline used by the history for legacy
  // ScoreItems whose module was inferred from unlock dates.
  const scoreByKey = new Map(
    (params.scoreItems || [])
      .filter((item) => normEmail(item.student_email) === email)
      .map((item) => [`${item.category}_${String(item.ref_id || '').replace(/^exam:/, '')}`, item])
  );
  const rows = [...evaluatedRows, ...complementaryRows].map((row) => {
    const scoreItem = scoreByKey.get(row.key)
      || (row.key.startsWith('forum_ofensiva:') ? scoreByKey.get(row.key.replace(/^forum_/, 'ofensiva_')) : null)
      || (row.key.startsWith('task_therapist_pairing:') ? scoreByKey.get(row.key.replace(/^task_/, 'therapist_')) : null);
    return {
      ...row,
      module: resolveItemModule(scoreItem || { module_number: row.module, created_date: row.date }, studentUnlocks),
    };
  });
  const scopedRows = moduleNumber ? rows.filter((row) => row.module === Number(moduleNumber)) : rows;

  return {
    ...academic,
    rows,
    scopedRows,
    activityCount: scopedRows.length,
    totalScore: scopedRows.reduce((sum, row) => roundScore(sum + roundScore(row.score)), 0),
  };
}
