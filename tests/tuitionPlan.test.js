import { describe, expect, it } from 'vitest';
import { dueDateInCurrentMonth, firstDueDate, isValidDueDay, monthKey, monthRefFor, monthRefFromDate, normalizeAmount } from '../base44/shared/tuitionPlan.ts';

describe('plano de contribuição do aluno', () => {
  const reference = new Date('2026-11-11T12:00:00-03:00');

  it('aceita apenas dias 1 a 28 e valores positivos', () => {
    expect(isValidDueDay(1)).toBe(true);
    expect(isValidDueDay(28)).toBe(true);
    expect(isValidDueDay(29)).toBe(false);
    expect(isValidDueDay(0)).toBe(false);
    expect(normalizeAmount('120,50')).toBe(120.5);
    expect(normalizeAmount('')).toBeNull();
    expect(normalizeAmount('0')).toBeNull();
  });

  it('usa o próximo dia escolhido quando ele já passou no mês', () => {
    expect(firstDueDate(20, reference)).toBe('2026-11-20');
    expect(firstDueDate(5, reference)).toBe('2026-12-05');
  });

  it('vira o ano quando o dia escolhido já passou em dezembro', () => {
    expect(firstDueDate(5, new Date('2026-12-20T12:00:00-03:00'))).toBe('2027-01-05');
  });

  it('monta a referência do mês no formato de Mensalidades', () => {
    expect(monthRefFor(reference)).toBe('Novembro - 2026');
    expect(monthRefFromDate('2026-12-05')).toBe('Dezembro - 2026');
    expect(monthKey(reference)).toBe('2026-11');
  });

  it('calcula o vencimento dentro do mês corrente', () => {
    expect(dueDateInCurrentMonth(7, reference)).toBe('2026-11-07');
  });
});