import { describe, expect, it } from 'vitest';
import {
  EXAM_RELEASE_MIN_PERCENT,
  canReleaseExams,
  examReleaseBlockReason,
  summarizeChecklistProgress,
} from '@/lib/examChecklistRules';
import { buildStudentExamProgressRows } from '@/lib/adminModuleProgress';

const items = (doneFlags) => doneFlags.map((done, index) => ({ key: `item-${index}`, label: `Item ${index}`, done }));

describe('summarizeChecklistProgress', () => {
  it('calcula total, cumpridas, faltantes e percentual', () => {
    const summary = summarizeChecklistProgress({ items: items([true, true, false, false]) });
    expect(summary.total).toBe(4);
    expect(summary.completed).toBe(2);
    expect(summary.missing).toBe(2);
    expect(summary.percent).toBe(50);
    expect(summary.eligible).toBe(false);
  });

  it('aceita a lista de itens diretamente e arredonda o percentual', () => {
    const summary = summarizeChecklistProgress(items([true, true, false]));
    expect(summary.percent).toBe(67);
    expect(summary.missingItems).toHaveLength(1);
  });

  it('é elegível somente ao atingir o mínimo exigido', () => {
    const summary = summarizeChecklistProgress(items([true, true, true]));
    expect(summary.percent).toBe(EXAM_RELEASE_MIN_PERCENT);
    expect(summary.eligible).toBe(true);
    expect(canReleaseExams(summary)).toBe(true);
  });

  it('não libera quando não há dados de checklist', () => {
    const summary = summarizeChecklistProgress(null);
    expect(summary.total).toBe(0);
    expect(summary.percent).toBe(0);
    expect(summary.hasData).toBe(false);
    expect(summary.eligible).toBe(false);
    expect(canReleaseExams(summary)).toBe(false);
  });
});

describe('examReleaseBlockReason', () => {
  it('explica o bloqueio de quem ainda não cumpriu tudo', () => {
    const reason = examReleaseBlockReason(summarizeChecklistProgress(items([true, false])));
    expect(reason).toContain('50%');
    expect(reason).toContain('1 atividade');
  });

  it('avisa quando o checklist está indisponível', () => {
    expect(examReleaseBlockReason(null)).toContain('indisponível');
  });

  it('não bloqueia quem atingiu o mínimo', () => {
    expect(examReleaseBlockReason(summarizeChecklistProgress(items([true])))).toBeNull();
  });
});

describe('buildStudentExamProgressRows', () => {
  const baseData = {
    students: [{ student_email: 'Aluno@Teste.com', profile_name: 'Aluno Teste', code: 'EDU-1' }],
    lessons: [{ id: 'l1', module_number: 1 }],
    tasks: [{ id: 't1', module_number: 1 }],
  };

  it('usa o módulo em vigência liberado pelo admin', () => {
    const [row] = buildStudentExamProgressRows({
      ...baseData,
      moduleUnlocks: [{ student_email: 'aluno@teste.com', module_number: 3, unlocked_at: '2020-01-01T00:00:00Z' }],
    });
    expect(row.moduleNumber).toBe(3);
    expect(row.email).toBe('aluno@teste.com');
    expect(row.name).toBe('Aluno Teste');
  });

  it('conta as atividades cumpridas do aluno no módulo', () => {
    const [row] = buildStudentExamProgressRows({
      ...baseData,
      progresses: [{ student_email: 'aluno@teste.com', lesson_id: 'l1', watched: true }],
      submissions: [{ student_email: 'aluno@teste.com', task_id: 't1', comment: 'entrega' }],
    });
    expect(row.moduleNumber).toBe(1);
    expect(row.summary.total).toBe(7);
    expect(row.summary.completed).toBe(2);
    expect(row.summary.missing).toBe(5);
    expect(row.summary.percent).toBe(29);
    expect(row.summary.eligible).toBe(false);
    expect(row.released).toBe(false);
  });

  it('não mistura o progresso de alunos diferentes', () => {
    const [row] = buildStudentExamProgressRows({
      ...baseData,
      progresses: [{ student_email: 'outro@teste.com', lesson_id: 'l1', watched: true }],
    });
    expect(row.summary.completed).toBe(0);
  });

  it('marca como liberado quando existe registro do módulo em vigência', () => {
    const [row] = buildStudentExamProgressRows({
      ...baseData,
      examReleases: [
        { student_email: 'aluno@teste.com', module_number: 1, released_at: '2024-05-01T10:00:00Z' },
        { student_email: 'aluno@teste.com', module_number: 2, released_at: '2024-06-01T10:00:00Z' },
      ],
    });
    expect(row.released).toBe(true);
    expect(row.release.module_number).toBe(1);
  });

  it('ignora alunos sem e-mail', () => {
    const rows = buildStudentExamProgressRows({ ...baseData, students: [{ profile_name: 'Sem e-mail' }] });
    expect(rows).toHaveLength(0);
  });
});
