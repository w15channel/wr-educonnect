import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import useModuleAccess from '@/hooks/useModuleAccess';
import useStudentRecords from '@/hooks/useStudentRecords';

const LESSONS_PER_MODULE = 5;
const MODULE_COUNT = 10;

const parseModuleNumber = (value) => {
  const digits = String(value ?? '').match(/\d+/);
  const parsed = digits ? Number(digits[0]) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

// O progresso continua disponível, mas não libera mais conteúdos.
// O acesso segue exclusivamente o calendário e as liberações preservadas.
export default function useApostilaModuleUnlocks(course, session) {
  const studentEmail = session?.email || session?.code || '';
  const isTeacher = session?.role === 'admin';
  const access = useModuleAccess(course, session);

  const { data: recordedLessons = [], isLoading: loadingLessons } = useQuery({
    queryKey: ['apostila-unlock-lessons', course],
    queryFn: () => base44.entities.RecordedLesson.filter({ course }, 'order', 200),
    enabled: !!course,
  });
  const { data: progresses = [], isLoading: loadingProgress } = useStudentRecords('LessonProgress', session);
  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['apostila-unlock-tasks', course],
    queryFn: () => base44.entities.Task.filter({ course }, '-created_date', 300),
    enabled: !!course,
  });
  const { data: submissions = [], isLoading: loadingSubmissions } = useStudentRecords('TaskSubmission', session);
  const { data: exams = [], isLoading: loadingExams } = useQuery({
    queryKey: ['apostila-unlock-exams', course],
    queryFn: () => base44.entities.Exam.filter({ course }, '-created_date', 300),
    enabled: !!course,
  });
  const { data: examSubmissions = [], isLoading: loadingExamSubs } = useQuery({
    queryKey: ['apostila-unlock-exam-subs', studentEmail],
    queryFn: () => base44.entities.ExamSubmission.filter({ student_email: studentEmail }, '-submitted_at', 500),
    enabled: !!studentEmail,
  });

  const isLoading = loadingLessons || loadingProgress || loadingTasks || loadingSubmissions || loadingExams || loadingExamSubs;

  const watchedLessonIds = new Set(progresses.filter((p) => p.watched).map((p) => p.lesson_id));
  const submittedTaskIds = new Set(submissions.map((s) => s.task_id));
  const submittedExamIds = new Set(examSubmissions.map((s) => s.exam_id));
  const visibleLessons = isTeacher ? recordedLessons : recordedLessons.filter((lesson) => !lesson.is_hidden);
  const visibleTasks = isTeacher ? tasks : tasks.filter((task) => !task.is_hidden);
  const visibleExams = isTeacher ? exams : exams.filter((exam) => exam.is_published !== false);
  const orderedLessons = [...visibleLessons].sort((a, b) => (a.order || 0) - (b.order || 0));

  const moduleComplete = [];
  const moduleExamDone = [];
  for (let i = 0; i < MODULE_COUNT; i++) {
    const moduleLessons = orderedLessons.slice(i * LESSONS_PER_MODULE, (i + 1) * LESSONS_PER_MODULE);
    const lessonsDone = moduleLessons.length === 0 || moduleLessons.every((l) => watchedLessonIds.has(l.id));
    const moduleTasks = visibleTasks.filter((t) => Number(t.module_number) === i + 1 && t.type !== 'quiz');
    const tasksDone = moduleTasks.length === 0 || moduleTasks.every((t) => submittedTaskIds.has(t.id));
    // A prova do módulo é o critério final: enquanto ela não existir/não for feita,
    // o módulo continua em andamento e o próximo permanece bloqueado.
    const moduleExams = visibleExams.filter((e) => parseModuleNumber(e.module_ref) === i + 1);
    const examDone = moduleExams.length > 0 && moduleExams.every((e) => submittedExamIds.has(e.id));
    moduleExamDone.push(examDone);
    moduleComplete.push(lessonsDone && tasksDone && examDone);
  }

  // Os cinco primeiros módulos são de livre acesso para todos os alunos.
  // A partir do módulo 6, a prova do módulo anterior volta a proteger a trilha.
  const moduleUnlocked = Array.from({ length: MODULE_COUNT }, (_, index) => (
    isTeacher || index < 5 || moduleExamDone[index - 1] === true
  ));

  return { moduleUnlocked, moduleComplete, moduleExamDone, isLoading: isLoading || access.isLoading };
}
