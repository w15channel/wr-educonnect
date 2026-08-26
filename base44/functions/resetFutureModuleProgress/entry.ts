import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const moduleNumber = (value: unknown) => {
  const match = String(value ?? '').match(/(?:mod(?:ule)?[:_-]?|m[oó]dulo\s*)?(\d+)/i);
  const parsed = Number(match?.[1]);
  return Number.isFinite(parsed) ? parsed : 0;
};

const deleteIds = async (entity: any, ids: string[]) => {
  let deleted = 0;
  for (let index = 0; index < ids.length; index += 100) {
    const response = await entity.deleteMany({ id: { $in: ids.slice(index, index + 100) } });
    deleted += response?.deleted || 0;
  }
  return deleted;
};

// Migração administrativa idempotente: preserva todo o Módulo 1 e remove
// somente o progresso antecipado dos módulos 2 em diante e os antigos cortes.
export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const service = base44.asServiceRole.entities;
    const [lessons, tasks, exams, progresses, submissions, examSubmissions, scores, achievements, closures] = await Promise.all([
      service.RecordedLesson.filter({}), service.Task.filter({}), service.Exam.filter({}),
      service.LessonProgress.filter({}), service.TaskSubmission.filter({}), service.ExamSubmission.filter({}),
      service.ScoreItem.filter({}), service.Achievement.filter({}), service.ModuleClosure.filter({}),
    ]);

    const futureLessonIds = new Set(lessons.filter((item: any) => moduleNumber(item.module_number) >= 2).map((item: any) => item.id));
    const futureTaskIds = new Set(tasks.filter((item: any) => moduleNumber(item.module_number) >= 2).map((item: any) => item.id));
    const futureExamIds = new Set(exams.filter((item: any) => moduleNumber(item.module_ref ?? item.module_number) >= 2).map((item: any) => item.id));
    const isFutureRef = (value: unknown) => {
      const ref = String(value ?? '');
      return futureLessonIds.has(ref) || futureTaskIds.has(ref) || futureExamIds.has(ref.replace(/^exam:/, '')) ||
        /(?:^|:)mod(?:ule)?[:_-]?(?:[2-9]|10)(?:[:_-]|$)/i.test(ref);
    };

    const targets = {
      LessonProgress: progresses.filter((item: any) => isFutureRef(item.lesson_id)),
      TaskSubmission: submissions.filter((item: any) => futureTaskIds.has(item.task_id)),
      ExamSubmission: examSubmissions.filter((item: any) => futureExamIds.has(item.exam_id)),
      ScoreItem: scores.filter((item: any) => moduleNumber(item.module_number) >= 2 || isFutureRef(item.ref_id)),
      Achievement: achievements.filter((item: any) => isFutureRef(item.source_id)),
      ModuleClosure: closures,
    };

    const results: Record<string, { found: number; deleted: number }> = {};
    for (const [name, records] of Object.entries(targets)) {
      const ids = (records as any[]).map((item) => item.id);
      results[name] = { found: ids.length, deleted: await deleteIds(service[name], ids) };
    }

    return Response.json({ success: true, preserved_module: 1, results });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
