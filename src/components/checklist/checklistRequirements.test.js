import { it, expect } from 'vitest';
import { buildModuleChecklist } from '@/lib/examChecklistRules';
it('mantém cinco obrigações sem videoaulas nem atendimento terapêutico', () => {
  const checklist = buildModuleChecklist({ moduleNumber: 1, email: 'aluno@test.local' });
  expect(checklist.items.map(item => item.key)).toEqual(['apostila', 'tasks', 'debate_topic', 'debate_comment', 'ofensiva']);
});

it('reconhece debates pelo módulo do tema e normaliza o e-mail', () => {
  const checklist = buildModuleChecklist({
    moduleNumber: 2,
    email: 'Aluno@Test.Local',
    debatePosts: [
      { id: 'meu', topic: '2.1 Tema', author_email: 'aluno@test.local' },
      { id: 'colega', topic: '2.2 Tema', author_email: 'colega@test.local' },
    ],
    debateReplies: [{ post_id: 'colega', author_email: 'ALUNO@test.local', space: 'forum' }],
  });
  expect(checklist.items.find(item => item.key === 'debate_topic').done).toBe(true);
  expect(checklist.items.find(item => item.key === 'debate_comment').done).toBe(true);
});

it('não inclui mensalidades entre os requisitos do checklist', () => {
  const checklist = buildModuleChecklist({ moduleNumber: 1, email: 'aluno@test.local' });
  expect(checklist.items.some(item => item.key.startsWith('tuition'))).toBe(false);
});

it('remove a ofensiva diária da trilha no modo somente certificado', () => {
  const checklist = buildModuleChecklist({
    moduleNumber: 1,
    email: 'aluno@test.local',
    includeOfensiva: false,
  });
  expect(checklist.items.map(item => item.key)).toEqual(['apostila', 'tasks', 'debate_topic', 'debate_comment']);
});
