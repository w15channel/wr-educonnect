import { readAll, pause } from './moduleReleasePlan.ts';
import { normalizeIdentity } from './checklistVerification.ts';

export async function checklistRoster(store) {
  const codes = await readAll(store.AccessCode);
  const profiles = await readAll(store.StudentProfile);
  const roster = codes.filter(c => c.is_active !== false && (!c.profile_category || c.profile_category === 'student')).map(code => {
    const linked = profiles.filter(p => p.code_id === code.id || (!p.code_id && normalizeIdentity(p.student_email) === normalizeIdentity(code.student_email || code.code)));
    return { key: `code:${code.id}`, code_id: code.id, email: code.student_email || code.code, course: code.course || 'tcc', aliases: [...new Set([code.student_email, code.code, ...linked.flatMap(p => [p.student_email, p.email])].map(normalizeIdentity).filter(Boolean))] };
  });
  for (const profile of profiles) {
    if (profile.code_id || !profile.student_email || codes.some(c => normalizeIdentity(c.student_email || c.code) === normalizeIdentity(profile.student_email))) continue;
    const course = profile.dashboard_course || 'tcc';
    if (!roster.some(s => s.course === course && s.aliases.includes(normalizeIdentity(profile.student_email)))) roster.push({ key: `profile:${profile.id}`, email: profile.student_email, course, aliases: [...new Set([profile.student_email, profile.email].map(normalizeIdentity).filter(Boolean))] });
  }
  // Never credit evidence under an identifier shared by distinct students in the same course.
  const owners = new Map();
  for (const student of roster) for (const alias of student.aliases) {
    const key = `${student.course}:${alias}`;
    owners.set(key, (owners.get(key) || 0) + 1);
  }
  for (const student of roster) student.aliases = student.aliases.filter(alias => owners.get(`${student.course}:${alias}`) === 1);
  return roster.sort((a, b) => a.key.localeCompare(b.key));
}

export async function checklistBatchData(store, students) {
  const aliases = new Set(students.flatMap(student => student.aliases));
  const fields = { LessonProgress: 'student_email', TaskSubmission: 'student_email', ExamSubmission: 'student_email', DailyChallengeResponse: 'student_email', StudentModuleUnlock: 'student_email', ForumReply: 'author_email', Tuition: 'student_email' };
  const data = {};
  const courses = [...new Set(students.map(student => student.course))];
  const courseQuery = courses.includes('tcc') ? { $or: [{ course: { $in: courses } }, { course: { $exists: false } }, { course: '' }] } : { course: { $in: courses } };
  const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const identityPatterns = [...aliases].map(alias => `^${escape(alias)}$`);
  const keys = ['id', 'student_email', 'author_email', 'course', 'module_number', 'module_ref', 'type', 'status', 'is_hidden', 'lesson_id', 'watched', 'task_id', 'exam_id', 'challenge_id', 'date', 'post_id', 'topic', 'space', 'created_date', 'updated_date', 'submitted_at', 'unlocked_at', 'release_at', 'paid_amount', 'paid_date', 'wall_shared'];
  // Sync only the selected students' evidence; read every matching page with pauses.
  for (const name of ['Task', 'Exam', 'ForumPost', 'DailyChallenge', 'ModuleReleaseSchedule', ...Object.keys(fields)]) {
    data[name] = [];
    if (fields[name] && !aliases.size) continue;
    const query = fields[name] ? { $or: identityPatterns.map(pattern => ({ [fields[name]]: { $regex: pattern, $options: 'i' } })) } : name === 'ModuleReleaseSchedule' ? {} : courseQuery;
    let cursor;
    do {
      const page = await store[name].filter(query, { sort: 'created_date', limit: 500, cursor, fields: name === 'TaskSubmission' ? [...keys, 'file_url', 'comment', 'quiz_answers'] : keys })
        .catch(error => { throw new Error(`Consulta de ${name}: ${error.message}`); });
      for (const row of page.items) {
        const evidence = Object.fromEntries(keys.filter(key => row[key] !== undefined).map(key => [key, row[key]]));
        if (name === 'TaskSubmission') {
          evidence.file_url = row.file_url ? 'present' : '';
          evidence.comment = [row.comment, ...(row.quiz_answers || []).map(a => a?.text)].filter(Boolean).join(' ').trim() ? 'present' : '';
        }
        data[name].push(evidence);
      }
      await pause();
      cursor = page.has_more ? page.next_cursor : null;
    } while (cursor);
  }
  return data;
}