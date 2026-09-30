import { describe, expect, it } from 'vitest';
import {
  AUGUST_2026_CONTRIBUTORS,
  augustAwardKey,
  augustMessageKey,
  contributorName,
  isAugust2026,
  isDiamondRecognitionPost,
  isSelectedAugustContributor,
} from './augustContributionAwards.ts';

describe('reconciliação dos diamantes de agosto de 2026', () => {
  it('identifica exatamente as seis alunas pelo primeiro nome normalizado', () => {
    const selected = AUGUST_2026_CONTRIBUTORS.map((name) => ({ profile_name: `${name.toUpperCase()} da Silva` }));
    expect(selected.every(isSelectedAugustContributor)).toBe(true);
    expect(isSelectedAugustContributor({ profile_name: 'Ana Diane' })).toBe(false);
    expect(isSelectedAugustContributor({ student_name: 'Maríh Souza' })).toBe(true);
    expect(contributorName({ profile_name: '  Cristiane Lima ' })).toBe('cristiane');
  });

  it('reconhece as referências aceitas para agosto de 2026', () => {
    expect(isAugust2026('2026-08')).toBe(true);
    expect(isAugust2026('Agosto - 2026')).toBe(true);
    expect(isAugust2026('AGOSTO/2026')).toBe(true);
    expect(isAugust2026('2026-09')).toBe(false);
  });

  it('gera chaves canônicas por e-mail para impedir troféus e mensagens duplicados', () => {
    expect(augustAwardKey(' DIANE@EXAMPLE.COM ')).toBe('contribution:2026-08:diane@example.com');
    expect(augustMessageKey(' DIANE@EXAMPLE.COM ')).toBe('august-2026-diamond:diane@example.com');
  });

  it('reconhece mensagens de diamante antigas para que possam ser revogadas', () => {
    expect(isDiamondRecognitionPost({ source_id: 'august-2026-diamond:ana@example.com' })).toBe(true);
    expect(isDiamondRecognitionPost({ title: 'Parabéns pelo seu Diamante! 💎' })).toBe(true);
    expect(isDiamondRecognitionPost({ message: 'Você recebeu o Diamante da Contribuição.' })).toBe(true);
    expect(isDiamondRecognitionPost({ title: 'Aviso acadêmico', message: 'Confira sua nota.' })).toBe(false);
  });
});
