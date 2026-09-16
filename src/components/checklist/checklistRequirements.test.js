import { it, expect } from 'vitest';
import { buildModuleChecklist } from '@/lib/examChecklistRules';
it('mantém cinco obrigações sem videoaulas nem atendimento terapêutico', () => {
  const checklist = buildModuleChecklist({ moduleNumber: 1, email: 'aluno@test.local' });
  expect(checklist.items.map(item => item.key)).toEqual(['apostila', 'tasks', 'debate_topic', 'debate_comment', 'ofensiva']);
});