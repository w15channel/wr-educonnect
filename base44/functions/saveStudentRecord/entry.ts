import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ALLOWED_ENTITIES = new Set(['ForumPost', 'ForumReply', 'ChatMessage', 'TaskSubmission']);

function norm(value) {
  return String(value || '').trim().toLowerCase();
}

function uniqueNormList(values = []) {
  return Array.from(new Set((values || []).map(norm).filter(Boolean)));
}

function cleanObject(obj = {}) {
  const out = {};
  for (const [key, value] of Object.entries(obj || {})) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const action = payload.action;

    if (action === 'lessonProgressUpsert') {
      const lessonId = payload.lesson_id;
      const studentEmail = norm(payload.student_email);
      const identifiers = uniqueNormList([studentEmail, ...(payload.student_identifiers || [])]);
      if (!lessonId || identifiers.length === 0) {
        return Response.json({ error: 'Dados do aluno ou da aula ausentes.' }, { status: 400 });
      }

      const records = await base44.asServiceRole.entities.LessonProgress.list('-updated_date', 5000);
      const existing = records.find((item) => item.lesson_id === lessonId && identifiers.includes(norm(item.student_email)));
      const canonicalStudentEmail = studentEmail || identifiers[0];
      const data = cleanObject({ lesson_id: lessonId, student_email: canonicalStudentEmail, ...payload.patch });

      const record = existing
        ? await base44.asServiceRole.entities.LessonProgress.update(existing.id, data)
        : await base44.asServiceRole.entities.LessonProgress.create(data);

      return Response.json({ success: true, record });
    }

    if (action === 'create') {
      const entity = payload.entity;
      if (!ALLOWED_ENTITIES.has(entity)) {
        return Response.json({ error: 'Área não permitida para salvamento.' }, { status: 400 });
      }
      const data = cleanObject(payload.data || {});

      if (entity === 'TaskSubmission') {
        const taskId = data.task_id;
        const identifiers = uniqueNormList([data.student_email, ...(payload.student_identifiers || [])]);

        if (taskId && identifiers.length > 0) {
          const records = await base44.asServiceRole.entities.TaskSubmission.list('-updated_date', 5000);
          const existing = records.find((item) => item.task_id === taskId && identifiers.includes(norm(item.student_email)));
          if (existing) {
            const merged = cleanObject({ ...existing, ...data, student_email: norm(data.student_email) || norm(existing.student_email) });
            const record = await base44.asServiceRole.entities.TaskSubmission.update(existing.id, merged);
            return Response.json({ success: true, record, restored: true });
          }
        }
      }

      const record = await base44.asServiceRole.entities[entity].create(data);
      return Response.json({ success: true, record });
    }

    if (action === 'updateForumReplyCount') {
      const postId = payload.post_id;
      const replyCount = Number(payload.reply_count || 0);
      if (!postId) return Response.json({ error: 'Publicação não informada.' }, { status: 400 });
      const record = await base44.asServiceRole.entities.ForumPost.update(postId, { reply_count: replyCount });
      return Response.json({ success: true, record });
    }

    return Response.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});