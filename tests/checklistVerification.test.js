import { it, expect } from 'vitest';
import { buildVerifiedChecklist } from '../base44/shared/checklistVerification.ts';
import { applyChecklistVerification, mergeVerifiedTuitions } from '../src/lib/verifiedChecklist.js';
const student = { key: 'code:1', code_id: '1', email: 'Student@Example.com', course: 'tcc', aliases: ['student@example.com', 'edu-1'] };
const empty = () => Object.fromEntries(['Task', 'Exam', 'ForumPost', 'ForumReply', 'DailyChallenge', 'ModuleReleaseSchedule', 'LessonProgress', 'TaskSubmission', 'ExamSubmission', 'DailyChallengeResponse', 'Tuition', 'StudentModuleUnlock'].map(key => [key, []]));
const run = data => buildVerifiedChecklist(student, data, '2026-09-27T15:00:00Z');
const find = (result, module, key) => result.modules.find(row => row.moduleNumber === module).items.find(row => row.key === key);
it('recognizes aliases and a valid submission among duplicates', () => {
  const data = empty(); data.Task = [{ id: 't', module_number: 1, course: 'tcc' }];
  data.TaskSubmission = [{ id: 'empty', task_id: 't', student_email: 'edu-1' }, { id: 'valid', task_id: 't', student_email: ' STUDENT@example.com ', comment: 'Entregue' }];
  expect(find(run(data), 1, 'tasks')).toMatchObject({ done: true, current: 1, source_ids: ['valid'] });
});
it('does not duplicate reads or borrow other students records', () => {
  const data = empty(); data.LessonProgress = [{ id: 'a', student_email: 'edu-1', lesson_id: 'apostila:mod1:1', watched: true }, { id: 'b', student_email: 'student@example.com', lesson_id: 'apostila:mod1:1', watched: true }, { id: 'c', student_email: 'other@example.com', lesson_id: 'apostila:mod1:2', watched: true }];
  expect(find(run(data), 1, 'apostila').current).toBe(1);
});
it('assigns legacy debate replies by parent topic module', () => {
  const data = empty(); data.ModuleReleaseSchedule = [{ module_number: 2, release_at: '2026-09-01T00:00:00Z' }];
  data.ForumPost = [{ id: 'p', topic: '2.1 Tema', author_email: 'other@example.com', course: 'tcc', space: 'debates' }];
  data.ForumReply = [{ id: 'r', post_id: 'p', author_email: 'EDU-1', space: 'forum' }];
  expect(find(run(data), 2, 'debate_comment').done).toBe(true);
  expect(find(run(data), 1, 'debate_comment').done).toBe(false);
});
it('counts unique challenge days only for the correct module', () => {
  const data = empty(); data.ModuleReleaseSchedule = [{ module_number: 2, release_at: '2026-09-01T00:00:00Z' }];
  data.DailyChallenge = [{ id: 'c', module_number: 2, course: 'tcc' }];
  data.DailyChallengeResponse = ['2026-09-01', '2026-09-01', '2026-09-02', '2026-09-03'].map((date, i) => ({ id: String(i), challenge_id: 'c', date, student_email: 'edu-1', course: 'tcc' }));
  expect(find(run(data), 2, 'ofensiva').current).toBe(3);
  expect(find(run(data), 1, 'ofensiva').current).toBe(0);
});
it('requires actual exam submissions without making payment a checklist requirement', () => {
  const data = empty(); data.ModuleReleaseSchedule = [{ module_number: 2, release_at: '2026-09-01T00:00:00Z' }];
  data.Exam = [{ id: 'e', module_ref: 'Módulo 1' }]; data.Tuition = [{ id: 't', student_email: 'edu-1', status: 'pending' }];
  expect(find(run(data), 2, 'previous_exam').done).toBe(false);
  expect(run(data).modules[0].items.some(item => item.key.startsWith('tuition'))).toBe(false);
  data.ExamSubmission = [{ id: 's', exam_id: 'e', student_email: 'edu-1' }]; data.Tuition[0].status = 'paid';
  expect(find(run(data), 2, 'previous_exam').done).toBe(true);
  expect(run(data).modules[0].items.some(item => item.key.startsWith('tuition'))).toBe(false);
});
it('releases modules 3 to 5 globally but keeps every checklist behind the previous exam', () => {
  const data = empty();
  data.Exam = [1, 2, 3, 4].map(number => ({ id: `e${number}`, module_ref: `Módulo ${number}` }));
  const result = run(data);
  expect(result.modules.map(row => row.moduleNumber)).toEqual([1, 2, 3, 4, 5]);
  expect([2, 3, 4, 5].map(number => find(result, number, 'previous_exam').done)).toEqual([false, false, false, false]);
  data.ExamSubmission = [1, 2, 3, 4].map(number => ({ id: `s${number}`, exam_id: `e${number}`, student_email: 'edu-1' }));
  expect([2, 3, 4, 5].map(number => find(run(data), number, 'previous_exam').done)).toEqual([true, true, true, true]);
});
it('does not accept an absent previous exam as a completed prerequisite', () => {
  expect(find(run(empty()), 2, 'previous_exam').done).toBe(false);
});
it('does not unlock modules after the globally released range or fabricate evidence', () => {
  expect(run(empty()).modules).toHaveLength(5);
  expect(find(run(empty()), 1, 'tasks').done).toBe(false);
});
it('updates visible checklist without overwriting newer financial status', () => {
  expect(applyChecklistVerification({ items: [{ key: 'apostila', current: 0, target: 5 }] }, { items: [{ key: 'apostila', current: 5, target: 5 }] }).complete).toBe(true);
  expect(mergeVerifiedTuitions([{ id: 't', status: 'pending', updated_date: '2026-09-18' }], [{ id: 't', status: 'paid', updated_date: '2026-09-17' }])[0].status).toBe('pending');
});
