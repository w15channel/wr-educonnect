import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { date, course, lesson_ref, lesson_id, questions } = body;

    if (!date || !course || !questions || questions.length < 3) {
      return Response.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const record = await base44.asServiceRole.entities.DailyChallenge.create({
      date,
      course,
      lesson_ref: lesson_ref || null,
      lesson_id: lesson_id || null,
      questions: questions.slice(0, 5),
    });

    return Response.json({ success: true, id: record.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});