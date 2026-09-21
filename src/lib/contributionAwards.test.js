import { describe, expect, it } from 'vitest';
import { hasPositiveContribution, isContributionAwardFeatured, isContributionWallHighlight } from './contributionAwards';

describe('prêmio de contribuição voluntária', () => {
  it('premia somente mensalidade paga com contribuição acima de zero', () => {
    expect(hasPositiveContribution({ status: 'paid', paid_amount: 0 })).toBe(false);
    expect(hasPositiveContribution({ status: 'paid', paid_amount: '0.01' })).toBe(true);
    expect(hasPositiveContribution({ status: 'pending', paid_amount: 50 })).toBe(false);
    expect(hasPositiveContribution({ status: 'paid' })).toBe(false);
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
