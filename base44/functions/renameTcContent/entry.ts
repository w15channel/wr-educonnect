import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function replaceCourseTerms(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/Terapeuta\s+TCC/gi, 'Terapeuta em TC')
    .replace(/Abordagem\s+TCC/gi, 'Terapia Comportamental')
    .replace(/Terapia\s+Cognitivo-Comportamental/gi, 'Terapia Comportamental')
    .replace(/Terapia\s+Cognitivo\s+Comportamental/gi, 'Terapia Comportamental')
    .replace(/cognitivo-comportamentais/gi, 'de Terapia Comportamental')
    .replace(/cognitivo-comportamental/gi, 'de Terapia Comportamental')
    .replace(/\bTCC\b/g, 'TC');
}

function buildUpdates(record, fields) {
  const updates = {};
  for (const field of fields) {
    const current = record[field];
    const next = replaceCourseTerms(current);
    if (next !== current) updates[field] = next;
  }
  return updates;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const lessons = await base44.asServiceRole.entities.RecordedLesson.filter({ course: 'tcc' }, '-created_date', 1000);
    const tasks = await base44.asServiceRole.entities.Task.filter({ course: 'tcc' }, '-created_date', 1000);

    let updatedLessons = 0;
    let updatedTasks = 0;

    for (const lesson of lessons) {
      const updates = buildUpdates(lesson, ['title', 'description', 'text_content', 'material_links', 'research_links']);
      if (Object.keys(updates).length > 0) {
        await base44.asServiceRole.entities.RecordedLesson.update(lesson.id, updates);
        updatedLessons += 1;
      }
    }

    for (const task of tasks) {
      const updates = buildUpdates(task, ['title', 'description']);
      if (Object.keys(updates).length > 0) {
        await base44.asServiceRole.entities.Task.update(task.id, updates);
        updatedTasks += 1;
      }
    }

    return Response.json({ success: true, updatedLessons, updatedTasks, message: 'Aulas e trabalhos foram atualizados para Terapia Comportamental.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});