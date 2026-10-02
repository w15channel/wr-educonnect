const text = (value) => String(value || '').trim();
const time = (value) => {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : 0;
};

export function studentTuitionSummary(student, tuitions = []) {
  const records = tuitions.filter((item) => item.student_email === student.key || item.student_email === student.email);
  return {
    amount: records.reduce((highest, item) => Math.max(highest, Number(item.amount) || 0), 0),
    overdue: records.some((item) => item.status === 'overdue'),
    lastVisit: time(student.lastSeenAt),
  };
}

export function sortTuitionStudents(students = [], tuitions = [], sortBy = 'alphabetical') {
  const summaries = new Map(students.map((student) => [student.key, studentTuitionSummary(student, tuitions)]));
  return [...students].sort((a, b) => {
    const left = summaries.get(a.key);
    const right = summaries.get(b.key);
    if (sortBy === 'amount') return right.amount - left.amount || text(a.name).localeCompare(text(b.name), 'pt-BR');
    if (sortBy === 'overdue') return Number(right.overdue) - Number(left.overdue) || text(a.name).localeCompare(text(b.name), 'pt-BR');
    if (sortBy === 'last_visit') return right.lastVisit - left.lastVisit || text(a.name).localeCompare(text(b.name), 'pt-BR');
    return text(a.name).localeCompare(text(b.name), 'pt-BR');
  });
}

export function sortTuitionsByStudents(tuitions = [], students = [], sortBy = 'alphabetical') {
  const order = new Map(sortTuitionStudents(students, tuitions, sortBy).map((student, index) => [student.key, index]));
  return [...tuitions].sort((a, b) => {
    const studentOrder = (order.get(a.student_email) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.student_email) ?? Number.MAX_SAFE_INTEGER);
    return studentOrder || text(b.month_ref).localeCompare(text(a.month_ref), 'pt-BR');
  });
}
