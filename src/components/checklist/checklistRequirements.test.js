import { it, expect } from 'vitest';
import { buildModuleChecklist, findOldestUnresolvedModule } from '@/lib/examChecklistRules';
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

it('coloca a contribuição primeiro e usa o módulo pendente mais antigo', () => {
  const checklist = buildModuleChecklist({ moduleNumber: 1, email: 'aluno@test.local', includeTuition: true, tuitionPaid: true });
  expect(checklist.items[0]).toMatchObject({ key: 'tuition', done: true });
  expect(findOldestUnresolvedModule([
    { moduleNumber: 1, complete: true, examDone: false },
    { moduleNumber: 2, complete: false, examDone: false },
  ], [1, 2], 2)).toBe(1);
});