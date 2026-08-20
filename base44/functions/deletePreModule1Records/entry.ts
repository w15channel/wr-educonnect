import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Corte: início do Módulo 1 (15/07/2026). Tudo criado antes disso é excluído
// definitivamente, pois o módulo em vigor conta apenas a partir desta data.
const CUTOFF = '2026-07-15T00:00:00.000Z';

const ENTITIES = [
  'ScoreItem',
  'TaskSubmission',
  'LessonProgress',
  'ExamSubmission',
  'ForumPost',
  'ForumReply',
  'TherapistPairing',
  'DailyChallengeResponse'
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // O filtro { $lt } não é suportado por created_date no backend, então
    // buscamos todos os registros e filtramos a data manualmente antes de
    // excluir em lotes por id.
    const results = {};
    const cutoffTime = new Date(CUTOFF).getTime();
    for (const entityName of ENTITIES) {
      const all = await base44.asServiceRole.entities[entityName].filter({});
      const oldIds = all
        .filter((r) => new Date(r.created_date).getTime() < cutoffTime)
        .map((r) => r.id);

      let deleted = 0;
      const batchSize = 100;
      for (let i = 0; i < oldIds.length; i += batchSize) {
        const batch = oldIds.slice(i, i + batchSize);
        const res = await base44.asServiceRole.entities[entityName].deleteMany({ id: { $in: batch } });
        deleted += res?.deleted || 0;
      }
      results[entityName] = { deleted, found: oldIds.length };
    }

    return Response.json({ success: true, cutoff: CUTOFF, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}