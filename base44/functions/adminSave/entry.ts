import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Entidades permitidas para operações admin
const ADMIN_ENTITIES = new Set([
  'RecordedLesson', 'Task', 'LiveSession', 'Announcement',
  'AccessCode', 'StudentProfile', 'MonitorHistory', 'MonitorFeedback',
  'ScoreItem', 'CalendarEvent', 'Book', 'BookChapter',
  'TCBookChapter', 'FamilyBookChapter', 'PsychoanalysisBookChapter', 'SexologyBookChapter',
  'TrailActivity', 'TaskSubmission', 'TherapistPairing',
  'CertificateRecord', 'Tuition', 'SiteImprovementRequest',
  'Notification', 'DailyChallenge', 'AdminCredential',
  'DailyChallengeResponse', 'ForumPost', 'ForumReply', 'LessonProgress',
  'LiveAttendance', 'ChatMessage', 'Exam', 'Mentorship', 'MentorshipReflection',
  'WallPublication', 'Podcast',
]);

// Entidades que teacher/suporte podem criar e atualizar (sem excluir)
const TEACHER_ENTITIES = new Set([
  'RecordedLesson', 'Task', 'LiveSession', 'Announcement',
  'Exam', 'BookChapter', 'TCBookChapter', 'FamilyBookChapter',
  'PsychoanalysisBookChapter', 'SexologyBookChapter', 'CalendarEvent', 'Podcast',
]);

const COURSE_CHAPTER_ENTITIES = {
  tc: 'TCBookChapter',
  tcc: 'TCBookChapter', // identificador legado mantido para compatibilidade
  'aconselhamento-familiar': 'FamilyBookChapter',
  psicanalise: 'PsychoanalysisBookChapter',
  sexologia: 'SexologyBookChapter',
};

function cleanObject(obj = {}) {
  const out = {};
  for (const [key, value] of Object.entries(obj || {})) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

function courseChapterEntityName({ course, book_id } = {}) {
  const normalizedCourse = String(course || '').trim().toLowerCase();
  if (COURSE_CHAPTER_ENTITIES[normalizedCourse]) return COURSE_CHAPTER_ENTITIES[normalizedCourse];
  const bookId = String(book_id || '').trim().toLowerCase();
  if (bookId.startsWith('apostila-')) {
    const inferredCourse = bookId.slice('apostila-'.length);
    if (COURSE_CHAPTER_ENTITIES[inferredCourse]) return COURSE_CHAPTER_ENTITIES[inferredCourse];
  }
  return 'BookChapter';
}

function chapterDataForStore(rawData, storeName) {
  const chapterData = cleanObject(rawData || {});
  if (storeName !== 'BookChapter') delete chapterData.course;
  return chapterData;
}

function chapterFilter(chapterData) {
  return {
    book_id: chapterData.book_id,
    chapter_id: chapterData.chapter_id,
    lesson_id: chapterData.lesson_id,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const { action, entity, data, id, admin_email } = payload;

    if (!admin_email) {
      return Response.json({ error: 'admin_email obrigatório.' }, { status: 403 });
    }

    const normEmail = String(admin_email || '').trim().toLowerCase();

    // ── Validação de identidade ────────────────────────────────────────
    const credentials = await base44.asServiceRole.entities.AdminCredential.list('-updated_date', 100);
    const isAdmin = credentials.some(c => String(c.email || '').trim().toLowerCase() === normEmail);

    let isTeacher = false;
    if (!isAdmin) {
      const codes = await base44.asServiceRole.entities.AccessCode.filter(
        { student_email: normEmail }, '-created_date', 10
      );
      isTeacher = codes.some(c =>
        c.is_active !== false &&
        ['teacher', 'support', 'admin', 'management'].includes(c.profile_category)
      );
    }

    if (!isAdmin && !isTeacher) {
      return Response.json({ error: 'Acesso não autorizado.' }, { status: 403 });
    }

    if (action === 'delete' && !isAdmin) {
      return Response.json({ error: 'Exclusão restrita ao administrador.' }, { status: 403 });
    }

    const isWriteOperation = ['create', 'update', 'upsertBookChapter', 'syncBookChapters'].includes(action);
    const allowedEntities = (isWriteOperation && !isAdmin) ? TEACHER_ENTITIES : ADMIN_ENTITIES;
    if (!entity || !allowedEntities.has(entity)) {
      return Response.json({ error: `Entidade '${entity}' não permitida para este perfil.` }, { status: 400 });
    }

    const routingData = action === 'list' ? (payload.filter || {}) : (data || {});
    const entityName = entity === 'BookChapter'
      ? courseChapterEntityName(routingData)
      : entity;
    const entityStore = base44.asServiceRole.entities[entityName];
    if (!entityStore) {
      return Response.json({ error: `Entidade '${entityName}' não encontrada.` }, { status: 400 });
    }

    if (action === 'upsertBookChapter') {
      if (entity !== 'BookChapter') {
        return Response.json({ error: 'upsertBookChapter aceita apenas BookChapter.' }, { status: 400 });
      }
      const chapterData = chapterDataForStore(data, entityName);
      if (!chapterData.book_id || !chapterData.chapter_id || !chapterData.lesson_id) {
        return Response.json({ error: 'book_id, chapter_id e lesson_id são obrigatórios para salvar a aula da apostila.' }, { status: 400 });
      }
      const existing = id
        ? await entityStore.get(id).catch(() => null)
        : (await entityStore.filter(chapterFilter(chapterData), '-updated_date', 1))[0];
      const record = existing?.id
        ? await entityStore.update(existing.id, chapterData)
        : await entityStore.create(chapterData);
      return Response.json({ success: true, record });
    }

    if (action === 'syncBookChapters') {
      if (entity !== 'BookChapter') {
        return Response.json({ error: 'syncBookChapters aceita apenas BookChapter.' }, { status: 400 });
      }
      const chapters = Array.isArray(data?.chapters) ? data.chapters : [];
      const createOnly = data?.createOnly !== false;
      if (chapters.length > 500) {
        return Response.json({ error: 'Limite de 500 aulas por sincronização.' }, { status: 400 });
      }

      const records = [];
      for (const rawChapter of chapters) {
        const storeName = courseChapterEntityName(rawChapter || {});
        const store = base44.asServiceRole.entities[storeName];
        if (!store) throw new Error(`Entidade '${storeName}' não encontrada.`);
        const chapterData = chapterDataForStore(rawChapter, storeName);
        if (!chapterData.book_id || !chapterData.chapter_id || !chapterData.lesson_id) continue;
        const existing = (await store.filter(chapterFilter(chapterData), '-updated_date', 1))[0];
        if (existing?.id) {
          records.push(createOnly ? existing : await store.update(existing.id, chapterData));
        } else {
          records.push(await store.create(chapterData));
        }
      }
      return Response.json({ success: true, records });
    }

    if (action === 'create') {
      const chapterData = entity === 'BookChapter' ? chapterDataForStore(data, entityName) : cleanObject(data || {});
      const record = await entityStore.create(chapterData);
      return Response.json({ success: true, record });
    }

    if (action === 'update') {
      if (!id) return Response.json({ error: 'ID obrigatório para update.' }, { status: 400 });
      const chapterData = entity === 'BookChapter' ? chapterDataForStore(data, entityName) : cleanObject(data || {});
      if (entity === 'BookChapter') {
        const existingById = await entityStore.get(id).catch(() => null);
        if (existingById?.id) {
          const record = await entityStore.update(id, chapterData);
          return Response.json({ success: true, record });
        }
        if (!chapterData.book_id || !chapterData.chapter_id || !chapterData.lesson_id) {
          return Response.json({ error: 'Não foi possível localizar a aula da apostila para atualizar.' }, { status: 404 });
        }
        const existing = (await entityStore.filter(chapterFilter(chapterData), '-updated_date', 1))[0];
        const record = existing?.id
          ? await entityStore.update(existing.id, chapterData)
          : await entityStore.create(chapterData);
        return Response.json({ success: true, record });
      }
      const record = await entityStore.update(id, chapterData);
      return Response.json({ success: true, record });
    }

    if (action === 'delete') {
      if (!id) return Response.json({ error: 'ID obrigatório para delete.' }, { status: 400 });
      await entityStore.delete(id);
      return Response.json({ success: true });
    }

    if (action === 'list') {
      const { sort_by, limit, filter } = payload;
      const records = filter
        ? await entityStore.filter(filter, sort_by || '-created_date', limit || 500)
        : await entityStore.list(sort_by || '-created_date', limit || 500);
      return Response.json({ success: true, records });
    }

    return Response.json({ error: 'Ação inválida. Use: create, update, delete, list.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
