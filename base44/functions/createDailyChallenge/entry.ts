import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import {
  buildQuestionsForLesson,
  pickLessonByDayOfYear,
  resolveLessonMeta,
} from './ofensivaGenerator.ts';
import { LESSON_KNOWLEDGE } from './lessonKnowledge.ts';
import { generateLunaModuleChallenges } from './lunaCohortGenerator.ts';

const COURSES = ['tcc', 'psicanalise', 'sexologia'];

function ymd(date: Date) {
  return date.toISOString().slice(0, 10);
}

function normalizePayload(raw: any) {
  return raw?.data && typeof raw.data === 'object' ? raw.data : raw;
}

function addDays(dateStr: string, offset: number) {
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return ymd(date);
}

// Todas as ofensivas guardam o módulo (1-10) a que pertencem, para que o
// histórico acadêmico do aluno não conte a mesma atividade em dois módulos.
function moduleNumberFrom(...values: unknown[]) {
  for (const value of values) {
    const match = String(value ?? '').match(/(\d{1,2})/);
    const parsed = match ? Number(match[1]) : NaN;
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 10) return parsed;
  }
  return 1;
}

function clampDuration(value: unknown) {
  const duration = Number(value || 1);
  if (![1, 3, 5, 7].includes(duration)) return 1;
  return duration;
}

function toStoredQuestions(questions: ReturnType<typeof buildQuestionsForLesson>) {
  // Persist only fields expected by DailyChallenge schema (id/text/hint).
  return questions.map(({ id, text, hint }) => ({ id, text, hint }));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const rawPayload = await req.json().catch(() => ({}));

    // Check automation type on the RAW payload before normalization, since
    // normalizePayload may unwrap `.data` and discard the `automation` key.
    const isScheduledAutomation =
      rawPayload?.automation?.type === 'scheduled' ||
      rawPayload?.data?.automation?.type === 'scheduled';

    const payload = normalizePayload(rawPayload);

    // Also treat as scheduled when no manual params are present (extra safety)
    const hasManualParams = payload?.course || payload?.questions || payload?.module_id;

    // Manual save with explicit questions
    if (!isScheduledAutomation && hasManualParams) {
      const { date, course, lesson_ref, lesson_id, questions, force = false } = payload;
      if (date && course && questions && questions.length >= 3) {
        const record = await base44.asServiceRole.entities.DailyChallenge.create({
          date,
          course,
          lesson_ref: lesson_ref || null,
          lesson_id: lesson_id || null,
          module_number: moduleNumberFrom(payload?.module_number, payload?.module_id, lesson_id, lesson_ref),
          questions: questions.slice(0, 8),
        });
        return Response.json({ success: true, id: record.id });
      }

      // Admin generation from the app sends { course, force, module_id, lesson_id, duration_days }.
      if (!course || !COURSES.includes(course)) {
        return Response.json({ error: 'Curso inválido' }, { status: 400 });
      }
      return await generateChallengeForCourse(
        base44,
        course,
        force,
        payload?.module_id,
        payload?.lesson_id,
        payload?.duration_days,
      );
    }

    // A automação diária agrupa alunos por curso e módulo atual. A Luna gera uma
    // única trilha por grupo, usando como tema uma das cinco aulas recentes do grupo.
    const today = ymd(new Date());
    const result = await generateLunaModuleChallenges(base44, today);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});

async function generateChallengeForCourse(
  base44: any,
  course: string,
  force = false,
  moduleId = 'mod1',
  lessonId = 'mod1-a1',
  durationDays = 1,
) {
  const today = ymd(new Date());
  const safeDuration = clampDuration(durationDays);
  const { knowledge, lessonId: selectedLessonId, lessonRef, theme } = resolveLessonMeta(
    moduleId,
    lessonId,
  );
  const results = [];

  for (let offset = 0; offset < safeDuration; offset += 1) {
    const date = addDays(today, offset);
    const existing = await base44.asServiceRole.entities.DailyChallenge.filter({ course, date });
    const questions = toStoredQuestions(
      buildQuestionsForLesson(knowledge, offset, `${date}|${course}`),
    );
    const data = {
      date,
      course,
      lesson_ref: lessonRef,
      lesson_id: selectedLessonId,
      module_number: moduleNumberFrom(moduleId, selectedLessonId, lessonRef),
      questions,
      created_by_admin: 'ofensiva-generator-v2',
    };

    // Applies the selected theme whenever it differs from what's already stored,
    // even without an explicit "force". This is what makes picking a new
    // módulo/tema in the admin panel actually take effect immediately —
    // previously, an existing DailyChallenge for the date silently blocked any
    // update unless "force" was set, so choosing a different theme appeared to
    // do nothing.
    const themeChanged = existing?.length > 0 && existing[0]?.lesson_id !== selectedLessonId;

    if (existing?.length && (force || themeChanged)) {
      await base44.asServiceRole.entities.DailyChallenge.update(existing[0].id, data);
      results.push({ date, id: existing[0].id, action: 'updated' });
    } else if (existing?.length) {
      results.push({ date, id: existing[0].id, action: 'skipped' });
    } else {
      const record = await base44.asServiceRole.entities.DailyChallenge.create(data);
      results.push({ date, id: record.id, action: 'created' });
    }
  }

  return Response.json({
    success: true,
    module: knowledge.moduleTitle,
    theme,
    lesson_id: selectedLessonId,
    duration_days: safeDuration,
    generator: 'thematic-ai-offline-v2',
    knowledge_modules: LESSON_KNOWLEDGE.length,
    results,
    created: results.filter((r) => r.action === 'created').length,
    updated: results.filter((r) => r.action === 'updated').length,
    skipped: results.filter((r) => r.action === 'skipped').length,
  });
}