import { describe, expect, it } from 'vitest';
import { findStudentPairings, getLatestPublishedPairings } from './therapistPairings';

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
