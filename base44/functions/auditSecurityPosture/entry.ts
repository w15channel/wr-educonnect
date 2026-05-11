import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const REQUIRED_RLS_ENTITIES = [
  'AccessCode',
  'AdminCredential',
  'Announcement',
  'Book',
  'BookChapter',
  'CalendarEvent',
  'ForumPost',
  'ForumReply',
  'LessonProgress',
  'LiveAttendance',
  'LiveSession',
  'MonitorHistory',
  'Notification',
  'RecordedLesson',
  'ScoreItem',
  'SiteImprovementRequest',
  'StudentProfile',
  'Task',
  'TaskSubmission',
  'TherapistPairing',
  'Tuition',
];

function hasOperationRules(schema, operation) {
  return Boolean(schema?.rls?.[operation] && Object.keys(schema.rls[operation]).length > 0);
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

    const findings = [];

    for (const entityName of REQUIRED_RLS_ENTITIES) {
      const schema = await base44.entities[entityName].schema().catch(() => null);
      if (!schema?.rls || Object.keys(schema.rls).length === 0) {
        findings.push({ entity: entityName, issue: 'RLS ausente' });
        continue;
      }

      for (const operation of ['create', 'read', 'update', 'delete']) {
        if (!hasOperationRules(schema, operation)) {
          findings.push({ entity: entityName, issue: `Regra ${operation} ausente ou vazia` });
        }
      }
    }

    return Response.json({
      success: findings.length === 0,
      checkedEntities: REQUIRED_RLS_ENTITIES.length,
      findings,
      message: findings.length === 0
        ? 'Auditoria concluída: nenhuma falha de RLS encontrada.'
        : 'Auditoria concluída: há políticas que precisam ser revisadas no código do app.',
      ranAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});