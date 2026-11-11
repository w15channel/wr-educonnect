/**
 * participationUtils
 * ──────────────────
 * Fonte única de verdade para contabilização de participações (atividades realizadas)
 * e cálculo de ranking sem qualquer sistema de pontos.
 *
 * O ranking geral da turma ordena os alunos pela somatória total de atividades realizadas
 * (quem realizou mais atividades fica no topo).
 */
import { isExamPassed } from '@/lib/autoCorrectionResponses';
import { resolveDisplayNameFromMaps, buildProfileMap, resolveAvatarEmoji } from '@/lib/avatarUtils';

const normEmail = (v = '') => String(v || '').trim().toLowerCase();

const parseModNum = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const m = String(value).match(/\d+/);
  const parsed = m ? Number(m[0]) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

/**
 * Conta todas as participações concluídas de um aluno (geral ou filtradas por módulo).
 */
export function countStudentParticipations(
  studentEmail,
  {
    lessons = [],
    lessonProgresses = [],
    tasks = [],
    taskSubmissions = [],
    exams = [],
    examSubmissions = [],
    forumPosts = [],
    forumReplies = [],
    mentorships = [],
    therapistPairings = [],
    challengeResponses = [],
    dailyChallenges = [],
  } = {},
  { moduleNumber = null, course = null } = {}
) {
  const email = normEmail(studentEmail);
  if (!email) {
    return {
      total: 0,
      lessons: 0,
      tasks: 0,
      exams: 0,
      forum: 0,
      mentorships: 0,
      therapist: 0,
      ofensivas: 0,
    };
  }

  const modFilter = moduleNumber ? Number(moduleNumber) : null;
  const lessonById = new Map(lessons.map((l) => [l.id, l]));
  const taskById = new Map(tasks.map((t) => [t.id, t]));
  const examById = new Map(exams.map((e) => [e.id, e]));
  const challengeById = new Map(dailyChallenges.map((c) => [c.id, c]));
  const postById = new Map(forumPosts.map((p) => [p.id, p]));

  // 1. Aulas gravadas, capítulos da apostila e podcasts concluídos (sem flags internas de checklist)
  const watchedLessonKeys = new Set();
  lessonProgresses.forEach((p) => {
    if (!p?.watched || normEmail(p.student_email) !== email) return;
    const lid = String(p.lesson_id || '');
    if (!lid || lid.startsWith('checklist:')) return;

    if (lid.startsWith('apostila:')) {
      const mod = parseModNum(lid);
      if (modFilter && mod !== modFilter) return;
      watchedLessonKeys.add(lid);
      return;
    }
    if (lid.startsWith('podcast:')) {
      if (modFilter) return; // podcasts entram no total geral se o episódio não estiver carregado aqui
      watchedLessonKeys.add(lid);
      return;
    }
    const lesson = lessonById.get(lid);
    if (lessons.length > 0 && !lesson) return;
    if (course && lesson?.course && lesson.course !== course) return;
    if (modFilter && parseModNum(lesson?.module_number) !== modFilter) return;
    watchedLessonKeys.add(lid);
  });

  // 2. Tarefas e trabalhos entregues
  const submittedTaskIds = new Set();
  taskSubmissions.forEach((sub) => {
    if (normEmail(sub?.student_email) !== email || !sub?.task_id) return;
    const task = taskById.get(sub.task_id);
    if (tasks.length > 0 && !task) return;
    if (course && (sub.course || task?.course) && (sub.course || task?.course) !== course) return;
    if (modFilter && parseModNum(task?.module_number) !== modFilter) return;
    submittedTaskIds.add(sub.task_id);
  });

  // 3. Provas aprovadas (>= 50% de acerto)
  const passedExamIds = new Set();
  examSubmissions.forEach((sub) => {
    if (normEmail(sub?.student_email) !== email || !sub?.exam_id) return;
    if (!isExamPassed(sub)) return;
    const exam = examById.get(sub.exam_id);
    if (exams.length > 0 && !exam) return;
    if (course && (sub.course || exam?.course) && (sub.course || exam?.course) !== course) return;
    if (modFilter && parseModNum(exam?.module_ref) !== modFilter) return;
    passedExamIds.add(sub.exam_id);
  });

  // 4. Fórum e Sala de Debates (tópicos abertos + comentários em posts de colegas)
  let forumCount = 0;
  if (!modFilter) {
    const ownPostIds = new Set();
    forumPosts.forEach((p) => {
      if (normEmail(p?.author_email) !== email || p?.author_role === 'teacher') return;
      if (course && p.course && p.course !== course) return;
      if (p?.id && !ownPostIds.has(p.id)) {
        ownPostIds.add(p.id);
        forumCount += 1;
      }
    });
    const ownReplyIds = new Set();
    forumReplies.forEach((r) => {
      if (normEmail(r?.author_email) !== email || r?.author_role === 'teacher') return;
      const parent = postById.get(r.post_id);
      if (parent && normEmail(parent.author_email) === email) return;
      if (course && (r.course || parent?.course) && (r.course || parent?.course) !== course) return;
      if (r?.id && !ownReplyIds.has(r.id)) {
        ownReplyIds.add(r.id);
        forumCount += 1;
      }
    });
  }

  // 5. Mentorias realizadas
  let mentorshipCount = 0;
  mentorships.forEach((m) => {
    if (m?.status === 'cancelada') return;
    if (course && m.course && m.course !== course) return;
    if (modFilter && parseModNum(m.module_number) !== modFilter) return;
    const participants = (m?.participant_emails || []).map(normEmail);
    if (participants.includes(email)) mentorshipCount += 1;
  });

  // 6. Terapeuta da Semana (relatos entregues como terapeuta ou paciente)
  let therapistCount = 0;
  therapistPairings.forEach((p) => {
    if (modFilter && parseModNum(p?.module_number) !== modFilter) return;
    if (normEmail(p?.therapist_email) === email && p?.therapist_submitted) therapistCount += 1;
    if (normEmail(p?.patient_email) === email && p?.patient_submitted) therapistCount += 1;
  });

  // 7. Ofensivas Diárias realizadas
  const ofensivaKeys = new Set();
  challengeResponses.forEach((r) => {
    if (normEmail(r?.student_email) !== email) return;
    if (course && r.course && r.course !== course) return;
    const answered = Number(r?.questions_answered) || (Array.isArray(r?.answers) ? r.answers.length : 0);
    if (answered <= 0) return;
    if (modFilter) {
      const challenge = challengeById.get(r.challenge_id);
      const cMod = parseModNum(challenge?.module_number) || parseModNum(challenge?.lesson_id) || parseModNum(challenge?.lesson_ref);
      if (cMod !== modFilter) return;
    }
    ofensivaKeys.add(r.challenge_id || r.date || r.id);
  });

  const lessonsCount = watchedLessonKeys.size;
  const tasksCount = submittedTaskIds.size;
  const examsCount = passedExamIds.size;
  const ofensivasCount = ofensivaKeys.size;

  const total =
    lessonsCount +
    tasksCount +
    examsCount +
    forumCount +
    mentorshipCount +
    therapistCount +
    ofensivasCount;

  return {
    total,
    lessons: lessonsCount,
    tasks: tasksCount,
    exams: examsCount,
    forum: forumCount,
    mentorships: mentorshipCount,
    therapist: therapistCount,
    ofensivas: ofensivasCount,
  };
}

/**
 * Monta o ranking de alunos ordenado pela somatória total de atividades realizadas (maior no topo).
 */
export function buildParticipationRanking(
  codes = [],
  profiles = [],
  activityData = {},
  { course = 'tcc', moduleNumber = null, codePrefix = null } = {}
) {
  const profileMap = buildProfileMap(profiles);
  const seenEmails = new Set();

  const eligibleCodes = codes.filter((c) => {
    if (!c?.student_email || c.is_active === false) return false;
    if (c.profile_category && ['admin', 'management', 'support', 'teacher'].includes(c.profile_category)) {
      return false;
    }
    if (course && c.course !== course && !(course === 'tcc' && !c.course)) return false;
    if (codePrefix && !(c.code || '').startsWith(codePrefix)) return false;
    const email = normEmail(c.student_email);
    if (seenEmails.has(email)) return false;
    seenEmails.add(email);
    return true;
  });

  return eligibleCodes
    .map((c) => {
      const email = c.student_email;
      const stats = countStudentParticipations(email, activityData, { moduleNumber, course });
      const profile = profiles.find(
        (p) => normEmail(p.student_email) === normEmail(email) && (!p.dashboard_course || p.dashboard_course === course)
      );
      const manualActive =
        !moduleNumber &&
        profile?.participacoes_manual_ativa === true &&
        Number.isFinite(Number(profile?.participacoes_manual));
      const total = manualActive ? Math.max(0, Math.round(Number(profile.participacoes_manual))) : stats.total;
      const displayName =
        resolveDisplayNameFromMaps(email, profileMap, codes) ||
        c.profile_name ||
        c.student_name ||
        email;

      return {
        code: c,
        profile,
        email,
        name: displayName,
        sortName: String(displayName || '').toLowerCase(),
        total,
        count: total,
        calculatedTotal: stats.total,
        manualParticipationsActive: manualActive,
        stats,
        enrolledAt: c.created_date ? new Date(c.created_date).getTime() : Number.MAX_SAFE_INTEGER,
        avatarColor: profile?.avatar_color || c.profile_avatar_color || '#5b5ef4',
        photoUrl: profile?.photo_url || c.profile_photo_url || '',
        avatarEmoji: resolveAvatarEmoji(profile?.avatar_emoji || c.profile_avatar_emoji),
      };
    })
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      if (a.enrolledAt !== b.enrolledAt) return a.enrolledAt - b.enrolledAt;
      return a.sortName.localeCompare(b.sortName, 'pt-BR');
    });
}