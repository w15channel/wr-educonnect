import { describe, expect, it } from 'vitest';
import { getLatestContributors, hasPositiveContribution, isContributionAwardFeatured, isContributionWallHighlight } from './contributionAwards';

describe('prêmio de contribuição voluntária', () => {
  it('premia somente mensalidade paga com contribuição acima de zero', () => {
    expect(hasPositiveContribution({ status: 'paid', paid_amount: 0 })).toBe(false);
    expect(hasPositiveContribution({ status: 'paid', paid_amount: '0.01' })).toBe(true);
    expect(hasPositiveContribution({ status: 'pending', paid_amount: 50 })).toBe(false);
    expect(hasPositiveContribution({ status: 'paid' })).toBe(false);
  });

  it('inclui todos os participantes financeiros da mensalidade mais recente, sem duplicar aluno', () => {
    const records = [
      { id: 'antiga', student_email: 'ana@edu.test', month_ref: '2026-08', status: 'paid', paid_amount: 50 },
      { id: 'ana', student_email: 'ANA@edu.test', month_ref: '2026-09', status: 'paid', paid_amount: 10 },
      { id: 'ana-duplicada', student_email: 'ana@edu.test', month_ref: '2026-09', status: 'paid', paid_amount: 20 },
      { id: 'bia', student_email: 'bia@edu.test', month_ref: '2026-09', status: 'paid', paid_amount: '0.01' },
      { id: 'sem-contribuicao', student_email: 'carla@edu.test', month_ref: '2026-09', status: 'paid', paid_amount: 0 },
      { id: 'pendente', student_email: 'dani@edu.test', month_ref: '2026-09', status: 'pending', paid_amount: 30 },
    ];

    expect(getLatestContributors(records).map((item) => item.id)).toEqual(['ana', 'bia']);
  });

  it('mantém o parabéns do aluno por 15 dias e o destaque coletivo por 7', () => {
    const occurredAt = '2026-09-01T12:00:00.000Z';
    const award = { kind: 'tuition', studentEmail: 'aluna@edu.test', occurredAt };
    expect(isContributionAwardFeatured(award, 'ALUNA@edu.test', Date.parse('2026-09-16T11:59:59Z'))).toBe(true);
    expect(isContributionAwardFeatured(award, 'aluna@edu.test', Date.parse('2026-09-16T12:00:00Z'))).toBe(false);
    expect(isContributionWallHighlight(award, Date.parse('2026-09-08T11:59:59Z'))).toBe(true);
    expect(isContributionWallHighlight(award, Date.parse('2026-09-08T12:00:00Z'))).toBe(false);
  });
});
