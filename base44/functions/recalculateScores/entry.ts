import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const COURSES = ['tcc', 'psicanalise', 'sexologia'];
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
  return Math.round((Number(value) || 0) * 10) / 10;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const isAutomation = payload?.automation?.type === 'scheduled';
    const user = await base44.auth.me().catch(() => null);

    if (!isAutomation && user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const [
      accessCodes,
      lessons,
      progresses,
      tasks,
      submissions,
      liveSessions,
      attendances,
      forumPosts,
      forumReplies,
      scoreItems,
      studentProfiles,
      monitorHistory,
    ] = await Promise.all([
      base44.asServiceRole.entities.AccessCode.list('-created_date', 5000),
      base44.asServiceRole.entities.RecordedLesson.list('order', 5000),
      base44.asServiceRole.entities.LessonProgress.list('-created_date', 10000),
      base44.asServiceRole.entities.Task.list('-created_date', 5000),
      base44.asServiceRole.entities.TaskSubmission.list('-created_date', 10000),
      base44.asServiceRole.entities.LiveSession.list('-scheduled_at', 5000),
      base44.asServiceRole.entities.LiveAttendance.list('-created_date', 10000),
      base44.asServiceRole.entities.ForumPost.list('-created_date', 10000),
      base44.asServiceRole.entities.ForumReply.list('-created_date', 10000),
      base44.asServiceRole.entities.ScoreItem.list('-created_date', 20000),
      base44.asServiceRole.entities.StudentProfile.list('-updated_date', 10000),
      base44.asServiceRole.entities.MonitorHistory.list('-period_start', 1000),
    ]);

    const existingScores = new Map(scoreItems.map((item) => [scoreKey(item.student_email, item.category, item.ref_id), item]));
    const postById = new Map(forumPosts.map((post) => [post.id, post]));
    const period = getCurrentPeriod();
    let createdScores = 0;
    let updatedScores = 0;
    let correctedSubmissions = 0;
    let monitorsDefined = 0;
    let profilesUpdated = 0;

    const upsertScore = async ({ studentEmail, category, refId, refTitle, score, maxScore, notes }) => {
      if (!studentEmail || !refId) return;
      const payload = {
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
        const changed = roundScore(existing.score) !== payload.score || roundScore(existing.max_score) !== payload.max_score || existing.verified !== true || existing.notes !== payload.notes;
        if (changed) {
          const updated = await base44.asServiceRole.entities.ScoreItem.update(existing.id, payload);
          existingScores.set(key, updated);
          updatedScores++;
        }
      } else {
        const created = await base44.asServiceRole.entities.ScoreItem.create(payload);
        existingScores.set(key, created);
        createdScores++;
      }
    };

    for (const course of COURSES) {
      const courseCodes = accessCodes
        .filter((code) => code.student_email && code.is_active !== false && sameCourse(code, course))
        .sort((a, b) => displayName(a).localeCompare(displayName(b), 'pt-BR'));
      const courseEmails = new Set(courseCodes.map((code) => code.student_email));
      const courseLessons = lessons.filter((lesson) => sameCourse(lesson, course));
      const courseTasks = tasks.filter((task) => sameCourse(task, course));
      const courseLives = liveSessions.filter((live) => sameCourse(live, course));
      const coursePosts = forumPosts.filter((post) => sameCourse(post, course));

      const lessonMap = new Map(courseLessons.map((lesson) => [lesson.id, lesson]));
      const taskMap = new Map(courseTasks.map((task) => [task.id, task]));
      const liveMap = new Map(courseLives.map((live) => [live.id, live]));
      const coursePostIds = new Set(coursePosts.map((post) => post.id));
      const baseTotals = new Map(courseCodes.map((code) => [code.student_email, 0]));
      const addBase = (email, points) => baseTotals.set(email, roundScore((baseTotals.get(email) || 0) + points));

      progresses.forEach((progress) => {
        if (progress.watched && courseEmails.has(progress.student_email) && lessonMap.has(progress.lesson_id)) addBase(progress.student_email, 10);
      });
      attendances.forEach((attendance) => {
        if (courseEmails.has(attendance.student_email) && liveMap.has(attendance.session_id)) addBase(attendance.student_email, 1);
      });
      submissions.forEach((submission) => {
        if (courseEmails.has(submission.student_email) && taskMap.has(submission.task_id)) addBase(submission.student_email, 10);
      });
      coursePosts.forEach((post) => {
        if (courseEmails.has(post.author_email)) addBase(post.author_email, 0.1);
      });
      forumReplies.forEach((reply) => {
        const parentPost = postById.get(reply.post_id);
        if (parentPost && coursePostIds.has(parentPost.id) && courseEmails.has(reply.author_email) && parentPost.author_email !== reply.author_email) {
          addBase(reply.author_email, 0.5);
        }
      });

      const rankingBase = courseCodes.map((code) => ({
        code,
        total: baseTotals.get(code.student_email) || 0,
        name: displayName(code).toLowerCase(),
      })).sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total;
        return a.name.localeCompare(b.name, 'pt-BR');
      });

      const currentMonitors = monitorHistory.filter((monitor) => monitor.period_start === period.start && sameCourse(monitor, course));
      for (const monitor of currentMonitors) {
        await base44.asServiceRole.entities.MonitorHistory.delete(monitor.id);
      }

      const bonusByEmail = new Map();
      for (const [index, item] of rankingBase.slice(0, 3).entries()) {
        const rank = index + 1;
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

      const calculatedTotals = new Map(courseCodes.map((code) => [code.student_email, 0]));
      const addCalculated = (email, points) => calculatedTotals.set(email, roundScore((calculatedTotals.get(email) || 0) + points));

      for (const progress of progresses) {
        const lesson = lessonMap.get(progress.lesson_id);
        if (!progress.watched || !courseEmails.has(progress.student_email) || !lesson) continue;
        await upsertScore({ studentEmail: progress.student_email, category: 'lesson', refId: lesson.id, refTitle: lesson.title, score: 10, maxScore: 10, notes: 'Aula assistida por completo: +10 pontos.' });
        addCalculated(progress.student_email, 10);
      }

      for (const attendance of attendances) {
        const live = liveMap.get(attendance.session_id);
        if (!courseEmails.has(attendance.student_email) || !live) continue;
        await upsertScore({ studentEmail: attendance.student_email, category: 'live_attendance', refId: live.id, refTitle: live.title || attendance.session_title || 'Presença em live', score: 1, maxScore: 1, notes: 'Presença confirmada em live: +1 ponto.' });
        addCalculated(attendance.student_email, 1);
      }

      for (const submission of submissions) {
        const task = taskMap.get(submission.task_id);
        if (!courseEmails.has(submission.student_email) || !task) continue;
        const bonus = bonusByEmail.get(submission.student_email) || 0;
        const score = 10 + bonus;
        const category = task.type === 'quiz' ? 'quiz' : 'task';
        const feedback = bonus > 0
          ? `Entrega recebida e pontuada: 10 pontos + ${bonus.toFixed(1)} de bônus de monitor/ranking.`
          : 'Entrega recebida e pontuada conforme a regra universal: +10 pontos.';
        await upsertScore({ studentEmail: submission.student_email, category, refId: task.id, refTitle: task.title, score, maxScore: score, notes: feedback });
        addCalculated(submission.student_email, score);
        if (submission.status !== 'graded' || roundScore(submission.grade) !== roundScore(score) || submission.feedback !== feedback) {
          await base44.asServiceRole.entities.TaskSubmission.update(submission.id, { grade: roundScore(score), feedback, status: 'graded' });
          correctedSubmissions++;
        }
      }

      for (const post of coursePosts) {
        if (!courseEmails.has(post.author_email)) continue;
        await upsertScore({ studentEmail: post.author_email, category: 'forum', refId: post.id, refTitle: 'Comentário/Pergunta no Fórum', score: 0.1, maxScore: 0.1, notes: 'Comentário ou pergunta criada no fórum: +0,1 ponto.' });
        addCalculated(post.author_email, 0.1);
      }

      for (const reply of forumReplies) {
        const parentPost = postById.get(reply.post_id);
        if (!parentPost || !coursePostIds.has(parentPost.id) || !courseEmails.has(reply.author_email) || parentPost.author_email === reply.author_email) continue;
        await upsertScore({ studentEmail: reply.author_email, category: 'forum', refId: reply.id, refTitle: 'Resposta em pergunta de colega', score: 0.5, maxScore: 0.5, notes: 'Resposta em pergunta aberta por colega no fórum: +0,5 ponto.' });
        addCalculated(reply.author_email, 0.5);
      }

      const finalRanking = courseCodes.map((code) => ({
        code,
        total: calculatedTotals.get(code.student_email) || 0,
        name: displayName(code).toLowerCase(),
      })).sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total;
        return a.name.localeCompare(b.name, 'pt-BR');
      });

      for (const [index, item] of finalRanking.entries()) {
        const existingProfile = studentProfiles.find((profile) => profile.student_email === item.code.student_email && sameCourse(profile, course));
        const profilePayload = {
          student_email: item.code.student_email,
          full_name: displayName(item.code),
          points: roundScore(item.total),
          dashboard_rank: index + 1,
          dashboard_course: course,
        };
        if (existingProfile) await base44.asServiceRole.entities.StudentProfile.update(existingProfile.id, profilePayload);
        else await base44.asServiceRole.entities.StudentProfile.create(profilePayload);
        profilesUpdated++;
      }
    }

    return Response.json({
      success: true,
      rules: {
        lesson: 10,
        task_or_quiz_submission: 10,
        forum_post: 0.1,
        forum_reply_to_colleague: 0.5,
        live_attendance: 1,
        monitor_bonus_by_rank: BONUS_BY_RANK,
        monitor_cycle_days: CYCLE_DAYS,
      },
      createdScores,
      updatedScores,
      correctedSubmissions,
      monitorsDefined,
      profilesUpdated,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});