import {
  buildQuestionsForLesson,
  resolveLessonMeta,
} from '../../base44/functions/createDailyChallenge/ofensivaGenerator';
import { LESSON_KNOWLEDGE } from '../../base44/functions/createDailyChallenge/lessonKnowledge';

export const OFENSIVA_COURSES = ['tcc', 'psicanalise', 'sexologia'];
export const OFENSIVA_MODULES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const AUTOMATION_SCHEDULE_LABEL = 'Automação Diária Ativa · 00:05 BRT';

export function getTodayDateBRT(now = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const y = parts.find((p) => p.type === 'year')?.value;
    const m = parts.find((p) => p.type === 'month')?.value;
    const d = parts.find((p) => p.type === 'day')?.value;
    if (y && m && d) return `${y}-${m}-${d}`;
  } catch {
    // fallback below
  }
  const brtTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return brtTime.toISOString().split('T')[0];
}

function addDays(dateStr, offset) {
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function moduleNumberFrom(...values) {
  for (const value of values) {
    const match = String(value ?? '').match(/(\d{1,2})/);
    const parsed = match ? Number(match[1]) : NaN;
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 10) return parsed;
  }
  return 1;
}

function pickDefaultLessonIdForModule(modNum, dateStr) {
  const modId = `mod${modNum}`;
  const modEntry = (LESSON_KNOWLEDGE || []).find((m) => m.id === modId);
  const lessons = modEntry?.lessons || [];
  if (!lessons.length) return `${modId}-a1`;
  let hash = 0;
  const seed = `${dateStr}:${modId}`;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return lessons[hash % lessons.length].id;
}

export function buildDailyChallengeData({
  course = 'tcc',
  moduleNumber = 1,
  moduleId = null,
  lessonId = null,
  date = getTodayDateBRT(),
  dayOffset = 0,
}) {
  const modNum = moduleNumberFrom(moduleNumber, moduleId, lessonId);
  const resolvedModId = moduleId || `mod${modNum}`;
  const resolvedLessonId = lessonId || pickDefaultLessonIdForModule(modNum, date);
  const normalizedCourse = String(course || 'tcc').toLowerCase().trim();

  const {
    knowledge,
    lessonId: selectedLessonId,
    lessonRef,
    theme,
  } = resolveLessonMeta(resolvedModId, resolvedLessonId);

  const rawQuestions = buildQuestionsForLesson(
    knowledge,
    dayOffset,
    `${date}|${normalizedCourse}|m${modNum}`
  );

  const questions = rawQuestions.map(({ id, text, hint }) => ({
    id,
    text,
    hint,
  }));

  return {
    date,
    course: normalizedCourse,
    lesson_ref: lessonRef,
    lesson_id: selectedLessonId,
    module_number: modNum,
    theme_title: theme,
    questions,
    active: true,
    created_by_admin: 'ofensiva-generator-v2',
    generated_by: AUTOMATION_SCHEDULE_LABEL,
  };
}

export function runCreateDailyChallenge({
  getCollection,
  createRecord,
  updateRecord,
  payload = {},
}) {
  const today = payload?.date || getTodayDateBRT();
  const force = payload?.force === true;

  // Manual generation from Admin UI with module_id / lesson_id / duration_days
  if (payload?.module_id || payload?.lesson_id || payload?.duration_days) {
    const course = String(payload?.course || 'tcc').toLowerCase().trim();
    const duration = [1, 3, 5, 7].includes(Number(payload?.duration_days))
      ? Number(payload.duration_days)
      : 1;
    const modNum = moduleNumberFrom(
      payload?.module_number,
      payload?.module_id,
      payload?.lesson_id
    );
    const {
      knowledge,
      lessonId: selectedLessonId,
      theme,
    } = resolveLessonMeta(payload?.module_id || `mod${modNum}`, payload?.lesson_id);

    const results = [];
    for (let offset = 0; offset < duration; offset += 1) {
      const date = addDays(today, offset);
      const existingAll = getCollection('DailyChallenge');
      const existing = existingAll.find(
        (c) =>
          c.date === date &&
          String(c.course || 'tcc').toLowerCase() === course &&
          Number(c.module_number || 1) === modNum
      );

      const data = buildDailyChallengeData({
        course,
        moduleNumber: modNum,
        moduleId: payload?.module_id || `mod${modNum}`,
        lessonId: selectedLessonId,
        date,
        dayOffset: offset,
      });

      const themeChanged = existing && existing.lesson_id !== selectedLessonId;

      if (existing && (force || themeChanged)) {
        const updated = updateRecord('DailyChallenge', existing.id, data);
        results.push({ date, id: updated?.id || existing.id, action: 'updated' });
      } else if (existing) {
        results.push({ date, id: existing.id, action: 'skipped' });
      } else {
        const created = createRecord('DailyChallenge', data);
        results.push({ date, id: created.id, action: 'created' });
      }
    }

    return {
      success: true,
      module: knowledge.moduleTitle,
      theme,
      lesson_id: selectedLessonId,
      duration_days: duration,
      generator: 'thematic-ai-offline-v2',
      knowledge_modules: LESSON_KNOWLEDGE.length,
      results,
      created: results.filter((r) => r.action === 'created').length,
      updated: results.filter((r) => r.action === 'updated').length,
      skipped: results.filter((r) => r.action === 'skipped').length,
    };
  }

  // Scheduled / automatic generation across courses and modules
  const targetCourses = payload?.course
    ? [String(payload.course).toLowerCase()]
    : OFENSIVA_COURSES;
  const targetModules = payload?.module_number
    ? [Number(payload.module_number)]
    : OFENSIVA_MODULES;

  const existingAll = getCollection('DailyChallenge');
  const results = [];
  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const course of targetCourses) {
    for (const modNum of targetModules) {
      const existing = existingAll.find(
        (c) =>
          c.date === today &&
          String(c.course || 'tcc').toLowerCase() === course &&
          Number(c.module_number || 1) === Number(modNum)
      );

      if (existing && !force && Array.isArray(existing.questions) && existing.questions.length >= 8) {
        results.push(existing);
        skippedCount += 1;
        continue;
      }

      const data = buildDailyChallengeData({
        course,
        moduleNumber: modNum,
        date: today,
        dayOffset: 0,
      });

      if (existing) {
        const updated = updateRecord('DailyChallenge', existing.id, data);
        results.push(updated);
        updatedCount += 1;
      } else {
        const created = createRecord('DailyChallenge', data);
        results.push(created);
        createdCount += 1;
      }
    }
  }

  return {
    success: true,
    status: createdCount > 0 || updatedCount > 0 ? 'created' : 'already_exists',
    date: today,
    created: createdCount,
    updated: updatedCount,
    skipped: skippedCount,
    created_count: createdCount,
    total_available: results.length,
    challenge: results[0] || null,
    challenges: results,
    automation: {
      enabled: true,
      schedule: '00:05 BRT',
      lastRunDate: today,
    },
  };
}

let automationTimerId = null;

export function startDailyOfensivaAutomation({
  getCollection,
  createRecord,
  updateRecord,
}) {
  const ensureToday = () => {
    try {
      const today = getTodayDateBRT();
      const existing = getCollection('DailyChallenge');
      const hasAllTccModules = OFENSIVA_MODULES.every((modNum) =>
        existing.some(
          (c) =>
            c.date === today &&
            String(c.course || 'tcc').toLowerCase() === 'tcc' &&
            Number(c.module_number || 1) === modNum &&
            Array.isArray(c.questions) &&
            c.questions.length >= 8
        )
      );
      if (!hasAllTccModules) {
        runCreateDailyChallenge({
          getCollection,
          createRecord,
          updateRecord,
          payload: { date: today, force: false },
        });
      }
    } catch (err) {
      console.warn('[Ofensiva Automation]:', err);
    }
  };

  ensureToday();

  if (typeof window !== 'undefined' && !automationTimerId) {
    automationTimerId = window.setInterval(ensureToday, 60 * 1000);
  }
}
