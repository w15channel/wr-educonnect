import { describe, expect, it } from 'vitest';
import { getPairingReportAccess, visiblePairingsForReportWall } from './therapistReports';

const pair = { id: 'one', therapist_email: 'terapeuta@test.com', patient_email: 'paciente@test.com' };

describe('private therapist report wall', () => {
  it('only includes pairings involving the signed-in student', () => {
    const unrelated = { id: 'two', therapist_email: 'a@test.com', patient_email: 'b@test.com' };
    expect(visiblePairingsForReportWall([pair, unrelated], ' PACIENTE@test.com ')).toEqual([pair]);
  });

  it('only grants authorship over the viewer own report', () => {
    expect(getPairingReportAccess(pair, 'terapeuta@test.com').ownFields).toEqual(['therapist']);
    expect(getPairingReportAccess(pair, 'paciente@test.com').ownFields).toEqual(['patient']);
    expect(getPairingReportAccess(pair, 'outsider@test.com').isMember).toBe(false);
  });
});
