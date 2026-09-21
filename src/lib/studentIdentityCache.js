const IDENTITY_QUERY_PREFIXES = new Set([
  'social-identity',
  'profile-completion',
  'student-profile-edit',
  'student-profiles',
  'display-name-profiles',
  'overcoming-wall-profiles',
]);

/**
 * Invalida todas as leituras que podem conter nome/apelido do aluno.
 *
 * A identidade aparece em várias telas e cada uma possui uma chave de cache
 * diferente. Centralizar a invalidação evita que o nome civil continue visível
 * até um refresh depois que o aluno escolhe ou altera o apelido.
 */
export function invalidateStudentIdentity(queryClient) {
  return queryClient.invalidateQueries({
    predicate: (query) => IDENTITY_QUERY_PREFIXES.has(query.queryKey?.[0]),
  });
}

export { IDENTITY_QUERY_PREFIXES };
