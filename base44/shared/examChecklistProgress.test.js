import { describe, expect, it } from 'vitest';
import { computeChecklistProgress, examReleaseBlockReason } from './examChecklistProgress.ts';

const input = (overrides = {}) => ({
  moduleNumber: 1,
  email: 'aluno@teste.com',
  lessons: [{ id: 'l1', module_number: 1 }],
  tasks: [{ id: 't1', module_number: 1 }],
  ...overrides,
});

describe('computeChecklistProgress (guarda do servidor)', () => {
  it('recalcula o percentual do aluno sem confiar no cliente', () => {
    const progress = computeChecklistProgress(input({
      progresses: [{ lesson_id: 'l1', watched: true }],
      submissions: [{ task_id: 't1', comment: 'entrega feita' }],
    }));
    expect(progress.total).toBe(7);
    expect(progress.completed).toBe(2);
    expect(progress.missing).toBe(5);
    expect(progress.percent).toBe(29);
    expect(progress.eligible).toBe(false);
    expect(examReleaseBlockReason(progress)).toContain('29%');
  });

  it('libera apenas com o checklist inteiro cumprido', () => {
    const progress = computeChecklistProgress(input({
      progresses: [
        { lesson_id: 'l1', watched: true },
        ...[1, 2, 3, 4, 5].map((n) => ({ lesson_id: `apostila:mod1:cap${n}`, watched: true })),
      ],
      submissions: [{ task_id: 't1', comment: 'entrega feita' }],
      debatePosts: [{ id: 'p1', author_email: 'aluno@teste.com' }, { id: 'p2', author_email: 'colega@teste.com' }],
      debateReplies: [{ post_id: 'p2', author_email: 'aluno@teste.com' }],
      pairings: [{ therapist_email: 'aluno@teste.com', therapist_submitted: true }],
      challengeResponses: [
        { student_email: 'aluno@teste.com', date: '2024-05-01' },
        { student_email: 'aluno@teste.com', date: '2024-05-02' },
        { student_email: 'aluno@teste.com', date: '2024-05-03' },
      ],
    }));
    expect(progress.percent).toBe(100);
    expect(progress.eligible).toBe(true);
    expect(examReleaseBlockReason(progress)).toBeNull();
  });

  it('bloqueia quando não há checklist calculável', () => {
    expect(examReleaseBlockReason(null)).toContain('indisponível');
  });
});
