export const SETTLEMENT_AMOUNT = 0.01;

export function isOutstandingTuition(tuition, today) {
  if (!tuition || tuition.status === 'paid') return false;
  if (tuition.status === 'overdue') return true;
  return Boolean(tuition.due_date && tuition.due_date < today);
}

export function tuitionSettlement(today) {
  return {
    status: 'paid',
    paid_amount: SETTLEMENT_AMOUNT,
    paid_date: today,
  };
}
