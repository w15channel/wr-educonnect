import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import {
  lessonScoreNote,
  taskScoreNote,
  examScoreNote,
  forumScoreNote,
  ofensivaScoreNote,
  therapistScoreNote,
  LIVE_ATTENDANCE_NOTE,
} from '../../shared/scoreMessages.ts';

// ═══════════════════════════════════════════════════════════════════════════════
// SCORING RULES — canonical reference (update here, propagates everywhere)
// ─────────────────────────────────────────────────────────────────────────────
// lesson              watched        + 2.0 pts  (per lesson; study + ranking)
// live_attendance     confirmed      + 0.0 pts  (lives no longer generate points)
// task                submitted      + 5.0 pts  (per assignment; study + ranking)
// quiz / exam         graded         +50.0 pts  (per exam; study + ranking)
// forum post          created        + 0.1 pts  base (includes debates space)
// forum reply         to colleague   + 0.1 pts  base (includes debates space)
//   ranking bonus (post OR reply)   + 0.1 pts  if author is 3rd place
//                                   + 0.2 pts  if author is 2nd place
//                                   + 0.3 pts  if author is 1st place
// therapist_pairing   submitted eval +10.0 pts  (per role per pairing — therapist + patient separately)
// ofensiva            points_earned  variable   (sum of DailyChallengeResponse.points_earned per day)
// ═══════════════════════════════════════════════════════════════════════════════

const COURSES = ['tcc', 'psicanalise', 'sexologia'];

async function fetchAllPages(entityQuery, sort, pageSize = 5000) {
  let all = [];
  let skip = 0;
  while (true) {
    const page = await entityQuery(sort, pageSize, skip);
    if (!page || page.length === 0) break;
    all = all.concat(page);
    if (page.length < pageSize) break;
    skip += pageSize;
  }
  return all;
}

const CYCLE_DAYS = 7;
const EPOCH = new Date('2024-01-01T00:00:00Z');
const STUDY_POINTS = { lesson: 2, task: 5, quiz: 50, exam: 50 };
const THERAPIST_SESSION_POINTS = 10;
const LIVE_ATTENDANCE_POINTS = 0;
const MAX_RANKING_POINTS = 100;

function ymd(date) {
  return date.toISOString().slice(0, 10);
}

function getCurrentPeriod() {
  const now = new Date();
  const daysSince = Math.floor((now - EPOCH) / (1000 * 60 * 60 * 24));
  const cycleNum = Math.floor(daysSince / CYCLE_DAYS);
  const start = new Date(EPOCH.getTime() + cycleNum * CYCLE_DAYS * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + (CYCLE_DAYS - 1) * 24 * 60 * 60 * 1000);
  return { start: ymd(start), end: ymd(end) };
}

function sameCourse(record, course) {
  return record?.course === course || (course === 'tcc' && !record?.course);
}

function displayName(code) {
  return code?.profile_name || code?.student_name || code?.student_email || '';
}

function scoreKey(studentEmail, category, refId) {
  return `${studentEmail}|${category}|${refId}`;
}

function roundScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round((numeric + Number.EPSILON) * 1000) / 1000;
}

function capRankingScore(value) {
  return Math.min(roundScore(value), MAX_RANKING_POINTS);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const isAutomation = ['scheduled', 'entity'].includes(payload?.automation?.type);
    const user = await base44.auth.me().catch(() => null);

    if (!isAutomation && user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // ── Fetch all data in parallel ──────────────────────────────────────────
    const [
      accessCodes,
      lessons,
      progresses,
      tasks,
      submissions,
      examSubmissions,
      liveSessions,
      attendances,
      forumPosts,
      forumReplies,
      scoreItems,
      studentProfiles,
      users,
      monitorHistory,
      therapistPairings,
      challengeResponses,
    ] = await Promise.all([
      base44.asServiceRole.entities.AccessCode.list('-created_date', 5000),
      base44.asServiceRole.entities.RecordedLesson.list('order', 5000),
      base44.asServiceRole.entities.LessonProgress.list('-created_date', 10000),
      base44.asServiceRole.entities.Task.list('-created_date', 5000),
      base44.asServiceRole.entities.TaskSubmission.list('-created_date', 10000),
      base44.asServiceRole.entities.ExamSubmission.list('-submitted_at', 10000),
      base44.asServiceRole.entities.LiveSession.list('-scheduled_at', 5000),
      base44.asServiceRole.entities.LiveAttendance.list('-created_date', 10000),
      base44.asServiceRole.entities.ForumPost.list('-created_date', 10000),
      base44.asServiceRole.entities.ForumReply.list('-created_date', 10000),
      fetchAllPages((sort, limit, skip) => base44.asServiceRole.entities.ScoreItem.list(sort, limit, skip), '-created_date'),
      base44.asServiceRole.entities.StudentProfile.list('-updated_date', 10000),
      base44.asServiceRole.entities.User.list('-created_date', 10000).catch(() => []),
      base44.asServiceRole.entities.MonitorHistory.list('-period_start', 1000),
      base44.asServiceRole.entities.TherapistPairing.list('-pairing_date', 5000),
      fetchAllPages((sort, limit, skip) => base44.asServiceRole.entities.DailyChallengeResponse.list(sort, limit, skip), '-created_date'),
    ]);

    // ── Build existingScores Map: deduplicate in-memory ───────────────────
    const existingScores = new Map();
    for (const item of scoreItems) {
      if (!item.student_email || !item.category || !item.ref_id) continue;
      const k = scoreKey(item.student_email, item.category, item.ref_id);
      const prev = existingScores.get(k);
      if (!prev) { existingScores.set(k, item); continue; }
      const prevWins =
        (prev.verified && !item.verified) ||
        (prev.verified === item.verified && (Number(prev.score) || 0) >= (Number(item.score) || 0));
      if (!prevWins) existingScores.set(k, item);
    }

    const postById = new Map(forumPosts.map((post) => [post.id, post]));
    const period = getCurrentPeriod();
    let createdScores = 0;
    let updatedScores = 0;
    let correctedSubmissions = 0;
    let monitorsDefined = 0;
    let profilesUpdated = 0;
    let scoreCachesUpdated = 0;

    // Batch queues to avoid rate limits
    const scoreCreates = [];
    const scoreUpdates = [];

    const queueScore = ({ studentEmail, category, refId, refTitle, score, maxScore, notes, moduleNumber }) => {
      if (!studentEmail || !refId) return;
      const p = {
        student_email: studentEmail,
        category,
        ref_id: refId,
        ref_title: refTitle,
        score: roundScore(score),
        max_score: roundScore(maxScore),
        verified: true,
        notes: notes || '',
        ...(Number(moduleNumber) ? { module_number: Number(moduleNumber) } : {}),
      };
      const key = scoreKey(studentEmail, category, refId);
      const existing = existingScores.get(key);
      if (existing) {
        const changed =
          roundScore(existing.score) !== p.score ||
          roundScore(existing.max_score) !== p.max_score ||
          existing.verified !== true ||
          existing.notes !== p.notes ||
          (Number(moduleNumber) && Number(existing.module_number) !== Number(moduleNumber));
        if (changed) {
          scoreUpdates.push({ id: existing.id, data: p, key });
        }
      } else {
        scoreCreates.push({ data: p, key });
      }
    };

    const flushScoreBatches = async () => {
      // Process creates in batches of 50 with delays
      for (let i = 0; i < scoreCreates.length; i += 50) {
        const batch = scoreCreates.slice(i, i + 50);
        const results = await Promise.all(batch.map(async ({ data, key }) => {
          const created = await base44.asServiceRole.entities.ScoreItem.create(data);
          return { key, data: created };
        }));
        results.forEach(({ key, data }) => existingScores.set(key, data));
        createdScores += batch.length;
        if (i + 50 < scoreCreates.length) await new Promise(r => setTimeout(r, 300));
      }
      scoreCreates.length = 0;
      // Process updates in batches of 50 with delays
      for (let i = 0; i < scoreUpdates.length; i += 50) {
        const batch = scoreUpdates.slice(i, i + 50);
        const results = await Promise.all(batch.map(async ({ id, data, key }) => {
          const updated = await base44.asServiceRole.entities.ScoreItem.update(id, data);
          return { key, data: updated };
        }));
        results.forEach(({ key, data }) => existingScores.set(key, data));
        updatedScores += batch.length;
        if (i + 50 < scoreUpdates.length) await new Promise(r => setTimeout(r, 300));
      }
      scoreUpdates.length = 0;
    };

    // ── Per-course processing ─────────────────────────────────────────────
    for (const course of COURSES) {
      const courseCodes = accessCodes
        .filter((code) => code.student_email && code.is_active !== false && sameCourse(code, course))
        .sort((a, b) => displayName(a).localeCompare(displayName(b), 'pt-BR'));
      const courseEmails = new Set(courseCodes.map((code) => code.student_email));

      // Os módulos não têm janela temporal: todo registro válido do curso conta.
      const afterCutoff = () => true;

      const courseLessons   = lessons.filter((l) => sameCourse(l, course));
      const courseTasks     = tasks.filter((t) => sameCourse(t, course));
      const courseExams     = await base44.asServiceRole.entities.Exam.filter({ course }, '-created_date', 500);
      const courseExamSubs  = examSubmissions.filter((s) => sameCourse(s, course) && s.status === 'graded');
      const courseLives     = liveSessions.filter((l) => sameCourse(l, course));
      const coursePosts     = forumPosts.filter((p) => sameCourse(p, course));

      const lessonMap = new Map(courseLessons.map((l) => [l.id, l]));
      const taskMap   = new Map(courseTasks.map((t) => [t.id, t]));
      const examMap   = new Map(courseExams.map((e) => [e.id, e]));
      const liveMap   = new Map(courseLives.map((l) => [l.id, l]));
      const coursePostIds = new Set(coursePosts.map((p) => p.id));

      // ── Base totals for monitor pre-ranking ─────────────────────────────
      const baseTotals = new Map(courseCodes.map((c) => [c.student_email, 0]));
      const addBase = (email, pts) => baseTotals.set(email, roundScore((baseTotals.get(email) || 0) + roundScore(pts)));

      progresses.forEach((p) => {
        if (p.watched && courseEmails.has(p.student_email) && lessonMap.has(p.lesson_id) && afterCutoff(p)) addBase(p.student_email, STUDY_POINTS.lesson);
      });
      attendances.forEach((a) => {
        if (courseEmails.has(a.student_email) && liveMap.has(a.session_id) && afterCutoff(a)) addBase(a.student_email, LIVE_ATTENDANCE_POINTS);
      });
      submissions.forEach((s) => {
        if (courseEmails.has(s.student_email) && taskMap.has(s.task_id) && afterCutoff(s)) {
          const task = taskMap.get(s.task_id);
          addBase(s.student_email, task?.type === 'quiz' ? STUDY_POINTS.exam : STUDY_POINTS.task);
        }
      });
      coursePosts.forEach((p) => {
        if (courseEmails.has(p.author_email) && afterCutoff(p)) addBase(p.author_email, 0.1);
      });
      forumReplies.forEach((r) => {
        const parent = postById.get(r.post_id);
        if (parent && coursePostIds.has(parent.id) && courseEmails.has(r.author_email) && parent.author_email !== r.author_email && afterCutoff(r)) {
          addBase(r.author_email, 0.1);
        }
      });
      therapistPairings.forEach((p) => {
        if (courseEmails.has(p.therapist_email) && p.therapist_submitted && afterCutoff(p)) addBase(p.therapist_email, 10);
        if (courseEmails.has(p.patient_email)   && p.patient_submitted   && afterCutoff(p)) addBase(p.patient_email,   10);
      });
      challengeResponses.forEach((r) => {
        if (courseEmails.has(r.student_email) && sameCourse(r, course) && afterCutoff(r)) {
          addBase(r.student_email, roundScore(r.points_earned || 0));
        }
      });

      // ── Monitor selection ────────────────────────────────────────────────
      const rankingBase = courseCodes
        .map((c) => ({ code: c, total: baseTotals.get(c.student_email) || 0, name: displayName(c).toLowerCase() }))
        .sort((a, b) => b.total !== a.total ? b.total - a.total : a.name.localeCompare(b.name, 'pt-BR'));

      const currentMonitors = monitorHistory.filter((m) => m.period_start === period.start && sameCourse(m, course));
      for (const m of currentMonitors) {
        await base44.asServiceRole.entities.MonitorHistory.delete(m.id).catch(() => null);
      }

      for (const [idx, item] of rankingBase.slice(0, 3).entries()) {
        const rank = idx + 1;
        await base44.asServiceRole.entities.MonitorHistory.create({
          student_email: item.code.student_email,
          student_name: displayName(item.code),
          period_start: period.start,
          period_end: period.end,
          rank_position: rank,
          course,
        });
        monitorsDefined++;
      }

      // ── Clean up invalid ScoreItems ─────────────────────────────────────
      const liveSessionIds = new Set(courseLives.map((l) => l.id));

      // Valid submission keys: a quiz/exam score is only legitimate if a real
      // submission exists for that student. Guards against orphan "Prova" points
      // (e.g. left behind by content migrations/renames) awarding points without delivery.
      const validQuizKeys = new Set(); // `${email}|${task_id}` — quiz = Task submission
      submissions.forEach((s) => {
        if (courseEmails.has(s.student_email)) validQuizKeys.add(`${s.student_email}|${s.task_id}`);
      });
      const validExamKeys = new Set(); // `${email}|exam:${exam_id}` — exam = ExamSubmission
      examSubmissions.forEach((s) => {
        if (courseEmails.has(s.student_email)) validExamKeys.add(`${s.student_email}|exam:${s.exam_id}`);
      });

      for (const item of scoreItems) {
        if (!courseEmails.has(item.student_email)) continue;
        const key = scoreKey(item.student_email, item.category, item.ref_id);
        const isLegacyTherapist = item.category === 'therapist';
        const isOrphanLiveAttendance = item.category === 'live_attendance' && !liveSessionIds.has(item.ref_id);
        const isOrphanQuiz = item.category === 'quiz' && !validQuizKeys.has(`${item.student_email}|${item.ref_id}`);
        const isOrphanExam = item.category === 'exam' && !validExamKeys.has(`${item.student_email}|${item.ref_id}`);
        if (isLegacyTherapist || isOrphanLiveAttendance || isOrphanQuiz || isOrphanExam) {
          await base44.asServiceRole.entities.ScoreItem.delete(item.id).catch(() => null);
          existingScores.delete(key);
        }
      }

      // ── Forum ranking bonus — based on baseTotals ranking position ─────
      // Rank all course students by baseTotals (descending); ties broken by name.
      const rankingForForum = [...baseTotals.entries()]
        .sort((a, b) => b[1] !== a[1] ? b[1] - a[1] : a[0].localeCompare(b[0], 'pt-BR'));
      // Map email → 1-based rank position
      const rankPositionMap = new Map(rankingForForum.map(([email], idx) => [email, idx + 1]));

      // Returns base forum pts (0.1) + bonus for top-3 ranked authors
      function forumScore(authorEmail) {
        const base = 0.1;
        const pos = rankPositionMap.get(authorEmail) ?? Number.MAX_SAFE_INTEGER;
        const bonus = pos === 1 ? 0.3 : pos === 2 ? 0.2 : pos === 3 ? 0.1 : 0;
        return roundScore(base + bonus);
      }

      // ── Queue all ScoreItems for this course ────────────────────────────
      const calculatedTotals = new Map(courseCodes.map((c) => [c.student_email, 0]));
      const calculatedStudyTotals = new Map(courseCodes.map((c) => [c.student_email, 0]));
      const addCalc = (email, pts) => calculatedTotals.set(email, roundScore((calculatedTotals.get(email) || 0) + roundScore(pts)));
      const addStudyCalc = (email, pts) => calculatedStudyTotals.set(email, roundScore((calculatedStudyTotals.get(email) || 0) + roundScore(pts)));
      const addBothCalc = (email, pts) => { addCalc(email, pts); addStudyCalc(email, pts); };

      // Lessons
      for (const p of progresses) {
        const lesson = lessonMap.get(p.lesson_id);
        if (!p.watched || !courseEmails.has(p.student_email) || !lesson) continue;
        queueScore({ studentEmail: p.student_email, category: 'lesson', refId: lesson.id, refTitle: lesson.title, score: STUDY_POINTS.lesson, maxScore: STUDY_POINTS.lesson, notes: lessonScoreNote(lesson.id) });
        if (afterCutoff(p)) addBothCalc(p.student_email, STUDY_POINTS.lesson);
      }

      // Live attendance
      for (const a of attendances) {
        const live = liveMap.get(a.session_id);
        if (!courseEmails.has(a.student_email) || !live) continue;
        queueScore({ studentEmail: a.student_email, category: 'live_attendance', refId: live.id, refTitle: live.title || a.session_title || 'Presença em live', score: LIVE_ATTENDANCE_POINTS, maxScore: LIVE_ATTENDANCE_POINTS, notes: LIVE_ATTENDANCE_NOTE });
      }

      // Task/quiz submissions
      for (const s of submissions) {
        const task = taskMap.get(s.task_id);
        if (!courseEmails.has(s.student_email) || !task) continue;
        const baseScore = task.type === 'quiz' ? STUDY_POINTS.quiz : STUDY_POINTS.task;
        const score = baseScore;
        const category = task.type === 'quiz' ? 'quiz' : 'task';
        const feedback = taskScoreNote(task.id, roundScore(baseScore), task.type === 'quiz');
        queueScore({ studentEmail: s.student_email, category, refId: task.id, refTitle: task.title, score, maxScore: score, notes: feedback });
        if (afterCutoff(s)) addBothCalc(s.student_email, baseScore);
        if (s.status !== 'graded' || roundScore(s.grade) !== roundScore(score) || s.feedback !== feedback) {
          await base44.asServiceRole.entities.TaskSubmission.update(s.id, { grade: roundScore(score), feedback, status: 'graded' });
          correctedSubmissions++;
        }
      }

      // Exam submissions (graded exams from ExamSubmission entity)
      // Uses the actual grade assigned by the teacher (sub.grade), capped at STUDY_POINTS.exam
      for (const sub of courseExamSubs) {
        const exam = examMap.get(sub.exam_id);
        if (!courseEmails.has(sub.student_email) || !exam || sub.status !== 'graded') continue;
        const grade = roundScore(Math.min(Number(sub.grade) || 0, STUDY_POINTS.exam));
        const refId = `exam:${sub.exam_id}`;
        queueScore({
          studentEmail: sub.student_email,
          category: 'exam',
          refId,
          refTitle: exam.title,
          score: grade,
          maxScore: STUDY_POINTS.exam,
          notes: sub.feedback || examScoreNote(refId, grade)
        });
        if (afterCutoff(sub)) addBothCalc(sub.student_email, grade);
      }

      // Forum posts
      for (const post of coursePosts) {
        if (!courseEmails.has(post.author_email)) continue;
        const space = post.space === 'debates' ? 'Sala de Debates' : 'Fórum';
        const pts = forumScore(post.author_email);
        const pos = rankPositionMap.get(post.author_email) ?? 0;
        const bonusNote = pos <= 3 ? ` (bônus de classificação: ${pos}º lugar)` : '';
        queueScore({ studentEmail: post.author_email, category: 'forum', refId: post.id, refTitle: `Publicação — ${space}`, score: pts, maxScore: 0.4, notes: `${forumScoreNote(post.id, pts, space, false)}${bonusNote}` });
        if (afterCutoff(post)) addCalc(post.author_email, pts);
      }

      // Forum replies
      for (const reply of forumReplies) {
        const parent = postById.get(reply.post_id);
        if (!parent || !coursePostIds.has(parent.id) || !courseEmails.has(reply.author_email) || parent.author_email === reply.author_email) continue;
        const space = reply.space === 'debates' ? 'Sala de Debates' : 'Fórum';
        const pts = forumScore(reply.author_email);
        const pos = rankPositionMap.get(reply.author_email) ?? 0;
        const bonusNote = pos <= 3 ? ` (bônus de classificação: ${pos}º lugar)` : '';
        queueScore({ studentEmail: reply.author_email, category: 'forum', refId: reply.id, refTitle: `Resposta a colega — ${space}`, score: pts, maxScore: 0.4, notes: `${forumScoreNote(reply.id, pts, space, true)}${bonusNote}` });
        if (afterCutoff(reply)) addCalc(reply.author_email, pts);
      }

      // Therapist pairings
      for (const pairing of therapistPairings) {
        const pairingInCourse = courseEmails.has(pairing.therapist_email) || courseEmails.has(pairing.patient_email);
        if (!pairingInCourse) continue;

        if (courseEmails.has(pairing.therapist_email) && pairing.therapist_submitted) {
          const refId = `therapist_pairing:${pairing.id}:therapist`;
          const dateStr = pairing.pairing_date || 'data não informada';
          queueScore({ studentEmail: pairing.therapist_email, category: 'task', refId, refTitle: `Relato Terapeuta da Semana (${dateStr})`, score: THERAPIST_SESSION_POINTS, maxScore: THERAPIST_SESSION_POINTS, notes: therapistScoreNote(refId, 'terapeuta'), moduleNumber: pairing.module_number });
          if (afterCutoff(pairing)) addCalc(pairing.therapist_email, THERAPIST_SESSION_POINTS);
        }

        if (courseEmails.has(pairing.patient_email) && pairing.patient_submitted) {
          const refId = `therapist_pairing:${pairing.id}:patient`;
          const dateStr = pairing.pairing_date || 'data não informada';
          queueScore({ studentEmail: pairing.patient_email, category: 'task', refId, refTitle: `Relato Terapeuta da Semana — Paciente (${dateStr})`, score: THERAPIST_SESSION_POINTS, maxScore: THERAPIST_SESSION_POINTS, notes: therapistScoreNote(refId, 'paciente'), moduleNumber: pairing.module_number });
          if (afterCutoff(pairing)) addCalc(pairing.patient_email, THERAPIST_SESSION_POINTS);
        }
      }

      // Ofensivas Diárias
      const courseResponses = challengeResponses.filter((r) => courseEmails.has(r.student_email) && sameCourse(r, course));
      for (const r of courseResponses) {
        const pts = roundScore(r.points_earned || 0);
        if (pts <= 0) continue;
        const refId = `ofensiva:${r.challenge_id}:${r.student_email}`;
        queueScore({ studentEmail: r.student_email, category: 'forum', refId, refTitle: `Ofensiva Diária (${r.date || 'data'})`, score: pts, maxScore: 1.0, notes: ofensivaScoreNote(refId, pts, r.questions_answered || 0) });
        if (afterCutoff(r)) addCalc(r.student_email, pts);
      }

      // ── Flush batched ScoreItem operations ──────────────────────────────
      await flushScoreBatches();

      // ── Sync study points only (pontuacao_estudos) ──────────────────────
      // IMPORTANT: this function no longer publishes `pontuacao_total`,
      // `points` or `dashboard_rank`. Esses campos são a fonte lida pelo
      // Ranking Geral do aluno e pelo Ranking Geral Manual do admin, e a
      // sequência exibida/salva no módulo ativo do Controle de Pontuação
      // (ScoreControl → "Salvar sequência") é a única ação que deve publicá-
      // los — sobrescrevê-los aqui (com um total cumulativo, sem recorte de
      // módulo) desfazia silenciosamente a publicação manual do admin toda
      // vez que a página era aberta ou a sincronização automática rodava,
      // fazendo o ranking exibido aos alunos divergir do que o admin via no
      // módulo selecionado.
      const finalRanking = courseCodes
        .map((c) => ({ code: c, name: displayName(c).toLowerCase() }));

      for (const item of finalRanking) {
        const matchingProfiles = studentProfiles.filter(
          (p) => p.student_email === item.code.student_email && (p.dashboard_course === course || (!p.dashboard_course && course === 'tcc'))
        );
        const existingProfile = matchingProfiles.find((p) => p.code_id) || matchingProfiles[0];
        const studyTotal = roundScore(calculatedStudyTotals.get(item.code.student_email) || 0);
        for (const dup of matchingProfiles.filter((p) => existingProfile && p.id !== existingProfile.id)) {
          await base44.asServiceRole.entities.StudentProfile.delete(dup.id).catch(() => null);
        }
        if (existingProfile) {
          if (roundScore(existingProfile.pontuacao_estudos) !== studyTotal) {
            await base44.asServiceRole.entities.StudentProfile.update(existingProfile.id, { pontuacao_estudos: studyTotal });
            profilesUpdated++;
          }
        } else {
          await base44.asServiceRole.entities.StudentProfile.create({
            student_email: item.code.student_email,
            full_name: displayName(item.code),
            pontuacao_estudos: studyTotal,
            dashboard_course: course,
          });
          profilesUpdated++;
        }

        if (roundScore(item.code.pontuacao_estudos) !== studyTotal) {
          await base44.asServiceRole.entities.AccessCode.update(item.code.id, { pontuacao_estudos: studyTotal });
          scoreCachesUpdated++;
        }

        for (const cachedUser of users.filter((u) => u.email === item.code.student_email)) {
          if (roundScore(cachedUser.pontuacao_estudos) !== studyTotal) {
            await base44.asServiceRole.entities.User.update(cachedUser.id, { pontuacao_estudos: studyTotal });
            scoreCachesUpdated++;
          }
        }
      }

      // Delay between courses to avoid rate limiting
      if (course !== COURSES[COURSES.length - 1]) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return Response.json({
      success: true,
      rules: {
        lesson_watched:               { pts: 2,     note: 'por aula assistida (pontuação de estudos)' },
        live_attendance:              { pts: 0,     note: 'lives não geram pontuação' },
        task_submission:              { pts: 5,     note: 'por trabalho entregue (pontuação de estudos)' },
        quiz_or_exam_graded:          { pts: 50,    note: 'por prova entregue/corrigida (pontuação de estudos)' },
        forum_post:                   { pts: '0.1–0.4', note: 'base 0.1 + bônus: +0.1 (3º), +0.2 (2º), +0.3 (1º lugar no ranking)' },
        forum_reply_to_colleague:     { pts: '0.1–0.4', note: 'base 0.1 + mesmo bônus de classificação' },
        therapist_week_submitted:     { pts: 10,    note: 'por relato enviado (como terapeuta OU paciente)' },
        ofensiva_diaria:              { pts: '0–1', note: 'soma dos points_earned do DailyChallengeResponse do dia' },
        monitor_cycle_days:           CYCLE_DAYS,
      },
      createdScores,
      updatedScores,
      correctedSubmissions,
      monitorsDefined,
      profilesUpdated,
      scoreCachesUpdated,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});