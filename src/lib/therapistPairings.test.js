import { describe, expect, it } from 'vitest';
import { buildScoreBalancedPairings, findStudentPairings, getLatestPublishedPairings, haveSimilarSurnames, isActiveStudent } from './therapistPairings';

describe('therapist pairings visible to students', () => {
  it('keeps the latest published round visible while a newer draft exists', () => {
    const published = { id: 'published', pairing_date: '2026-09-01', is_published: true };
    const draft = { id: 'draft', pairing_date: '2026-09-02', is_published: false };

    expect(getLatestPublishedPairings([published, draft])).toEqual([published]);
  });

  it('returns every pairing from the latest published round', () => {
    const pairings = [
      { id: 'old', pairing_date: '2026-08-20', is_published: true },
      { id: 'a', pairing_date: '2026-09-01', is_published: true },
      { id: 'b', pairing_date: '2026-09-01', is_published: true },
    ];

    expect(getLatestPublishedPairings(pairings).map(({ id }) => id)).toEqual(['a', 'b']);
  });

  it('matches the logged-in student email without case or whitespace sensitivity', () => {
    const pairing = {
      therapist_email: ' Student@Example.com ',
      patient_email: 'patient@example.com',
    };

    expect(findStudentPairings([pairing], 'student@example.com').asTherapist).toBe(pairing);
    expect(findStudentPairings([pairing], ' PATIENT@EXAMPLE.COM ').asPatient).toBe(pairing);
  });
});

describe('score-balanced therapist pairing generation', () => {
  const student = (name, score, extra = {}) => ({ student_name: name, student_email: `${name.replaceAll(' ', '.')}@test.com`, pontuacao_total: score, is_active: true, profile_category: 'student', ...extra });

  it('pairs a random student from the highest score tier with the lowest compatible score', () => {
    const students = [
      student('Ana Lima', 100),
      student('Bia Costa', 100),
      student('Caio Nunes', 70),
      student('Davi Rocha', 10),
    ];

    const { pairs, unpaired } = buildScoreBalancedPairings(students, () => 0.99);

    expect(pairs[0].therapist.student_name).toBe('Bia Costa');
    expect(pairs[0].patient.student_name).toBe('Davi Rocha');
    expect(pairs[1].therapist.student_name).toBe('Ana Lima');
    expect(pairs[1].patient.student_name).toBe('Caio Nunes');
    expect(unpaired).toEqual([]);
  });

  it('never combines equal or similar surnames', () => {
    const students = [student('Ana Souza', 100), student('Bia Sousa', 1), student('Caio Lima', 2)];
    const { pairs } = buildScoreBalancedPairings(students, () => 0);

    expect(haveSimilarSurnames('Ana Souza', 'Bia Sousa')).toBe(true);
    expect(pairs[0].patient.student_name).toBe('Caio Lima');
  });

  it('accepts only active student profiles and keeps legacy student records', () => {
    expect(isActiveStudent(student('Ana Lima', 1))).toBe(true);
    expect(isActiveStudent(student('Bia Lima', 1, { profile_category: undefined }))).toBe(true);
    expect(isActiveStudent(student('Prof Lima', 1, { profile_category: 'teacher' }))).toBe(false);
    expect(isActiveStudent(student('Suporte Lima', 1, { profile_category: 'support' }))).toBe(false);
    expect(isActiveStudent(student('Inativa Lima', 1, { is_active: false }))).toBe(false);
  });
});
