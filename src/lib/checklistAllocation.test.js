import { describe, expect, it } from 'vitest';
import { allocateWindowActivities } from './checklistAllocation';

describe('distribuição das atividades entre módulos', () => {
  const base = {
    moduleCount: 2, course: 'tcc', identities: new Set(['ana@x.com', 'abc123']),
    unlockDateByModule: new Map([[1, '2026-09-01'], [2, '2026-09-10']]),
    debatePosts: [{ id: 'o', author_email: 'bia@x.com', created_date: '2026-09-02' }, { id: 'p1', author_email: 'ANA@x.com', created_date: '2026-09-12' }],
    debateReplies: [{ id: 'r1', post_id: 'o', author_email: 'abc123', created_date: '2026-09-12' }],
    challengeResponses: ['2026-09-11', '2026-09-12', '2026-09-13'].map((date) => ({ student_email: 'ana@x.com', date })),
  };
  it('atividade atrasada conta para o módulo pendente e não se repete', () => {
    const { result } = allocateWindowActivities(base);
    expect(result.get(1).posts).toHaveLength(1);
    expect(result.get(1).replies).toHaveLength(1);
    expect(result.get(1).days).toHaveLength(3);
    expect(result.get(2).posts).toHaveLength(0);
    expect(result.get(2).days).toHaveLength(0);
  });
});