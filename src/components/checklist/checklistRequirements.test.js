import { it, expect } from 'vitest';
import { buildModuleChecklist } from '@/lib/examChecklistRules';
it('não exige atendimento terapêutico no checklist do aluno', () => {
  const checklist = buildModuleChecklist({ moduleNumber: 1, email: 'aluno@test.local' });
  expect(checklist.items).toHaveLength(6);
  expect(checklist.items.some(item => item.key === 'therapist')).toBe(false);
});