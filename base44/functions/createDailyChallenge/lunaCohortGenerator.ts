import { LESSON_KNOWLEDGE } from './lessonKnowledge.ts';
import { invokePollinations } from '../../shared/pollinations.ts';

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

async function askLuna(_base44: any, lesson: any) {
  const result = await invokePollinations({
    prompt: `Você é Luna, tutora acadêmica. Crie uma Ofensiva Diária com exatamente 8 perguntas abertas, em português do Brasil, exclusivamente sobre a aula abaixo. Preserve esta dificuldade e pontuação: perguntas 1, 2, 4, 5, 7 e 8 são fáceis (0,1 ponto cada: compreensão e aplicação direta); perguntas 3 e 6 são medianas e aparecem em baús (0,2 ponto cada: integração, raciocínio clínico e justificativa). Total: 1,0 ponto. Não faça perguntas genéricas, não repita ideias e não invente conteúdo fora da aula. Cada pergunta deve ter uma dica curta, sem entregar a resposta.

Módulo: ${lesson.moduleTitle}
Aula: ${lesson.title}
Tema: ${lesson.theme}
Conceitos: ${lesson.concepts.join('; ')}
Técnicas: ${lesson.techniques.join('; ')}
Pontos centrais: ${lesson.insights.join(' ')}`,
    response_json_schema: {
      type: 'object',
      properties: {
        questions: {
          type: 'array', minItems: 8, maxItems: 8,
          items: { type: 'object', properties: { text: { type: 'string' }, hint: { type: 'string' } }, required: ['text', 'hint'] },
        },
      },
      required: ['questions'],
    },
  });
  const questions = Array.isArray(result?.questions) ? result.questions : [];
  if (questions.length !== 8) throw new Error(`A Luna retornou ${questions.length} perguntas para ${lesson.id}.`);
  return questions.map((question, index) => ({ id: `q${index + 1}`, text: String(question.text).trim(), hint: String(question.hint).trim() }));
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
      const questions = await askLuna(base44, lesson);
      const record = await service.DailyChallenge.create({ date: today, course, module_number: moduleNumber, lesson_id: lesson.id, lesson_ref: `${lesson.moduleTitle} - ${lesson.title}`, questions, created_by_admin: 'luna-ai-module-cohort-v3' });
      created.push({ id: record.id, course, module_number: moduleNumber, lesson_id: lesson.id, students: students.length });
    } catch (error) {
      failed.push({ group: key, error: (error as Error).message });
    }
    await pause(400);
  }
  if (!created.length && failed.length) throw new Error(failed.map((item) => `${item.group}: ${item.error}`).join(' | '));
  return { success: true, generator: 'luna-ai-module-cohort-v3', created, skipped, failed };
}
