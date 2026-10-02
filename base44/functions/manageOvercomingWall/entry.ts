import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  AUGUST_2026_CONTRIBUTORS,
  augustAwardKey,
  augustMessageKey,
  contributorName,
  isDiamondRecognitionPost,
  isSelectedAugustContributor,
} from '../../shared/augustContributionAwards.ts';

const norm = (value) => String(value || '').trim().toLowerCase();
const dateOf = (record) => record.updated_date || record.submitted_at || record.created_date || record.date || new Date().toISOString();

const PIN_MARKER_RE = /^📌\[PIN:(\d{4}-\d{2}-\d{2})\]\s*/;
const DAY_MS = 24 * 60 * 60 * 1000;

async function authenticatedUser(base44, payload) {
  const claimedEmail = norm(payload.actor_email);
  const code = String(payload.access_code || '').trim();
  const codeId = String(payload.access_code_id || '').trim();
  if (!code && !codeId) throw new Error('Acesso não autorizado.');
  let access = codeId ? await base44.asServiceRole.entities.AccessCode.get(codeId).catch(() => null) : null;
  if (!access && code) {
    const byCode = await base44.asServiceRole.entities.AccessCode.filter({ code }, '-created_date', 5);
    access = byCode.find((item) => item.code === code) || null;
  }
  if (!access || (code && access.code !== code) || access.is_active === false) throw new Error('Acesso não autorizado.');
  const storedEmail = norm(access.student_email);
  if (claimedEmail && storedEmail && storedEmail !== claimedEmail) throw new Error('Acesso não autorizado.');
  const email = norm(access.student_email) || `access-code:${access.id}`;
  return { email, name: access.profile_name || access.student_name, full_name: access.profile_name || access.student_name, course: access.course };
}

async function adminAuth(base44, payload) {
  const user = await base44.auth.me().catch(() => null);
  let isAdmin = user?.role === 'admin';
  if (!isAdmin && payload.admin_email) {
    const normAdmin = String(payload.admin_email).trim().toLowerCase();
    const credentials = await base44.asServiceRole.entities.AdminCredential.list('-updated_date', 100);
    isAdmin = credentials.some((c) => String(c.email || '').trim().toLowerCase() === normAdmin);
    if (!isAdmin) {
      const codes = await base44.asServiceRole.entities.AccessCode.filter(
        { student_email: normAdmin }, '-created_date', 10
      );
      isAdmin = codes.some((c) =>
        c.is_active !== false &&
        ['admin', 'management'].includes(c.profile_category)
      );
    }
  }
  if (!isAdmin) throw new Error('Acesso não autorizado.');
  return { email: String(payload.admin_email || user?.email || '').trim().toLowerCase(), name: 'Admin', full_name: 'Admin', course: payload.course || 'tcc' };
}

async function resolveRecipients(base44, payload, targetType) {
  const service = base44.asServiceRole.entities;
  const targetEntity = targetType === 'achievement' ? 'Achievement' : 'ChatMessage';
  let target = String(payload.target_id || '').startsWith('achievement-')
    ? null
    : await service[targetEntity].get(payload.target_id).catch(() => null);
  const claimedOwner = norm(payload.target_owner_email);
  if (!claimedOwner) return { recipients: [] };
  const mentioned = (target?.mentioned_emails || []).map(norm).filter(Boolean);
  if (mentioned.length) {
    return { recipients: mentioned.includes(claimedOwner) ? mentioned : [] };
  }
  const owner = norm(target?.student_email || target?.author_email);
  if (owner) return { recipients: owner === claimedOwner ? [owner] : [] };
  const codes = await service.AccessCode.filter({ student_email: claimedOwner }, '-created_date', 5);
  let known = codes.some((item) => norm(item.student_email) === claimedOwner);
  if (!known) {
    const all = await service.AccessCode.list('-created_date', 10000);
    known = all.some((item) => norm(item.student_email) === claimedOwner);
  }
  return { recipients: known ? [claimedOwner] : [] };
}

async function syncAchievements(base44, user, requestedCourse) {
  const service = base44.asServiceRole.entities;
  const course = requestedCourse || user.course || 'tcc';
  const [codes, lessons, books, tasks, exams, progresses, submissions, examSubs, challenges, existing] = await Promise.all([
    service.AccessCode.list('-created_date', 10000), service.RecordedLesson.list('order', 1000),
    service.BookChapter.filter({ course }, 'order', 1000), service.Task.list('-created_date', 1000),
    service.Exam.list('-created_date', 1000), service.LessonProgress.list('-updated_date', 10000),
    service.TaskSubmission.list('-created_date', 10000), service.ExamSubmission.list('-submitted_at', 10000),
    service.DailyChallengeResponse.list('-created_date', 10000), service.Achievement.list('-occurred_at', 20000),
  ]);
  const students = new Set(codes.filter((c) => c.student_email && (c.course === course || (course === 'tcc' && !c.course))).map((c) => norm(c.student_email)));
  const lessonMap = new Map(lessons.map((x) => [x.id, x]));
  const bookMap = new Map(books.map((x) => [`apostila:${x.chapter_id}:${x.lesson_id}`, x]));
  const taskMap = new Map(tasks.map((x) => [x.id, x]));
  const examMap = new Map(exams.map((x) => [x.id, x]));
  const known = new Set(existing.map((x) => x.dedupe_key));
  const candidates = [];
  const add = (key, record, kind, message, title = '') => {
    const email = norm(record.student_email);
    if (!students.has(email) || known.has(key)) return;
    known.add(key); candidates.push({ dedupe_key: key, student_email: email, course, kind, title, message, source_id: record.id, occurred_at: dateOf(record) });
  };
  for (const record of progresses.filter((x) => x.watched)) {
    const video = lessonMap.get(record.lesson_id);
    const book = bookMap.get(record.lesson_id);
    if (video) add(`lesson:${record.id}`, record, 'lesson', `concluiu a aula “${video.title || 'Nova aula'}”.`, video.title);
    if (book) add(`book:${record.student_email}:${record.lesson_id}`, record, 'book_lesson', `concluiu a aula “${book.lesson_title || book.title || 'Aula da apostila'}” na apostila.`, book.lesson_title || book.title);
  }
  // A primeira atividade concluída marca o início da jornada. Uma única coroa
  // é mantida por aluno, mesmo se houver Aula 1 em vídeo e na apostila.
  const firstVideoIds = new Set(lessons.filter((lesson) => Number(lesson.order) === 1 || /^aula\s*1\b/i.test(String(lesson.title || ''))).map((lesson) => lesson.id));
  const firstBookIds = new Set(books.filter((lesson) => Number(lesson.lesson_id) === 1 || /^aula\s*1\b/i.test(String(lesson.lesson_title || lesson.title || ''))).map((lesson) => `apostila:${lesson.chapter_id}:${lesson.lesson_id}`));
  for (const email of students) {
    const initial = progresses.filter((progress) => norm(progress.student_email) === email && progress.watched && (firstVideoIds.has(progress.lesson_id) || firstBookIds.has(progress.lesson_id))).sort((a, b) => new Date(dateOf(a)) - new Date(dateOf(b)))[0];
    if (initial) add(`beginner:${course}:${email}`, { ...initial, student_email: email }, 'beginner', 'concluiu a atividade inicial e conquistou a Coroa Bronze do Iniciante. 👑', 'Coroa Bronze do Iniciante');
  }
  for (const record of submissions) { const item = taskMap.get(record.task_id); if (item) add(`task:${record.id}`, record, 'task', `respondeu a tarefa “${item.title || 'Nova tarefa'}”.`, item.title); }
  for (const record of examSubs) { const item = examMap.get(record.exam_id); if (item) add(`exam:${record.id}`, record, 'exam', `concluiu “${item.title || 'uma avaliação'}”.`, item.title); }
  for (const record of challenges) add(`challenge:${record.id}`, record, 'challenge', 'venceu mais uma etapa da ofensiva diária.');
  const modules = new Map();
  for (const book of books) { if (!modules.has(book.chapter_id)) modules.set(book.chapter_id, []); modules.get(book.chapter_id).push(book); }
  for (const email of students) for (const [moduleId, moduleLessons] of modules) {
    if (!moduleLessons.length || !moduleLessons.every((lesson) => progresses.some((p) => norm(p.student_email) === email && p.watched && p.lesson_id === `apostila:${lesson.chapter_id}:${lesson.lesson_id}`))) continue;
    const latest = progresses.filter((p) => norm(p.student_email) === email && moduleLessons.some((l) => p.lesson_id === `apostila:${l.chapter_id}:${l.lesson_id}`)).sort((a,b) => new Date(dateOf(b)) - new Date(dateOf(a)))[0];
    add(`module:${email}:${moduleId}`, { ...latest, student_email: email, id: moduleId }, 'module', `concluiu o ${moduleLessons[0].chapter_title || moduleId}.`, moduleLessons[0].chapter_title || moduleId);
  }
  for (const achievement of candidates) await service.Achievement.create(achievement);
  return { created: candidates.length };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req); const payload = await req.json().catch(() => ({}));

    // ── Admin actions (no access code required) ──────────────────────────
    if (payload.action === 'adminResetContributionAwards') {
      await adminAuth(base44, payload);
      const service = base44.asServiceRole.entities;
      const [achievements, personalPosts, chatMessages, tuitions, reactions, notifications] = await Promise.all([
        service.Achievement.list('-occurred_at', 20000),
        service.StudentWallPost.list('-published_at', 20000),
        service.ChatMessage.list('-created_date', 20000),
        service.Tuition.list('-month_ref', 20000),
        service.AchievementReaction.list('-created_date', 20000),
        service.Notification.list('-created_date', 20000),
      ]);
      const diamonds = achievements.filter((item) => item.kind === 'tuition');
      const diamondIds = new Set(diamonds.map((item) => item.id));
      const diamondCopy = (item) => /\bdiamante\b/i.test(`${item.title || ''} ${item.message || ''} ${item.content || ''}`);
      const diamondPosts = personalPosts.filter((item) => isDiamondRecognitionPost(item) || diamondCopy(item));
      const diamondChats = chatMessages.filter(diamondCopy);
      const diamondReactions = reactions.filter((item) => item.target_type === 'achievement' && diamondIds.has(item.target_id));
      const diamondNotifications = notifications.filter((item) => diamondIds.has(item.target_id) || diamondCopy(item));

      for (const item of diamondReactions) await service.AchievementReaction.delete(item.id);
      for (const item of diamondNotifications) await service.Notification.delete(item.id);
      for (const item of diamondPosts) await service.StudentWallPost.delete(item.id);
      for (const item of diamondChats) await service.ChatMessage.delete(item.id);
      for (const item of diamonds) await service.Achievement.delete(item.id);
      for (const tuition of tuitions.filter((item) => item.wall_shared)) await service.Tuition.update(tuition.id, { wall_shared: false });

      return Response.json({
        success: true,
        removedDiamonds: diamonds.length,
        removedMessages: diamondPosts.length + diamondChats.length + diamondNotifications.length,
        removedReactions: diamondReactions.length,
      });
    }
    if (payload.action === 'adminGrantContributionAward') {
      const admin = await adminAuth(base44, payload);
      const service = base44.asServiceRole.entities;
      const tuitionId = String(payload.tuition_id || '').trim();
      if (!tuitionId) return Response.json({ error: 'Selecione uma contribuição.' }, { status: 400 });
      const tuition = await service.Tuition.get(tuitionId).catch(() => null);
      const paidAmount = Number(tuition?.paid_amount);
      if (!tuition || tuition.status !== 'paid' || !Number.isFinite(paidAmount) || paidAmount <= 10) {
        return Response.json({ error: 'O Diamante exige uma contribuição voluntária quitada acima de R$ 10,00.' }, { status: 409 });
      }
      const email = norm(tuition.student_email);
      const dedupeKey = `tuition:${tuition.id}`;
      const prior = await service.Achievement.filter({ dedupe_key: dedupeKey }, '-created_date', 1);
      if (prior.length) return Response.json({ success: true, duplicate: true, achievement: prior[0] });
      const code = (await service.AccessCode.filter({ student_email: email }, '-created_date', 10)).find((item) => item.is_active !== false);
      const occurredAt = new Date().toISOString();
      const achievement = await service.Achievement.create({
        dedupe_key: dedupeKey,
        student_email: email,
        course: code?.course || payload.course || 'tcc',
        kind: 'tuition',
        title: 'Diamante da Contribuição',
        message: 'conquistou o Diamante da Contribuição por apoiar voluntariamente nossa comunidade. 💎',
        mentioned_emails: [email],
        source_id: tuition.id,
        occurred_at: occurredAt,
        student_feature_until: new Date(Date.parse(occurredAt) + 15 * DAY_MS).toISOString(),
        wall_highlight_until: new Date(Date.parse(occurredAt) + 7 * DAY_MS).toISOString(),
      });
      await service.Tuition.update(tuition.id, { wall_shared: true });
      return Response.json({ success: true, duplicate: false, achievement, grantedBy: admin.email });
    }
    if (payload.action === 'adminSettleAugust2026') {
      await adminAuth(base44, payload);
      const service = base44.asServiceRole.entities;
      const monthRef = 'Agosto - 2026';
      const [codes, tuitions, achievements, personalPosts] = await Promise.all([
        service.AccessCode.list('-created_date', 10000),
        service.Tuition.list('-month_ref', 10000),
        service.Achievement.list('-occurred_at', 20000),
        service.StudentWallPost.list('-published_at', 10000),
      ]);
      const active = [...new Map(codes.filter((code) => code.is_active !== false && code.student_email).map((code) => [norm(code.student_email), code])).values()];
      const selected = active.filter(isSelectedAugustContributor);
      const matchedNames = new Set(selected.map(contributorName));
      const missingNames = AUGUST_2026_CONTRIBUTORS.filter((name) => !matchedNames.has(name));
      if (missingNames.length) return Response.json({ error: `Alunas não localizadas: ${missingNames.join(', ')}.` }, { status: 409 });
      const duplicatedNames = AUGUST_2026_CONTRIBUTORS.filter((name) => selected.filter((code) => contributorName(code) === name).length > 1);
      if (duplicatedNames.length) return Response.json({ error: `Há mais de um cadastro ativo para: ${duplicatedNames.join(', ')}. Revise os cadastros antes de sincronizar.` }, { status: 409 });
      const eligibleEmails = new Set(selected.map((code) => norm(code.student_email)));
      let tuitionRecordsCreated = 0; let settled = 0; let diamondsGranted = 0; let removedDiamonds = 0; let messagesSent = 0; let messagesRevoked = 0;
      for (const code of active) {
        const email = norm(code.student_email);
        const matches = tuitions.filter((tuition) => {
          const reference = String(tuition.month_ref || '').trim().toLowerCase();
          return norm(tuition.student_email) === email && (reference === '2026-08' || (/agosto/.test(reference) && /2026/.test(reference)));
        });
        if (!matches.length) {
          await service.Tuition.create({ student_email: email, student_name: code.profile_name || code.student_name || '', month_ref: monthRef, amount: 0, paid_amount: 0, paid_date: '2026-08-31', status: 'paid', notes: 'Contribuição voluntária encerrada sem débito.' });
          tuitionRecordsCreated += 1;
        } else {
          for (const tuition of matches) {
            if (tuition.status !== 'paid') {
              await service.Tuition.update(tuition.id, { status: 'paid', paid_amount: Number(tuition.paid_amount) || 0, paid_date: tuition.paid_date || '2026-08-31' });
              tuition.status = 'paid';
              tuition.paid_amount = Number(tuition.paid_amount) || 0;
              settled += 1;
            }
          }
        }
      }
      // A lista informada é a fonte de verdade: perfis fora dela perdem todos
      // os diamantes, e cada aluna selecionada conserva apenas a chave canônica.
      for (const achievement of achievements.filter((item) => item.kind === 'tuition')) {
        const email = norm(achievement.student_email);
        if (!eligibleEmails.has(email) || achievement.dedupe_key !== augustAwardKey(email)) {
          await service.Achievement.delete(achievement.id); removedDiamonds += 1;
        }
      }
      const now = new Date().toISOString();
      for (const code of selected) {
        const email = norm(code.student_email);
        const dedupeKey = augustAwardKey(email);
        if (!achievements.some((item) => item.kind === 'tuition' && item.dedupe_key === dedupeKey && norm(item.student_email) === email)) {
          await service.Achievement.create({ dedupe_key: dedupeKey, student_email: email, course: code.course || 'tcc', kind: 'tuition', title: 'Diamante da Contribuição', message: 'conquistou o Diamante da Contribuição pela participação e pelo apoio à nossa comunidade em agosto. 💎', mentioned_emails: [email], source_id: 'august-2026-contribution', occurred_at: now, student_feature_until: new Date(Date.parse(now) + 15 * DAY_MS).toISOString(), wall_highlight_until: new Date(Date.parse(now) + 7 * DAY_MS).toISOString() });
          diamondsGranted += 1;
        }
        const sourceId = augustMessageKey(email);
        if (!personalPosts.some((post) => post.source_id === sourceId)) {
          await service.StudentWallPost.create({ student_email: email, title: 'Parabéns pelo seu Diamante! 💎', message: `Parabéns, ${code.profile_name || code.student_name}! Sua contribuição e participação em agosto fizeram a diferença em nossa comunidade. Este Diamante da Contribuição reconhece o seu apoio e a sua presença nessa jornada.`, source_type: 'other', source_id: sourceId, published_by: payload.admin_email || 'sistema', published_at: now, is_read: false });
          messagesSent += 1;
        }
      }
      for (const post of personalPosts.filter(isDiamondRecognitionPost)) {
        const email = norm(post.student_email);
        if (!eligibleEmails.has(email) || post.source_id !== augustMessageKey(email)) {
          await service.StudentWallPost.delete(post.id); messagesRevoked += 1;
        }
      }
      let beginnerCrowns = 0;
      const courses = new Set(active.map((code) => code.course || 'tcc'));
      for (const course of courses) beginnerCrowns += (await syncAchievements(base44, { course }, course)).created;
      return Response.json({ success: true, tuitionRecordsCreated, settled, diamondsGranted, removedDiamonds, messagesSent, messagesRevoked, beginnerCrowns, contributors: selected.map((code) => code.profile_name || code.student_name) });
    }
    if (payload.action === 'adminDeleteMessage') {
      const admin = await adminAuth(base44, payload);
      const messageId = String(payload.message_id || '').trim();
      if (!messageId) return Response.json({ error: 'message_id obrigatório.' }, { status: 400 });
      await base44.asServiceRole.entities.ChatMessage.delete(messageId).catch(() => {});
      return Response.json({ success: true, deleted: messageId });
    }
    if (payload.action === 'adminPinMessage') {
      const admin = await adminAuth(base44, payload);
      const messageId = String(payload.message_id || '').trim();
      const durationDays = Math.min(365, Math.max(1, Number(payload.duration_days) || 30));
      if (!messageId) return Response.json({ error: 'message_id obrigatório.' }, { status: 400 });
      const msg = await base44.asServiceRole.entities.ChatMessage.get(messageId).catch(() => null);
      if (!msg) return Response.json({ error: 'Mensagem não encontrada.' }, { status: 404 });
      const expiry = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      let content = String(msg.content || '').replace(PIN_MARKER_RE, '');
      content = `📌[PIN:${expiry}] ${content}`;
      await base44.asServiceRole.entities.ChatMessage.update(messageId, { content });
      return Response.json({ success: true, pinned_until: expiry, message_id: messageId });
    }
    if (payload.action === 'adminUnpinMessage') {
      const admin = await adminAuth(base44, payload);
      const messageId = String(payload.message_id || '').trim();
      if (!messageId) return Response.json({ error: 'message_id obrigatório.' }, { status: 400 });
      const msg = await base44.asServiceRole.entities.ChatMessage.get(messageId).catch(() => null);
      if (!msg) return Response.json({ error: 'Mensagem não encontrada.' }, { status: 404 });
      const content = String(msg.content || '').replace(PIN_MARKER_RE, '');
      await base44.asServiceRole.entities.ChatMessage.update(messageId, { content });
      return Response.json({ success: true, unpinned: messageId });
    }

    // ── Student actions (access code required) ────────────────────────────
    const user = await authenticatedUser(base44, payload);
    if (payload.action === 'bootstrap') {
      const service = base44.asServiceRole.entities;
      const course = payload.course || user.course || 'tcc';
      if (user.course && course !== user.course) return Response.json({ error: 'Curso não autorizado.' }, { status: 403 });
      // O bootstrap é somente leitura e executa consultas independentes em paralelo.
      // Sincronizações pesadas continuam disponíveis pela ação `sync`, sem
      // bloquear cada abertura da dashboard.
      const [allAccessCodes, messages, lessonProgresses, taskSubmissions, examSubmissions, challengeResponses, forumPosts, pairings, lessons, tasks, exams, savedAchievements, shared, notices, liveSessions, calendarEvents, reactions, allNotifications, personalPosts, readReceipts, monitorHistory] = await Promise.all([
        service.AccessCode.list('-created_date', 2000), service.ChatMessage.filter({ session_id: `class_chat_${course}` }, 'created_date', 150),
        service.LessonProgress.list('-created_date', 200), service.TaskSubmission.list('-created_date', 150), service.ExamSubmission.list('-submitted_at', 100),
        service.DailyChallengeResponse.list('-created_date', 150), service.ForumPost.list('-created_date', 150), service.TherapistPairing.list('-updated_date', 100),
        service.RecordedLesson.list('-created_date', 500), service.Task.list('-created_date', 300), service.Exam.list('-created_date', 300),
        service.Achievement.filter({ course }, '-occurred_at', 150), service.WallPublication.filter({ course }, '-published_at', 50),
        service.Announcement.filter({ course }, '-created_date', 50), service.LiveSession.filter({ course }, '-scheduled_at', 50), service.CalendarEvent.list('-date', 100),
        service.AchievementReaction.list('-created_date', 750), service.Notification.filter({ recipient_email: user.email }, '-created_date', 50),
        service.StudentWallPost.filter({ student_email: user.email }, '-published_at', 30), service.WallReadReceipt.filter({ reader_email: user.email }, '-read_at', 250),
        service.MonitorHistory.filter({ course }, '-period_start', 50),
      ]);
      const accessCodes = allAccessCodes.filter((item) => item.course === course || (course === 'tcc' && !item.course));
      const notifications = allNotifications.filter((item) => item.type === 'wall_reaction' || item.type === 'wall_reply');
      return Response.json({ success: true, accessCodes, messages, activityRecords: { lessonProgresses, taskSubmissions, examSubmissions, challengeResponses, forumPosts, pairings, lessons, tasks, exams }, savedAchievements, institutionalRecords: { shared, notices, liveSessions, calendarEvents }, reactions, notifications, personalPosts, readReceipts, monitorHistory });
    }
    if (payload.action === 'profiles') {
      const service = base44.asServiceRole.entities;
      const byCode = payload.access_code_id ? await service.StudentProfile.filter({ code_id: payload.access_code_id }, '-created_date', 20) : [];
      const byEmail = user.email ? await service.StudentProfile.filter({ student_email: user.email }, '-created_date', 20) : [];
      const records = [...byCode, ...byEmail].filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index);
      return Response.json({ success: true, records });
    }
    if (payload.action === 'listReads') {
      const records = await base44.asServiceRole.entities.WallReadReceipt.filter({ reader_email: user.email }, '-read_at', 500);
      return Response.json({ success: true, records });
    }
    if (payload.action === 'markRead') {
      const highlightKey = String(payload.highlight_key || '').trim().slice(0, 400);
      if (!/^(personal|achievement):/.test(highlightKey)) return Response.json({ error: 'Destaque inválido.' }, { status: 400 });
      const dedupeKey = `${user.email}:${highlightKey}`;
      const prior = await base44.asServiceRole.entities.WallReadReceipt.filter({ dedupe_key: dedupeKey }, '-read_at', 1);
      if (!prior.length) await base44.asServiceRole.entities.WallReadReceipt.create({ dedupe_key: dedupeKey, reader_email: user.email, highlight_key: highlightKey, read_at: new Date().toISOString() });
      return Response.json({ success: true, duplicate: prior.length > 0 });
    }
    if (payload.action === 'sync') return Response.json({ success: true, ...(await syncAchievements(base44, user, payload.course)) });
    if (payload.action === 'publish') {
      const kind = String(payload.kind || 'achievement').trim().slice(0, 40);
      const title = String(payload.title || '').trim().slice(0, 160);
      const message = String(payload.message || '').trim().slice(0, 500);
      if (!message) return Response.json({ error: 'Informe a conquista que deseja compartilhar.' }, { status: 400 });
      const sourceId = String(payload.source_id || crypto.randomUUID()).trim().slice(0, 300);
      const dedupeKey = `shared:${norm(user.email)}:${sourceId}`;
      const prior = await base44.asServiceRole.entities.Achievement.filter({ dedupe_key: dedupeKey }, '-created_date', 1);
      if (prior.length) return Response.json({ success: true, duplicate: true, achievement: prior[0] });
      const achievement = await base44.asServiceRole.entities.Achievement.create({
        dedupe_key: dedupeKey, student_email: norm(user.email), course: payload.course || user.course || 'tcc',
        kind, title, message, source_id: sourceId, occurred_at: new Date().toISOString(),
      });
      return Response.json({ success: true, achievement });
    }
    if (payload.action === 'react') {
      const reaction = ['love', 'celebrate', 'applaud'].includes(payload.reaction) ? payload.reaction : null;
      const targetType = ['achievement', 'publication'].includes(payload.target_type) ? payload.target_type : null;
      if (!reaction || !targetType || !payload.target_id) return Response.json({ error: 'Interação inválida.' }, { status: 400 });
      const actor = norm(user.email);
      const { recipients } = await resolveRecipients(base44, payload, targetType);
      const owner = recipients[0] || '';
      if (!recipients.length) return Response.json({ error: 'Conteúdo não encontrado.' }, { status: 404 });
      if (recipients.includes(actor)) return Response.json({ error: 'Você não pode interagir com o próprio conteúdo.' }, { status: 400 });
      const dedupeKey = `${targetType}:${payload.target_id}:${actor}:${reaction}`;
      const prior = await base44.asServiceRole.entities.AchievementReaction.filter({ dedupe_key: dedupeKey }, '-created_date', 1);
      if (prior.length) return Response.json({ success: true, duplicate: true });
      const actorName = user.full_name || user.name || 'Uma pessoa da turma';
      await base44.asServiceRole.entities.AchievementReaction.create({ dedupe_key: dedupeKey, target_id: payload.target_id, target_type: targetType, target_owner_email: owner, actor_email: actor, actor_name: actorName, reaction });
      const verbs = { love: 'Amou', celebrate: 'Celebrou', applaud: 'Aplaudiu' };
      for (const recipient of recipients) {
        await base44.asServiceRole.entities.Notification.create({ recipient_email: recipient, sender_email: actor, sender_name: actorName, message: `${actorName} ${verbs[reaction]} sua ${targetType === 'achievement' ? 'Conquista' : 'Publicação'}`, type: 'wall_reaction', target_id: payload.target_id, reaction, is_read: false });
      }
      return Response.json({ success: true });
    }
    if (payload.action === 'reply') {
      const replyText = String(payload.reply_text || '').trim();
      const targetType = ['achievement', 'publication'].includes(payload.target_type) ? payload.target_type : null;
      if (!targetType || !payload.target_id || !replyText || replyText.length > 500) {
        return Response.json({ error: 'Resposta inválida. Escreva entre 1 e 500 caracteres.' }, { status: 400 });
      }
      const actor = norm(user.email);
      const { recipients } = await resolveRecipients(base44, payload, targetType);
      if (!recipients.length) {
        return Response.json({ error: 'Conteúdo não encontrado.' }, { status: 404 });
      }
      if (recipients.includes(actor)) return Response.json({ error: 'Você não pode responder à própria publicação.' }, { status: 400 });
      const actorName = user.full_name || user.name || 'Uma pessoa da turma';
      for (const recipient of recipients) {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: recipient,
          sender_email: actor,
          sender_name: actorName,
          message: `${actorName} respondeu à sua ${targetType === 'achievement' ? 'Conquista' : 'Publicação'}`,
          type: 'wall_reply',
          target_id: payload.target_id,
          reply_text: replyText,
          is_read: false,
        });
      }
      return Response.json({ success: true });
    }
    return Response.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (error) { return Response.json({ error: error.message || 'Erro interno.' }, { status: error.message === 'Acesso não autorizado.' ? 401 : 500 }); }
}
