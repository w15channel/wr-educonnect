import { describe, expect, it } from 'vitest';
import { isOutstandingTuition, tuitionSettlement } from './tuitionSettlement.ts';

describe('tuition settlement migration', () => {
  const today = '2026-09-26';

  it('selects overdue records and pending records whose due date passed', () => {
    expect(isOutstandingTuition({ status: 'overdue' }, today)).toBe(true);
    expect(isOutstandingTuition({ status: 'pending', due_date: '2026-09-25' }, today)).toBe(true);
    expect(isOutstandingTuition({ status: 'pending', due_date: today }, today)).toBe(false);
    expect(isOutstandingTuition({ status: 'paid', due_date: '2026-01-01' }, today)).toBe(false);
  });

  it('settles the debt for one cent on the migration date', () => {
    expect(tuitionSettlement(today)).toEqual({
      status: 'paid',
      paid_amount: 0.01,
      paid_date: today,
    });
  });
});
