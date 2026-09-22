import { describe, expect, it, vi } from 'vitest';
import { invalidateStudentIdentity } from './studentIdentityCache';

describe('invalidateStudentIdentity', () => {
  it('invalida apenas caches que podem guardar nome ou apelido', async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);

    await invalidateStudentIdentity({ invalidateQueries });

    const { predicate } = invalidateQueries.mock.calls[0][0];
    expect(predicate({ queryKey: ['social-identity', 'aluno@email.com'] })).toBe(true);
    expect(predicate({ queryKey: ['profile-completion', 'code-id'] })).toBe(true);
    expect(predicate({ queryKey: ['display-name-profiles', 'tcc'] })).toBe(true);
    expect(predicate({ queryKey: ['tasks', 'tcc'] })).toBe(false);
  });
});
