/**
 * Funções (papéis) de usuário da plataforma.
 * A função salva no código de acesso define como o usuário é identificado
 * no site e quais privilégios ele recebe ao entrar.
 */
export const PROFILE_FUNCTIONS = [
  { value: 'student', label: 'Aluno', privileged: false },
  { value: 'teacher', label: 'Professor', privileged: true },
  { value: 'admin', label: 'Administrador', privileged: true },
  { value: 'support', label: 'Suporte', privileged: false },
  { value: 'management', label: 'Gestão', privileged: true },
];

export function functionLabel(profileCategory, role) {
  const found = PROFILE_FUNCTIONS.find((item) => item.value === profileCategory);
  if (found) return found.label;
  return role === 'admin' ? 'Administrador' : 'Aluno';
}

export function isPrivilegedFunction(profileCategory) {
  return PROFILE_FUNCTIONS.some((item) => item.value === profileCategory && item.privileged);
}