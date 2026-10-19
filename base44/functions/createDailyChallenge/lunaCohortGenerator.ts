import { LESSON_KNOWLEDGE } from './lessonKnowledge.ts';
import { buildQuestionsForLesson } from './ofensivaGenerator.ts';

const norm = (value: unknown) => String(value || '').trim().toLowerCase();
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const lessonMap = new Map(LESSON_KNOWLEDGE.flatMap((module) => module.lessons.map((lesson) => [lesson.id, lesson])));

function progressLesson(progress: any, moduleNumber: number) {
  const match = String(progress?.lesson_id || '').match(/mod(\d+)-a\d+/i);
  if (!match || Number(match[1]) !== moduleNumber) return null;
  return lessonMap.get(match[0].toLowerCase()) || null;
}

function currentModules(unlocks: any[]) {
  const byEmail = new Map<string, number>();
  for (const unlock of unlocks) {
    const email = norm(unlock.student_email);
    const moduleNumber = Number(unlock.module_number) || 1;
    if (email && moduleNumber > (byEmail.get(email) || 1)) byEmail.set(email, moduleNumber);
  }
  return byEmail;
}

function chooseLesson(moduleNumber: number, students: any[], progressByEmail: Map<string, any[]>, day: string) {
  const counts = new Map<string, number>();
  for (const student of students) {
    const recent = (progressByEmail.get(norm(student.student_email)) || [])
      .map((progress) => progressLesson(progress, moduleNumber)).filter(Boolean).slice(0, 5);
    for (const lesson of new Map(recent.map((item) => [item.id, item])).values()) counts.set(lesson.id, (counts.get(lesson.id) || 0) + 1);
  }
  const ranked = [...counts].sort((a, b) => b[1] - a[1]).map(([id]) => lessonMap.get(id)).filter(Boolean);
  const fallback = LESSON_KNOWLEDGE.find((item) => item.id === `mod${moduleNumber}`)?.lessons || [];
  const pool = ranked.length ? ranked.slice(0, 5) : fallback;
  const dayNumber = Number(day.replace(/-/g, '')) || 0;
  return pool[dayNumber % Math.max(pool.length, 1)] || LESSON_KNOWLEDGE[0].lessons[0];
}

export function buildCohortQuestions(lesson: any, today: string, course: string) {
  // Banco pedagógico da apostila: mesmas oito questões e níveis de dificuldade,
  // com variação determinística por aula, curso e dia, sem chamadas de IA.
  return buildQuestionsForLesson(lesson, 0, `${today}|${course}`)
    .map(({ id, text, hint }) => ({ id, text, hint }));
}

export async function generateLunaModuleChallenges(base44: any, today: string) {
  const service = base44.asServiceRole.entities;
  const accessCodes = await service.AccessCode.list('-created_date', 10000);
  const unlocks = await service.StudentModuleUnlock.list('-unlocked_at', 10000);
  const progresses = await service.LessonProgress.list('-updated_date', 10000);
  const existing = await service.DailyChallenge.filter({ date: today }, '-created_date', 200);
  const modules = currentModules(unlocks);
  const progressByEmail = new Map<string, any[]>();
  for (const progress of progresses.filter((item) => item.watched)) {
    const email = norm(progress.student_email);
    if (!progressByEmail.has(email)) progressByEmail.set(email, []);
    progressByEmail.get(email)!.push(progress);
  }
  const groups = new Map<string, any[]>();
  for (const student of accessCodes.filter((item) => item.is_active !== false && item.student_email && item.profile_category !== 'admin')) {
    const course = student.course || 'tcc';
    const moduleNumber = modules.get(norm(student.student_email)) || 1;
    const key = `${course}:${moduleNumber}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(student);
  }
  const created = [];
  const skipped = [];
  const failed = [];
  for (const [key, students] of groups) {
    const [course, moduleText] = key.split(':');
    const moduleNumber = Number(moduleText);
    if (existing.some((item) => item.course === course && Number(item.module_number) === moduleNumber)) { skipped.push(key); continue; }
    const lesson = chooseLesson(moduleNumber, students, progressByEmail, today);
    try {
      const questions = buildCohortQuestions(lesson, today, course);
      const record = await service.DailyChallenge.create({ date: today, course, module_number: moduleNumber, lesson_id: lesson.id, lesson_ref: `${lesson.moduleTitle} - ${lesson.title}`, questions, created_by_admin: 'local-module-cohort-v4' });
      created.push({ id: record.id, course, module_number: moduleNumber, lesson_id: lesson.id, students: students.length });
    } catch (error) {
      failed.push({ group: key, error: (error as Error).message });
    }
    await pause(400);
  }
  if (!created.length && failed.length) throw new Error(failed.map((item) => `${item.group}: ${item.error}`).join(' | '));
  return { success: true, generator: 'local-module-cohort-v4', created, skipped, failed };
}