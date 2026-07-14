import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const LESSONS_PER_MODULE = 5;
const MODULE_COUNT = 10;

// Calcula, para os 10 módulos da apostila, se o aluno já assistiu todas as aulas
// gravadas e entregou todos os trabalhos vinculados àquele módulo. O módulo 1
// está sempre liberado; os demais só liberam quando o módulo anterior é concluído.
export default function useApostilaModuleUnlocks(course, session) {
  const studentEmail = session?.email || session?.code || '';

  const { data: recordedLessons = [], isLoading: loadingLessons } = useQuery({
    queryKey: ['apostila-unlock-lessons', course],
    queryFn: () => base44.entities.RecordedLesson.filter({ course }, 'order', 200),
  });
  const { data: progresses = [], isLoading: loadingProgress } = useQuery({
    queryKey: ['apostila-unlock-progress', studentEmail],
    queryFn: () => base44.entities.LessonProgress.filter({ student_email: studentEmail }, '-created_date', 1000),
    enabled: !!studentEmail,
  });
  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['apostila-unlock-tasks', course],
    queryFn: () => base44.entities.Task.filter({ course }, '-created_date', 300),
  });
  const { data: submissions = [], isLoading: loadingSubmissions } = useQuery({
    queryKey: ['apostila-unlock-submissions', studentEmail],
    queryFn: () => base44.entities.TaskSubmission.filter({ student_email: studentEmail }, '-created_date', 1000),
    enabled: !!studentEmail,
  });

  const isLoading = loadingLessons || loadingProgress || loadingTasks || loadingSubmissions;

  const watchedLessonIds = new Set(progresses.filter((p) => p.watched).map((p) => p.lesson_id));
  const submittedTaskIds = new Set(submissions.map((s) => s.task_id));
  const orderedLessons = [...recordedLessons].sort((a, b) => (a.order || 0) - (b.order || 0));

  const moduleComplete = [];
  for (let i = 0; i < MODULE_COUNT; i++) {
    const moduleLessons = orderedLessons.slice(i * LESSONS_PER_MODULE, (i + 1) * LESSONS_PER_MODULE);
    const lessonsDone = moduleLessons.length === 0 || moduleLessons.every((l) => watchedLessonIds.has(l.id));
    const moduleTasks = tasks.filter((t) => Number(t.module_number) === i + 1);
    const tasksDone = moduleTasks.length === 0 || moduleTasks.every((t) => submittedTaskIds.has(t.id));
    moduleComplete.push(lessonsDone && tasksDone);
  }

  const moduleUnlocked = [];
  for (let i = 0; i < MODULE_COUNT; i++) {
    moduleUnlocked.push(i === 0 ? true : moduleUnlocked[i - 1] && moduleComplete[i - 1]);
  }

  return { moduleUnlocked, moduleComplete, isLoading };
}