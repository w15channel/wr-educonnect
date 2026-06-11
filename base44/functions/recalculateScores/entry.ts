import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ═══════════════════════════════════════════════════════════════════════════════
// SCORING RULES — canonical reference (update here, propagates everywhere)
// ─────────────────────────────────────────────────────────────────────────────
// lesson              watched        +10.0 pts  (per lesson)
// live_attendance     confirmed      + 1.0 pts  (per live session)
// task / quiz         submitted      +10.0 pts  (+ monitor bonus if applicable)
// exam                graded         + grade    (exam grade 0-10, from ExamSubmission)
// forum post          created        + 0.1 pts  (includes debates space)
// forum reply         to colleague   + 0.5 pts  (includes debates space)
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
const BONUS_BY_RANK = { 1: 0.5, 2: 0.3, 3: 0.2 };

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
    
    const queueScore = ({ studentEmail, category, refId, refTitle, score, maxScore, notes }) => {
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
      };
      const key = scoreKey(studentEmail, category, refId);
      const existing = existingScores.get(key);
      if (existing) {
        const changed =
          roundScore(existing.score) !== p.score ||
          roundScore(existing.max_score) !== p.max_score ||
          existing.verified !== true ||
          existing.notes !== p.notes;
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
    };

    // ── Per-course processing ─────────────────────────────────────────────
    for (const course of COURSES) {
      const courseCodes = accessCodes
        .filter((code) => code.student_email && code.is_active !== false && sameCourse(code, course))
        .sort((a, b) => displayName(a).localeCompare(displayName(b), 'pt-BR'));
      const courseEmails = new Set(courseCodes.map((code) => code.student_email));

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
        if (p.watched && courseEmails.has(p.student_email) && lessonMap.has(p.lesson_id)) addBase(p.student_email, 10);
      });
      attendances.forEach((a) => {
        if (courseEmails.has(a.student_email) && liveMap.has(a.session_id)) addBase(a.student_email, 1);
      });
      submissions.forEach((s) => {
        if (courseEmails.has(s.student_email) && taskMap.has(s.task_id)) addBase(s.student_email, 10);
      });
      coursePosts.forEach((p) => {
        if (courseEmails.has(p.author_email)) addBase(p.author_email, 0.1);
      });
      forumReplies.forEach((r) => {
        const parent = postById.get(r.post_id);
        if (parent && coursePostIds.has(parent.id) && courseEmails.has(r.author_email) && parent.author_email !== r.author_email) {
          addBase(r.author_email, 0.5);
        }
      });
      therapistPairings.forEach((p) => {
        if (courseEmails.has(p.therapist_email) && p.therapist_submitted) addBase(p.therapist_email, 10);
        if (courseEmails.has(p.patient_email)   && p.patient_submitted)   addBase(p.patient_email,   10);
      });
      challengeResponses.forEach((r) => {
        if (courseEmails.has(r.student_email) && sameCourse(r, course)) {
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

      const bonusByEmail = new Map();
      for (const [idx, item] of rankingBase.slice(0, 3).entries()) {
        const rank = idx + 1;
        bonusByEmail.set(item.code.student_email, BONUS_BY_RANK[rank] || 0);
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
      for (const item of scoreItems) {
        if (!courseEmails.has(item.student_email)) continue;
        const key = scoreKey(item.student_email, item.category, item.ref_id);
        const isLegacyTherapist = item.category === 'therapist';
        const isOrphanLiveAttendance = item.category === 'live_attendance' && !liveSessionIds.has(item.ref_id);
        if (isLegacyTherapist || isOrphanLiveAttendance) {
          await base44.asServiceRole.entities.ScoreItem.delete(item.id).catch(() => null);
          existingScores.delete(key);
        }
      }

      // ── Queue all ScoreItems for this course ────────────────────────────
      const calculatedTotals = new Map(courseCodes.map((c) => [c.student_email, 0]));
      const addCalc = (email, pts) => calculatedTotals.set(email, roundScore((calculatedTotals.get(email) || 0) + roundScore(pts)));

      // Lessons
      for (const p of progresses) {
        const lesson = lessonMap.get(p.lesson_id);
        if (!p.watched || !courseEmails.has(p.student_email) || !lesson) continue;
        queueScore({ studentEmail: p.student_email, category: 'lesson', refId: lesson.id, refTitle: lesson.title, score: 10, maxScore: 10, notes: 'Aula assistida por completo: +10 pontos.' });
        addCalc(p.student_email, 10);
      }

      // Live attendance
      for (const a of attendances) {
        const live = liveMap.get(a.session_id);
        if (!courseEmails.has(a.student_email) || !live) continue;
        queueScore({ studentEmail: a.student_email, category: 'live_attendance', refId: live.id, refTitle: live.title || a.session_title || 'Presença em live', score: 1, maxScore: 1, notes: 'Presença confirmada em live: +1 ponto.' });
        addCalc(a.student_email, 1);
      }

      // Task/quiz submissions
      for (const s of submissions) {
        const task = taskMap.get(s.task_id);
        if (!courseEmails.has(s.student_email) || !task) continue;
        const bonus = bonusByEmail.get(s.student_email) || 0;
        const score = 10 + bonus;
        const category = task.type === 'quiz' ? 'quiz' : 'task';
        const feedback = bonus > 0
          ? `Entrega recebida e pontuada: 10 pontos + ${String(roundScore(bonus)).replace('.', ',')} de bônus de monitor/ranking.`
          : 'Entrega recebida e pontuada conforme a regra universal: +10 pontos.';
        queueScore({ studentEmail: s.student_email, category, refId: task.id, refTitle: task.title, score, maxScore: score, notes: feedback });
        addCalc(s.student_email, score);
        if (s.status !== 'graded' || roundScore(s.grade) !== roundScore(score) || s.feedback !== feedback) {
          await base44.asServiceRole.entities.TaskSubmission.update(s.id, { grade: roundScore(score), feedback, status: 'graded' });
          correctedSubmissions++;
        }
      }

      // Exam submissions (graded exams from ExamSubmission entity)
      // Módulo = exam.module_ref (ex: mod1, mod2, etc.)
      // Média do módulo = (participação + nota_prova) / 2, máximo 100 pts por módulo
      const examByModule = {};
      for (const sub of courseExamSubs) {
        const exam = examMap.get(sub.exam_id);
        if (!courseEmails.has(sub.student_email) || !exam || sub.status !== 'graded') continue;
        const grade = roundScore(sub.grade || 0);
        const refId = `exam:${sub.exam_id}`;
        queueScore({ 
          studentEmail: sub.student_email, 
          category: 'exam', 
          refId, 
          refTitle: exam.title, 
          score: grade, 
          maxScore: exam.max_grade || 10, 
          notes: sub.feedback || `Prova corrigida: ${grade}/${exam.max_grade || 10} pontos.` 
        });
        addCalc(sub.student_email, grade);
        // Agrupa por módulo para cálculo de média
        const moduleKey = exam.module_ref || 'default';
        if (!examByModule[sub.student_email]) examByModule[sub.student_email] = {};
        examByModule[sub.student_email][moduleKey] = { exam, grade, sub };
      }

      // Forum posts
      for (const post of coursePosts) {
        if (!courseEmails.has(post.author_email)) continue;
        const space = post.space === 'debates' ? 'Sala de Debates' : 'Fórum';
        queueScore({ studentEmail: post.author_email, category: 'forum', refId: post.id, refTitle: `Comentário/Pergunta — ${space}`, score: 0.1, maxScore: 0.1, notes: `Publicação criada na ${space}: +0,1 ponto.` });
        addCalc(post.author_email, 0.1);
      }

      // Forum replies
      for (const reply of forumReplies) {
        const parent = postById.get(reply.post_id);
        if (!parent || !coursePostIds.has(parent.id) || !courseEmails.has(reply.author_email) || parent.author_email === reply.author_email) continue;
        const space = reply.space === 'debates' ? 'Sala de Debates' : 'Fórum';
        queueScore({ studentEmail: reply.author_email, category: 'forum', refId: reply.id, refTitle: `Resposta a colega — ${space}`, score: 0.5, maxScore: 0.5, notes: `Resposta em pergunta aberta por colega na ${space}: +0,5 ponto.` });
        addCalc(reply.author_email, 0.5);
      }

      // Therapist pairings
      for (const pairing of therapistPairings) {
        const pairingInCourse = courseEmails.has(pairing.therapist_email) || courseEmails.has(pairing.patient_email);
        if (!pairingInCourse) continue;

        if (courseEmails.has(pairing.therapist_email) && pairing.therapist_submitted) {
          const refId = `therapist_pairing:${pairing.id}:therapist`;
          const dateStr = pairing.pairing_date || 'data não informada';
          queueScore({ studentEmail: pairing.therapist_email, category: 'task', refId, refTitle: `Relato Terapeuta da Semana (${dateStr})`, score: 10, maxScore: 10, notes: 'Relato enviado como terapeuta na atividade Terapeuta da Semana: +10 pontos.' });
          addCalc(pairing.therapist_email, 10);
        }

        if (courseEmails.has(pairing.patient_email) && pairing.patient_submitted) {
          const refId = `therapist_pairing:${pairing.id}:patient`;
          const dateStr = pairing.pairing_date || 'data não informada';
          queueScore({ studentEmail: pairing.patient_email, category: 'task', refId, refTitle: `Relato Terapeuta da Semana — Paciente (${dateStr})`, score: 10, maxScore: 10, notes: 'Relato enviado como paciente na atividade Terapeuta da Semana: +10 pontos.' });
          addCalc(pairing.patient_email, 10);
        }
      }

      // Ofensivas Diárias
      const courseResponses = challengeResponses.filter((r) => courseEmails.has(r.student_email) && sameCourse(r, course));
      for (const r of courseResponses) {
        const pts = roundScore(r.points_earned || 0);
        if (pts <= 0) continue;
        const refId = `ofensiva:${r.challenge_id}:${r.student_email}`;
        queueScore({ studentEmail: r.student_email, category: 'forum', refId, refTitle: `Ofensiva Diária (${r.date || 'data'})`, score: pts, maxScore: 1.0, notes: `Ofensiva diária concluída — ${r.questions_answered || 0}/5 perguntas respondidas: +${pts.toFixed(3)} ponto(s).` });
        addCalc(r.student_email, pts);
      }

      // ── Flush batched ScoreItem operations ──────────────────────────────
      await flushScoreBatches();

      // ── Final ranking + persist ──────────────────────────────────────────
      const finalRanking = courseCodes
        .map((c) => ({ code: c, total: calculatedTotals.get(c.student_email) || 0, name: displayName(c).toLowerCase() }))
        .sort((a, b) => b.total !== a.total ? b.total - a.total : a.name.localeCompare(b.name, 'pt-BR'));

      for (const [idx, item] of finalRanking.entries()) {
        const matchingProfiles = studentProfiles.filter(
          (p) => p.student_email === item.code.student_email && (p.dashboard_course === course || (!p.dashboard_course && course === 'tcc'))
        );
        const existingProfile = matchingProfiles.find((p) => p.code_id) || matchingProfiles[0];
        for (const dup of matchingProfiles.filter((p) => existingProfile && p.id !== existingProfile.id)) {
          await base44.asServiceRole.entities.StudentProfile.delete(dup.id).catch(() => null);
        }
        const profilePayload = {
          student_email: item.code.student_email,
          full_name: displayName(item.code),
          points: roundScore(item.total),
          pontuacao_total: roundScore(item.total),
          dashboard_rank: idx + 1,
          dashboard_course: course,
        };
        if (existingProfile) await base44.asServiceRole.entities.StudentProfile.update(existingProfile.id, profilePayload);
        else await base44.asServiceRole.entities.StudentProfile.create(profilePayload);
        profilesUpdated++;

        if (roundScore(item.code.pontuacao_total) !== roundScore(item.total)) {
          await base44.asServiceRole.entities.AccessCode.update(item.code.id, { pontuacao_total: roundScore(item.total) });
          scoreCachesUpdated++;
        }

        for (const cachedUser of users.filter((u) => u.email === item.code.student_email)) {
          if (roundScore(cachedUser.pontuacao_total) !== roundScore(item.total)) {
            await base44.asServiceRole.entities.User.update(cachedUser.id, { pontuacao_total: roundScore(item.total) });
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
        lesson_watched:               { pts: 10,    note: 'por aula assistida' },
        live_attendance:              { pts: 1,     note: 'por presença confirmada em live' },
        task_or_quiz_submission:      { pts: 10,    note: 'por entrega (+ bônus de monitor se aplicável)' },
        exam_graded:                  { pts: '0–10', note: 'nota da prova (ExamSubmission) — valor real atribuído pelo professor' },
        forum_post:                   { pts: 0.1,   note: 'por post criado no fórum ou sala de debates' },
        forum_reply_to_colleague:     { pts: 0.5,   note: 'por resposta a colega no fórum ou sala de debates' },
        therapist_week_submitted:     { pts: 10,    note: 'por relato enviado (como terapeuta OU paciente)' },
        ofensiva_diaria:              { pts: '0–1', note: 'soma dos points_earned do DailyChallengeResponse do dia' },
        monitor_bonus_by_rank:        BONUS_BY_RANK,
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