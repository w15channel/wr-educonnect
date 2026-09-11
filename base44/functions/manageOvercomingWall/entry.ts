import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const norm = (value) => String(value || '').trim().toLowerCase();
const dateOf = (record) => record.updated_date || record.submitted_at || record.created_date || record.date || new Date().toISOString();

async function authenticatedUser(base44, payload) {
  const claimedEmail = norm(payload.actor_email);
  const code = String(payload.access_code || '').trim();
  const codeId = String(payload.access_code_id || '').trim();
  if (!code && !codeId) throw new Error('Acesso não autorizado.');
  // Localiza a matrícula pelo id ou pelo próprio código (único) — nunca pelo e-mail,
  // que pode estar vazio ou com maiúsculas diferentes no cadastro.
  let access = codeId ? await base44.asServiceRole.entities.AccessCode.get(codeId).catch(() => null) : null;
  if (!access && code) {
    const byCode = await base44.asServiceRole.entities.AccessCode.filter({ code }, '-created_date', 5);
    access = byCode.find((item) => item.code === code) || null;
  }
  if (!access || (code && access.code !== code) || access.is_active === false) throw new Error('Acesso não autorizado.');
  const storedEmail = norm(access.student_email);
  if (claimedEmail && storedEmail && storedEmail !== claimedEmail) throw new Error('Acesso não autorizado.');
  // Registros sem e-mail continuam identificados de modo privado e determinístico
  // pelo id da matrícula, em vez de compartilhar uma identidade vazia.
  const email = norm(access.student_email) || `access-code:${access.id}`;
  return { email, name: access.profile_name || access.student_name, full_name: access.profile_name || access.student_name, course: access.course };
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
  for (const record of submissions) { const item = taskMap.get(record.task_id); if (item) add(`task:${record.id}`, record, 'task', `respondeu a tarefa “${item.title || 'Nova tarefa'}”.`, item.title); }
  for (const record of examSubs) { const item = examMap.get(record.exam_id); if (item) add(`exam:${record.id}`, record, 'exam', `concluiu “${item.title || 'uma avaliação'}”.`, item.title); }
  for (const record of challenges) add(`challenge:${record.id}`, record, 'challenge', 'venceu mais uma etapa da ofensiva diária.');

  // Uma conquista de módulo nasce quando todas as aulas cadastradas daquele módulo foram concluídas.
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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req); const payload = await req.json().catch(() => ({})); const user = await authenticatedUser(base44, payload);
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
      const targetEntity = targetType === 'achievement' ? 'Achievement' : 'ChatMessage';
      let target = await base44.asServiceRole.entities[targetEntity].get(payload.target_id).catch(() => null);
      if (!target && targetType === 'achievement' && String(payload.target_id).startsWith('achievement-')) {
        const match = String(payload.target_id).match(/^achievement-(lesson|task|exam|challenge)-(.+)$/);
        const sourceEntities = { lesson: 'LessonProgress', task: 'TaskSubmission', exam: 'ExamSubmission', challenge: 'DailyChallengeResponse' };
        if (match) target = await base44.asServiceRole.entities[sourceEntities[match[1]]].get(match[2]).catch(() => null);
      }
      const owner = norm(targetType === 'achievement' ? target?.student_email : target?.author_email);
      const actor = norm(user.email);
      // Publicações coletivas (ex.: monitores da semana) homenageiam vários alunos:
      // a reação vale para qualquer pessoa mencionada e todas são avisadas.
      const mentioned = (target?.mentioned_emails || []).map(norm).filter(Boolean);
      const recipients = (mentioned.length ? mentioned : [owner]).filter(Boolean);
      if (!target || !recipients.length || !recipients.includes(norm(payload.target_owner_email))) return Response.json({ error: 'Conteúdo não encontrado.' }, { status: 404 });
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
      const targetEntity = targetType === 'achievement' ? 'Achievement' : 'ChatMessage';
      let target = await base44.asServiceRole.entities[targetEntity].get(payload.target_id).catch(() => null);
      if (!target && targetType === 'achievement' && String(payload.target_id).startsWith('achievement-')) {
        const match = String(payload.target_id).match(/^achievement-(lesson|task|exam|challenge)-(.+)$/);
        const sourceEntities = { lesson: 'LessonProgress', task: 'TaskSubmission', exam: 'ExamSubmission', challenge: 'DailyChallengeResponse' };
        if (match) target = await base44.asServiceRole.entities[sourceEntities[match[1]]].get(match[2]).catch(() => null);
      }
      const owner = norm(targetType === 'achievement' ? target?.student_email : target?.author_email);
      const actor = norm(user.email);
      const mentioned = (target?.mentioned_emails || []).map(norm).filter(Boolean);
      const recipients = mentioned.length ? mentioned : [owner];
      if (!target || !owner || !recipients.includes(norm(payload.target_owner_email))) {
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
});