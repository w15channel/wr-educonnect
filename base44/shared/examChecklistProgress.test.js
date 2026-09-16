import { describe, expect, it } from 'npm:vitest@4.1.11';
import { computeChecklistProgress, examReleaseBlockReason } from './examChecklistProgress.ts';

const input = (overrides = {}) => ({ moduleNumber: 1, email: 'aluno@teste.com', lessons: [{ id: 'l1', module_number: 1 }], tasks: [{ id: 't1', module_number: 1 }], ...overrides });

describe('computeChecklistProgress (guarda do servidor)', () => {
  it('recalcula o percentual sem atendimento terapêutico', () => {
    const progress = computeChecklistProgress(input({ progresses: [{ lesson_id: 'l1', watched: true }], submissions: [{ task_id: 't1', comment: 'entrega feita' }] }));
    expect(progress.total).toBe(5);
    expect(progress.completed).toBe(1);
    expect(progress.missing).toBe(4);
    expect(progress.percent).toBe(20);
    expect(progress.eligible).toBe(false);
    expect(examReleaseBlockReason(progress)).toContain('20%');
  });
  it('libera com cinco etapas cumpridas sem videoaulas nem atendimento', () => {
    const progress = computeChecklistProgress(input({
      progresses: [1, 2, 3, 4, 5].map(n => ({ lesson_id: `apostila:mod1:cap${n}`, watched: true })),
      submissions: [{ task_id: 't1', comment: 'entrega feita' }],
      debatePosts: [{ id: 'p1', author_email: 'aluno@teste.com' }, { id: 'p2', author_email: 'colega@teste.com' }],
      debateReplies: [{ post_id: 'p2', author_email: 'aluno@teste.com' }], pairings: [],
      challengeResponses: ['2024-05-01', '2024-05-02', '2024-05-03'].map(date => ({ student_email: 'aluno@teste.com', date })),
    }));
    expect(progress.percent).toBe(100);
    expect(progress.eligible).toBe(true);
    expect(examReleaseBlockReason(progress)).toBeNull();
  });
  it('bloqueia quando não há checklist calculável', () => {
    expect(examReleaseBlockReason(null)).toContain('indisponível');
  });
});