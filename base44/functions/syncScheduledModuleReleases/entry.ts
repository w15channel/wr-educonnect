import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { completeReleaseSchedule, readAll, pause, planModuleReleases } from '../../shared/moduleReleasePlan.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const payload = await req.json();
    const store = base44.asServiceRole.entities;
    // O calendário embarcado impede que registros ausentes ou uma automação
    // anterior sem créditos interrompam a progressão da turma.
    const schedule = completeReleaseSchedule(await readAll(store.ModuleReleaseSchedule));
    const codes = await readAll(store.AccessCode);
    const unlocks = await readAll(store.StudentModuleUnlock);
    let initialData = null;
    if (payload.initial_migration === true) {
      initialData = {};
      for (const [key, entity] of Object.entries({ profiles: 'StudentProfile', lessons: 'RecordedLesson', tasks: 'Task', exams: 'Exam', examSubs: 'ExamSubmission', progress: 'LessonProgress', submissions: 'TaskSubmission' })) {
        initialData[key] = await readAll(store[entity]);
      }
    }
    const records = planModuleReleases(codes, unlocks, schedule, new Date().toISOString(), initialData);
    if (payload.dry_run !== true) {
      for (let offset = 0; offset < records.length; offset += 50) {
        await store.StudentModuleUnlock.bulkCreate(records.slice(offset, offset + 50));
        await pause();
      }
    }
    return Response.json({ success: true, dry_run: payload.dry_run === true, students: codes.length, preserved: unlocks.length, planned: records.length, created: payload.dry_run === true ? 0 : records.length, reasons: records.reduce((acc, r) => ({ ...acc, [r.unlocked_by]: (acc[r.unlocked_by] || 0) + 1 }), {}) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
