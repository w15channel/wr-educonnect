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

    const results = {};
    for (const entityName of ENTITIES) {
      const res = await base44.asServiceRole.entities[entityName].deleteMany({
        created_date: { $lt: CUTOFF }
      });
      results[entityName] = res;
    }

    return Response.json({ success: true, cutoff: CUTOFF, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}