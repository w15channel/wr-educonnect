import { describe, expect, it } from 'vitest';
import { sortTuitionStudents } from './tuitionAdmin';

const students = [
  { key: 'bia@test', email: 'bia@test', name: 'Bia', lastSeenAt: '2026-01-01' },
  { key: 'ana@test', email: 'ana@test', name: 'Ana', lastSeenAt: '2026-02-01' },
];
const tuitions = [
  { student_email: 'bia@test', amount: 100, status: 'overdue' },
  { student_email: 'ana@test', amount: 200, paid_amount: 200, status: 'paid' },
];

describe('ordenação administrativa de mensalidades', () => {
  it('ordena alfabeticamente', () => expect(sortTuitionStudents(students, tuitions).map((s) => s.name)).toEqual(['Ana', 'Bia']));
  it('ordena por valor, inadimplência e última visita', () => {
    expect(sortTuitionStudents(students, tuitions, 'amount')[0].name).toBe('Ana');
    expect(sortTuitionStudents(students, tuitions, 'overdue')[0].name).toBe('Bia');
    expect(sortTuitionStudents(students, tuitions, 'last_visit')[0].name).toBe('Ana');
  });
});
