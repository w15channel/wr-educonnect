import { describe, it, expect } from 'vitest';
import { buildModuleChecklist } from '@/lib/examChecklistRules';

const item = (input, key) => buildModuleChecklist({ moduleNumber: 1, email: 'student@test.local', ...input }).items.find(i => i.key === key);
const tasks = Array.from({ length: 5 }, (_, i) => ({ id: `task-${i}`, type: 'upload', module_number: 1 }));

describe('conclusões preservadas', () => {
  it('reconhece as cinco tarefas sem exigir a prova antiga nem tarefas ocultas', () => {
    const result = item({ tasks: [...tasks, { id: 'old-exam', type: 'quiz', module_number: 1 }, { id: 'hidden', type: 'upload', module_number: 1, is_hidden: true }], submissions: tasks.map(t => ({ task_id: t.id, status: 'graded' })) }, 'tasks');
    expect(result).toMatchObject({ current: 5, target: 5, done: true });
  });
  it('não apaga uma entrega válida quando existem registros duplicados', () => {
    const result = item({ tasks: [tasks[0]], submissions: [{ task_id: 'task-0' }, { task_id: 'task-0', comment: 'Resposta histórica' }] }, 'tasks');
    expect(result).toMatchObject({ current: 1, target: 1, done: true });
  });
  it('mantém leituras de todos os capítulos, mesmo anteriores à liberação', () => {
    const progresses = Array.from({ length: 5 }, (_, i) => ({ lesson_id: `apostila:mod2:mod2-a${i + 1}`, watched: true, created_date: '2026-09-01' }));
    const result = item({ moduleNumber: 2, progresses, moduleWindow: { start: '2026-09-11', end: '2026-10-01' } }, 'apostila');
    expect(result).toMatchObject({ current: 5, target: 5, done: true });
  });
  it('não conclui atividades sem registros nem herda leituras de outro módulo', () => {
    expect(item({ tasks }, 'tasks').done).toBe(false);
    expect(item({ moduleNumber: 2, progresses: [{ lesson_id: 'apostila:mod1:mod1-a1', watched: true }] }, 'apostila').current).toBe(0);
  });
});