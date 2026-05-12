import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function normalizeTitle(value = '') {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(tarefa|trabalho|aula)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function extractNumber(value = '') {
  const match = String(value || '').match(/(?:aula|tarefa|trabalho)\s*(\d+)/i);
  return match ? Number(match[1]) : null;
}

function sortByOrder(items) {
  return [...items].sort((a, b) => {
    const ao = Number(a.order || 0);
    const bo = Number(b.order || 0);
    if (ao && bo && ao !== bo) return ao - bo;
    const an = extractNumber(a.title);
    const bn = extractNumber(b.title);
    if (an !== null && bn !== null && an !== bn) return an - bn;
    return String(a.created_date || '').localeCompare(String(b.created_date || ''));
  });
}

function getRecordNumberFromText(record, fields) {
  for (const field of fields) {
    const value = record[field];
    const number = extractNumber(value);
    if (number !== null) return number;
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const course = payload.course || 'tcc';

    const lessons = sortByOrder(await base44.asServiceRole.entities.RecordedLesson.filter({ course }, 'order', 1000));
    const tasks = sortByOrder(await base44.asServiceRole.entities.Task.filter({ course }, '-created_date', 1000));
    const progresses = await base44.asServiceRole.entities.LessonProgress.list('-created_date', 5000);
    const submissions = await base44.asServiceRole.entities.TaskSubmission.list('-created_date', 5000);

    const lessonIds = new Set(lessons.map(l => l.id));
    const taskIds = new Set(tasks.map(t => t.id));
    const lessonByNumber = new Map(lessons.map((lesson, index) => [Number(lesson.order || extractNumber(lesson.title) || index + 1), lesson]));
    const taskByNumber = new Map(tasks.map((task, index) => [Number(extractNumber(task.title) || index + 1), task]));

    const orphanLessonIds = [...new Set(progresses.filter(p => p.lesson_id && !lessonIds.has(p.lesson_id)).map(p => p.lesson_id))]
      .sort((a, b) => {
        const aDate = progresses.find(p => p.lesson_id === a)?.created_date || '';
        const bDate = progresses.find(p => p.lesson_id === b)?.created_date || '';
        return String(aDate).localeCompare(String(bDate));
      });
    const orphanLessonMap = new Map(orphanLessonIds.map((oldId, index) => [oldId, lessons[index]?.id]).filter(([, id]) => id));

    let updatedProgress = 0;
    let updatedSubmissions = 0;

    for (const progress of progresses) {
      if (!progress.lesson_id || lessonIds.has(progress.lesson_id)) continue;
      const newLessonId = orphanLessonMap.get(progress.lesson_id);
      if (!newLessonId) continue;
      await base44.asServiceRole.entities.LessonProgress.update(progress.id, { lesson_id: newLessonId });
      updatedProgress += 1;
    }

    for (const submission of submissions) {
      if (!submission.task_id || taskIds.has(submission.task_id)) continue;

      const number = getRecordNumberFromText(submission, ['task_title', 'file_name', 'comment']);
      let targetTask = number ? taskByNumber.get(number) : null;

      if (!targetTask) {
        const haystack = normalizeTitle([submission.task_title, submission.file_name, submission.comment].filter(Boolean).join(' '));
        targetTask = tasks.find(task => {
          const normalized = normalizeTitle(task.title);
          return normalized && haystack.includes(normalized.slice(0, Math.min(24, normalized.length)));
        });
      }

      if (!targetTask) continue;
      await base44.asServiceRole.entities.TaskSubmission.update(submission.id, { task_id: targetTask.id, course });
      updatedSubmissions += 1;
    }

    return Response.json({
      success: true,
      course,
      activeLessons: lessons.length,
      activeTasks: tasks.length,
      orphanLessonGroups: orphanLessonIds.length,
      updatedProgress,
      updatedSubmissions,
      message: 'Histórico reconectado às aulas e trabalhos atuais sem apagar dados.'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});