import { describe, expect, it, vi } from 'npm:vitest@4.1.11';
import { contributionAward, verifiedModuleAwards, saveAutomaticAwards } from './automaticAchievementAwards.ts';

const now = '2026-10-13T14:00:00Z';
const student = { email: 'ALUNO@example.com', course: 'tcc', aliases: ['aluno@example.com'] };
const module = { moduleNumber: 1, complete: true, examDone: true, items: [{ done: true, source_ids: ['lesson1'] }], exam_ids: ['exam1'] };

describe('Premiações automáticas verificadas', () => {
  it('exige pagamento confirmado acima de dez reais', () => {
    for (const amount of [0, 10, -5, undefined, 'inválido']) expect(contributionAward({ id: 't1', status: 'paid', paid_amount: amount }, student, now)).toBeNull();
    expect(contributionAward({ id: 't1', status: 'pending', paid_amount: 50 }, student, now)).toBeNull();
    expect(contributionAward({ id: 't1', status: 'paid', paid_amount: 10.01 }, student, now).dedupe_key).toBe('tuition:t1');
  });
  it('exige checklist completo e prova enviada, sem exigir nota', () => {
    expect(verifiedModuleAwards(student, { modules: [{ ...module, complete: false }] }, {}, now)).toEqual([]);
    expect(verifiedModuleAwards(student, { modules: [{ ...module, examDone: false }] }, {}, now)).toEqual([]);
    expect(verifiedModuleAwards(student, { modules: [{ ...module, items: [] }] }, {}, now)).toEqual([]);
    const [award] = verifiedModuleAwards(student, { modules: [module] }, {}, now);
    expect(award.source_id).toBe('mod1');
    expect(award.dedupe_key).toBe('module-trophy:tcc:aluno@example.com:1');
  });
  it('não usa datas de outros alunos', () => {
    const data = { ExamSubmission: [{ exam_id: 'exam1', student_email: 'outro@example.com', submitted_at: '2030-01-01' }, { exam_id: 'exam1', student_email: 'aluno@example.com', submitted_at: '2026-10-01T12:00:00Z' }] };
    expect(verifiedModuleAwards(student, { modules: [module] }, data, now)[0].occurred_at).toBe('2026-10-01T12:00:00.000Z');
  });
  it('não reenvia conquistas existentes nem grava durante simulação', async () => {
    const store = { Achievement: { filter: vi.fn().mockResolvedValue({ items: ['existing'] }), upsert: vi.fn().mockResolvedValue({ created: 1 }) } };
    expect(await saveAutomaticAwards(store, [{ dedupe_key: 'existing' }])).toBe(0);
    expect(await saveAutomaticAwards(store, [{ dedupe_key: 'new' }], true)).toBe(1);
    expect(store.Achievement.upsert).not.toHaveBeenCalled();
    expect(await saveAutomaticAwards(store, [{ dedupe_key: 'new' }, { dedupe_key: 'new' }])).toBe(1);
    expect(store.Achievement.upsert.mock.calls[0][0]).toHaveLength(1);
  });
});