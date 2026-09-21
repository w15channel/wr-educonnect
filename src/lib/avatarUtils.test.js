import { describe, expect, it } from 'vitest';
import { resolveDisplayName } from '@/lib/avatarUtils';

describe('resolveDisplayName', () => {
  it('usa o nickname como identidade social antes de qualquer nome cadastral', () => {
    expect(resolveDisplayName({
      email: 'aluno@example.com',
      profile: { nickname: 'Lua', full_name: 'Nome Civil Completo' },
      code: { profile_name: 'Nome do Cadastro', student_name: 'Outro Nome' },
    })).toBe('Lua');
  });

  it('mantém uma sequência segura de fallback quando não há nickname', () => {
    expect(resolveDisplayName({
      email: 'aluno@example.com',
      profile: { full_name: 'Nome Completo' },
      code: { profile_name: 'Nome Público' },
    })).toBe('Nome Público');

    expect(resolveDisplayName({ email: 'aluno@example.com' })).toBe('aluno@example.com');
  });
});
