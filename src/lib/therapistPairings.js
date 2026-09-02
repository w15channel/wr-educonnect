export const normalizeStudentEmail = (email) => String(email || '').trim().toLowerCase();

const normalizeNamePart = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z\s]/g, ' ')
  .toLowerCase()
  .trim();

const SURNAME_PARTICLES = new Set(['da', 'das', 'de', 'do', 'dos', 'e']);

export function getStudentName(student = {}) {
  return student.profile_name || student.student_name || student.student_email || '';
}

export function getSurnameParts(name) {
  return normalizeNamePart(name)
    .split(/\s+/)
    .slice(1)
    .filter((part) => part.length > 2 && !SURNAME_PARTICLES.has(part));
}

function editDistance(left, right) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const above = previous[j];
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (left[i - 1] === right[j - 1] ? 0 : 1)
      );
      diagonal = above;
    }
  }
  return previous[right.length];
}

/** Evita tanto sobrenomes iguais quanto variações muito próximas (ex.: Sousa/Souza). */
export function haveSimilarSurnames(firstName, secondName) {
  const first = getSurnameParts(firstName);
  const second = getSurnameParts(secondName);
  return first.some((left) => second.some((right) => {
    if (left === right) return true;
    if (Math.min(left.length, right.length) < 4) return false;
    return editDistance(left, right) <= 1;
  }));
}

export function isActiveStudent(code = {}) {
  return Boolean(
    code.student_email &&
    code.is_active === true &&
    (!code.profile_category || code.profile_category === 'student')
  );
}

/**
 * Seleciona aleatoriamente dentro da maior nota disponível e, em seguida,
 * atribui a menor nota compatível. A função de aleatoriedade é injetável para
 * tornar a regra auditável em testes.
 */
export function buildScoreBalancedPairings(students = [], random = Math.random) {
  const remaining = [...students];
  const pairs = [];
  const unpaired = [];

  while (remaining.length >= 2) {
    const highestScore = Math.max(...remaining.map((student) => Number(student.pontuacao_total) || 0));
    const highest = remaining.filter((student) => (Number(student.pontuacao_total) || 0) === highestScore);
    const therapist = highest[Math.floor(random() * highest.length)];
    const compatiblePatients = remaining
      .filter((student) => student !== therapist && !haveSimilarSurnames(getStudentName(therapist), getStudentName(student)))
      .sort((a, b) => (Number(a.pontuacao_total) || 0) - (Number(b.pontuacao_total) || 0));

    if (compatiblePatients.length === 0) {
      unpaired.push(therapist);
      remaining.splice(remaining.indexOf(therapist), 1);
      continue;
    }

    const lowestScore = Number(compatiblePatients[0].pontuacao_total) || 0;
    const lowest = compatiblePatients.filter((student) => (Number(student.pontuacao_total) || 0) === lowestScore);
    const patient = lowest[Math.floor(random() * lowest.length)];
    pairs.push({ therapist, patient });
    remaining.splice(remaining.indexOf(therapist), 1);
    remaining.splice(remaining.indexOf(patient), 1);
  }

  return { pairs, unpaired: [...unpaired, ...remaining] };
}

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
