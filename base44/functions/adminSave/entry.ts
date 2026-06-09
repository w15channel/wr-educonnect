import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Entidades permitidas para operações admin
const ADMIN_ENTITIES = new Set([
  'RecordedLesson', 'Task', 'LiveSession', 'Announcement',
  'AccessCode', 'StudentProfile', 'MonitorHistory', 'MonitorFeedback',
  'ScoreItem', 'CalendarEvent', 'Book', 'BookChapter',
  'TrailActivity', 'TaskSubmission', 'TherapistPairing',
  'CertificateRecord', 'Tuition', 'SiteImprovementRequest',
  'Notification', 'DailyChallenge', 'AdminCredential',
  'DailyChallengeResponse', 'ForumPost', 'ForumReply', 'LessonProgress',
  'LiveAttendance', 'ChatMessage',
]);

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
    const { action, entity, data, id, admin_email } = payload;

    // Verificação de segurança: valida o email do admin na tabela AdminCredential
    if (!admin_email) {
      return Response.json({ error: 'admin_email obrigatório.' }, { status: 403 });
    }

    const normEmail = String(admin_email || '').trim().toLowerCase();
    const credentials = await base44.asServiceRole.entities.AdminCredential.list('-updated_date', 100);
    const isValidAdmin = credentials.some(c => String(c.email || '').trim().toLowerCase() === normEmail);

    if (!isValidAdmin) {
      return Response.json({ error: 'Acesso não autorizado.' }, { status: 403 });
    }

    if (!entity || !ADMIN_ENTITIES.has(entity)) {
      return Response.json({ error: `Entidade '${entity}' não permitida.` }, { status: 400 });
    }

    const entityStore = base44.asServiceRole.entities[entity];
    if (!entityStore) {
      return Response.json({ error: `Entidade '${entity}' não encontrada.` }, { status: 400 });
    }

    if (action === 'create') {
      const record = await entityStore.create(cleanObject(data || {}));
      return Response.json({ success: true, record });
    }

    if (action === 'update') {
      if (!id) return Response.json({ error: 'ID obrigatório para update.' }, { status: 400 });
      const record = await entityStore.update(id, cleanObject(data || {}));
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