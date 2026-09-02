import { describe, expect, it } from 'vitest';
import { personalizeWallNotice } from './wallPersonalization';

const notice = {
  recipient_email: 'ana@example.com',
  title: '🏅 Você é Monitor(a) da Semana!',
  content: 'Ana, parabéns! Você foi selecionada.',
};

describe('personalizeWallNotice', () => {
  it('mantém a comunicação em segunda pessoa para a destinatária', () => {
    expect(personalizeWallNotice(notice, 'ana@example.com', () => 'Ana')).toBe(notice);
  });

  it('identifica a destinatária para os demais alunos', () => {
    const result = personalizeWallNotice(notice, 'bia@example.com', () => 'Ana');
    expect(result.title).toBe('🏅 Ana é Monitor(a) da Semana!');
    expect(result.content).toBe('Ana, parabéns! Ana foi selecionada.');
  });
});
