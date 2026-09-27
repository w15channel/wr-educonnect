import { describe, it, expect } from 'npm:vitest@4.1.11';
import { completeReleaseSchedule, planModuleReleases } from './moduleReleasePlan.ts';

const dates = ['2026-09-24', '2026-09-24', '2026-09-24', '2026-09-24', '2026-10-28', '2026-11-06', '2026-11-14', '2026-11-23', '2026-12-01'];
const schedule = dates.map((date, i) => ({ module_number: i + 2, release_at: `${date}T00:00:00-03:00` }));
const codes = ['tcc', 'psicanalise', 'sexologia'].map(course => ({ course, student_email: `${course}@test.local`, pontuacao_total: 0 }));
const initial = { profiles: [], lessons: [], tasks: [], exams: [], examSubs: [], progress: [], submissions: [] };

describe('Liberação progressiva por datas', () => {
  it('reconstrói o calendário completo sem depender dos registros remotos', () => {
    expect(completeReleaseSchedule([])).toEqual(schedule);
  });

  it.each(schedule)('abre módulo $module_number exatamente à meia-noite de Brasília', release => {
    const before = new Date(Date.parse(release.release_at) - 1).toISOString();
    expect(planModuleReleases(codes, [], schedule, before).some(r => r.module_number === release.module_number)).toBe(false);
    expect(planModuleReleases(codes, [], schedule, release.release_at).filter(r => r.module_number === release.module_number)).toHaveLength(3);
  });
  it('independe de nota e inclui novos alunos após as datas', () => {
    expect(planModuleReleases(codes, [], schedule, '2027-01-01T00:00:00Z')).toHaveLength(27);
  });
  it('preserva liberações e não duplica ao repetir', () => {
    const saved = [{ student_email: codes[0].student_email, course: 'tcc', module_number: 2, unlocked_at: '2026-09-01T00:00:00Z' }];
    const planned = planModuleReleases(codes, saved, schedule, '2026-09-24T03:00:00Z');
    expect(planned).toHaveLength(11);
    expect(saved[0].unlocked_at).toBe('2026-09-01T00:00:00Z');
    expect(planModuleReleases(codes, [...saved, ...planned], schedule, '2026-09-24T03:00:00Z')).toEqual([]);
  });
  it('antecipa apenas módulo 2 com pelo menos 50 pontos na transição', () => {
    const students = [49.99, 50, 100].map((points, i) => ({ ...codes[i], pontuacao_total: points }));
    const planned = planModuleReleases(students, [], schedule, '2026-09-15T00:00:00Z', initial);
    expect(planned).toHaveLength(2);
    expect(planned.every(r => r.module_number === 2)).toBe(true);
    expect(planModuleReleases(students, [], schedule, '2026-09-15T00:00:00Z')).toEqual([]);
  });
  it('preserva módulo 2 obtido pelas regras antigas', () => {
    const data = { ...initial, exams: [{ id: 'exam1', course: 'tcc', module_ref: 'mod1' }], examSubs: [{ student_email: codes[0].student_email, exam_id: 'exam1' }] };
    const planned = planModuleReleases(codes, [], schedule, '2026-09-15T00:00:00Z', data);
    expect(planned).toHaveLength(1);
    expect(planned[0].unlocked_by).toBe('sistema:acesso-anterior');
  });
});
