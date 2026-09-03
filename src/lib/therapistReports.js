import { normalizeStudentEmail } from './therapistPairings';

export const REPORT_REACTIONS = [
  { key: 'love', label: 'Amar', emoji: '❤️' },
  { key: 'celebrate', label: 'Celebrar', emoji: '🎉' },
  { key: 'applaud', label: 'Aplaudir', emoji: '👏' },
];

export function getPairingReportAccess(pairing, viewerEmail, isTeacher = false) {
  if (isTeacher) return { isMember: true, ownFields: ['therapist', 'patient'] };
  const viewer = normalizeStudentEmail(viewerEmail);
  const ownFields = [];
  if (viewer && normalizeStudentEmail(pairing?.therapist_email) === viewer) ownFields.push('therapist');
  if (viewer && normalizeStudentEmail(pairing?.patient_email) === viewer) ownFields.push('patient');
  return { isMember: ownFields.length > 0, ownFields };
}

export function visiblePairingsForReportWall(pairings, viewerEmail, isTeacher = false) {
  return (pairings || []).filter((pairing) => getPairingReportAccess(pairing, viewerEmail, isTeacher).isMember);
}
