export const normalizeIdentity = value => String(value || '').trim().toLowerCase();
const moduleOf = value => Number(String(value || '').match(/\d+/)?.[0]) || null;
const courseOf = row => ({ psi: 'psicanalise', sex: 'sexologia' }[row.course] || row.course || 'tcc');
const unique = values => [...new Set(values.filter(Boolean))];
const hasSubmission = row => !!row.file_url || !![row.comment, ...(row.quiz_answers || []).map(a => a?.text)].filter(Boolean).join(' ').trim();
const item = (key, ids, target, count = unique(ids).length) => ({ key, current: count, target, done: count >= target, source_ids: unique(ids) });

export function buildVerifiedChecklist(student, data, now) {
  const owns = value => student.aliases.includes(normalizeIdentity(value));
  const mine = name => (data[name] || []).filter(row => owns(row.student_email));
  const course = student.course;
  const tasks = data.Task.filter(row => courseOf(row) === course && row.type !== 'quiz' && !row.is_hidden);
  const exams = data.Exam.filter(row => courseOf(row) === course);
  const progresses = mine('LessonProgress');
  const submissions = mine('TaskSubmission');
  const examSubs = mine('ExamSubmission');
  const submittedIds = new Set(examSubs.map(row => row.exam_id));
  const posts = data.ForumPost.filter(row => courseOf(row) === course && row.space !== 'forum');
  const postById = new Map(posts.map(row => [row.id, row]));
  const challengeById = new Map(data.DailyChallenge.map(row => [row.id, row]));
  const unlocks = mine('StudentModuleUnlock').filter(row => courseOf(row) === course && Date.parse(row.unlocked_at) <= Date.parse(now));
  const dates = new Map();
  for (const row of unlocks.sort((a, b) => Date.parse(a.unlocked_at) - Date.parse(b.unlocked_at))) {
    if (!dates.has(Number(row.module_number))) dates.set(Number(row.module_number), row.unlocked_at);
  }
  for (const row of data.ModuleReleaseSchedule) {
    if (!dates.has(Number(row.module_number)) && Date.parse(row.release_at) <= Date.parse(now)) dates.set(Number(row.module_number), row.release_at);
  }
  const modules = [];
  for (let number = 1; number <= 10; number++) {
    if (number !== 1 && !dates.has(number)) continue;
    // Explicit academic module wins; unlabelled legacy evidence belongs to one time window only.
    const within = value => {
      const at = Date.parse(value);
      const start = dates.get(number);
      const end = [...dates.entries()].filter(([n]) => n > number).sort(([a], [b]) => a - b)[0]?.[1];
      return Number.isFinite(at) && (!start || at >= Date.parse(start)) && (!end || at < Date.parse(end));
    };
    const matchesPost = (post, date) => {
      const explicit = Number(String(post.topic || '').match(/^(\d+)\./)?.[1]);
      return explicit ? explicit === number : within(date);
    };
    const reads = progresses.filter(row => row.watched && String(row.lesson_id || '').startsWith(`apostila:mod${number}:`));
    const moduleTasks = tasks.filter(row => Number(row.module_number) === number);
    const doneTasks = moduleTasks.filter(task => submissions.some(row => row.task_id === task.id && hasSubmission(row)));
    const topics = posts.filter(row => owns(row.author_email) && matchesPost(row, row.created_date));
    const replies = data.ForumReply.filter(row => {
      const parent = postById.get(row.post_id);
      return owns(row.author_email) && parent && !owns(parent.author_email) && matchesPost(parent, row.created_date);
    });
    const responses = mine('DailyChallengeResponse').filter(row => {
      if (courseOf(row) !== course || !row.date) return false;
      const challenge = challengeById.get(row.challenge_id);
      if (challenge && courseOf(challenge) !== course) return false;
      const explicit = Number(challenge?.module_number || row.module_number);
      return explicit ? explicit === number : within(`${row.date}T12:00:00-03:00`);
    });
    const previous = exams.filter(row => moduleOf(row.module_ref) === number - 1);
    const currentExams = exams.filter(row => moduleOf(row.module_ref) === number);
    const items = [
      ...(number > 1 ? [item('previous_exam', examSubs.filter(row => previous.some(e => e.id === row.exam_id)).map(row => row.id), 1, previous.every(row => submittedIds.has(row.id)) ? 1 : 0)] : []),
      item('apostila', reads.map(row => row.id), 5, unique(reads.map(row => row.lesson_id)).length),
      item('tasks', submissions.filter(row => doneTasks.some(task => task.id === row.task_id) && hasSubmission(row)).map(row => row.id), moduleTasks.length || 5, doneTasks.length),
      item('debate_topic', topics.map(row => row.id), 1, Math.min(topics.length, 1)),
      item('debate_comment', replies.map(row => row.id), 1, Math.min(replies.length, 1)),
      item('ofensiva', responses.map(row => row.id), 3, Math.min(unique(responses.map(row => row.date)).length, 3)),
    ];
    const tuitions = mine('Tuition');
    for (const tuition of tuitions) items.push(item(`tuition_${tuition.id}`, [tuition.id], 1, tuition.status === 'paid' ? 1 : 0));
    modules.push({ moduleNumber: number, items, complete: items.every(row => row.done), task_ids: moduleTasks.map(row => row.id).sort(), previous_exam_ids: previous.map(row => row.id).sort(), exam_ids: currentExams.map(row => row.id).sort(), examDone: currentExams.length > 0 && currentExams.every(row => submittedIds.has(row.id)) });
  }
  return { student_key: student.key, code_id: student.code_id || '', student_email: student.email, course, verified_at: now, rules_version: 1, modules,
    tuitions: mine('Tuition').map(({ id, month_ref, due_date, status, created_date, updated_date }) => ({ id, month_ref, due_date, status, created_date, updated_date })) };
}