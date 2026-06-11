import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

    // Get LessonProgress data from automation payload
    const lessonProgressId = payload?.data?.id || payload?.entity_id;
    if (!lessonProgressId) {
      return Response.json({ error: 'LessonProgress ID required' }, { status: 400 });
    }

    const progress = await base44.asServiceRole.entities.LessonProgress.get(lessonProgressId);
    if (!progress || !progress.watched || !progress.lesson_id || !progress.student_email) {
      return Response.json({ 
        success: true, 
        message: 'Progresso não pontuável (não assistido ou sem dados completos)' 
      });
    }

    // Get lesson to verify course and get title
    const lesson = await base44.asServiceRole.entities.RecordedLesson.get(progress.lesson_id);
    if (!lesson) {
      return Response.json({ error: 'Aula não encontrada' }, { status: 404 });
    }

    // Check if ScoreItem already exists for this student+lesson
    const existingScores = await base44.asServiceRole.entities.ScoreItem.filter({
      student_email: progress.student_email,
      category: 'lesson',
      ref_id: lesson.id,
    });

    const scoreData = {
      student_email: progress.student_email,
      category: 'lesson',
      ref_id: lesson.id,
      ref_title: lesson.title || 'Aula assistida',
      score: 10,
      max_score: 10,
      verified: true,
      notes: 'Aula assistida por completo: +10 pontos.',
    };

    if (existingScores && existingScores.length > 0) {
      // Update existing score
      await base44.asServiceRole.entities.ScoreItem.update(existingScores[0].id, scoreData);
      return Response.json({ 
        success: true, 
        action: 'updated',
        score_id: existingScores[0].id,
        message: 'Pontuação de aula atualizada' 
      });
    } else {
      // Create new score
      const created = await base44.asServiceRole.entities.ScoreItem.create(scoreData);
      return Response.json({ 
        success: true, 
        action: 'created',
        score_id: created.id,
        message: 'Pontuação de aula criada' 
      });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});