export const normalizeStudentEmail = (email) => String(email || '').trim().toLowerCase();

export const isPublishedPairing = (pairing) => pairing?.is_published === true;

export function getLatestPairingDate(pairings = [], { publishedOnly = false } = {}) {
  return pairings.reduce((latest, pairing) => {
    if (publishedOnly && !isPublishedPairing(pairing)) return latest;
    const date = pairing?.pairing_date;
    return date && (!latest || date > latest) ? date : latest;
  }, null);
}

/**
 * Students must be anchored to the latest *published* round. An administrator
 * may already be preparing a newer draft; that draft must not hide the last
 * published round from student screens.
 */
export function getLatestPublishedPairings(pairings = []) {
  const latestPublishedDate = getLatestPairingDate(pairings, { publishedOnly: true });
  if (!latestPublishedDate) return [];
  return pairings.filter(
    (pairing) => isPublishedPairing(pairing) && pairing.pairing_date === latestPublishedDate
  );
}

export function findStudentPairings(pairings = [], studentEmail) {
  const email = normalizeStudentEmail(studentEmail);
  return {
    asTherapist: pairings.find(
      (pairing) => normalizeStudentEmail(pairing.therapist_email) === email
    ),
    asPatient: pairings.find(
      (pairing) => normalizeStudentEmail(pairing.patient_email) === email
    ),
  };
}
