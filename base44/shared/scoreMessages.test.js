import { describe, expect, it } from 'vitest';
import { preserveOrGenerateFeedback } from './scoreMessages.ts';

describe('preserveOrGenerateFeedback', () => {
  it('preserves the professor feedback from the submission', () => {
    expect(preserveOrGenerateFeedback('  Ótima análise clínica.  ', 'Mensagem antiga', 'Automático'))
      .toBe('Ótima análise clínica.');
  });

  it('repairs a submission from the existing score observation', () => {
    expect(preserveOrGenerateFeedback('', 'Reforce a conclusão.', 'Automático'))
      .toBe('Reforce a conclusão.');
  });

  it('generates automatic feedback only when no evaluation exists', () => {
    expect(preserveOrGenerateFeedback(null, '   ', 'Parabéns pela entrega!'))
      .toBe('Parabéns pela entrega!');
  });
});
