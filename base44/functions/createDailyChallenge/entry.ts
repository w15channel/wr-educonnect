import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import {
  buildQuestionsForLesson,
  pickLessonByDayOfYear,
  resolveLessonMeta,
} from './ofensivaGenerator.ts';
import { LESSON_KNOWLEDGE } from './lessonKnowledge.ts';

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

    // Scheduled automation (or no manual params) — generate automatically for today
    const today = ymd(new Date());
    const existing = await base44.asServiceRole.entities.DailyChallenge.filter({ date: today });
    if (existing && existing.length > 0) {
      return Response.json({
        success: true,
        message: 'Ofensiva já gerada para hoje',
        existing_count: existing.length,
      });
    }

    // Select theme based on day of year (rotates through apostila lessons)
    const dayOfYear = Math.floor(
      (new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24),
    );
    const selected = pickLessonByDayOfYear(dayOfYear);
    const formattedQuestions = toStoredQuestions(
      buildQuestionsForLesson(selected, dayOfYear, today),
    );

    // Create DailyChallenge for all courses
    const created = [];
    for (const course of COURSES) {
      const record = await base44.asServiceRole.entities.DailyChallenge.create({
        date: today,
        course,
        lesson_ref: `${selected.moduleTitle} - ${selected.title}`,
        lesson_id: selected.id,
        module_number: moduleNumberFrom(selected.id, selected.moduleTitle),
        questions: formattedQuestions,
      });
      created.push({ course, id: record.id });
    }

    return Response.json({
      success: true,
      message: 'Ofensivas geradas automaticamente com algoritmo temático',
      theme: selected.theme,
      lesson_id: selected.id,
      questions_count: formattedQuestions.length,
      created,
    });
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