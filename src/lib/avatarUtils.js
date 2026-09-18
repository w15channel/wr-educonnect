export const AVATAR_OPTIONS = [
  { id: 'a1', emoji: '🎓', label: 'Formando' },
  { id: 'a2', emoji: '🧘', label: 'Zen' },
  { id: 'a3', emoji: '🌟', label: 'Estrela' },
  { id: 'a4', emoji: '🦋', label: 'Borboleta' },
  { id: 'a5', emoji: '🌸', label: 'Flor' },
  { id: 'a6', emoji: '🦁', label: 'Leão' },
  { id: 'a7', emoji: '🐬', label: 'Golfinho' },
  { id: 'a8', emoji: '🌈', label: 'Arco-íris' },
  { id: 'a9', emoji: '🔮', label: 'Cristal' },
  { id: 'a10', emoji: '🌻', label: 'Girassol' },
  { id: 'a11', emoji: '🦉', label: 'Coruja' },
  { id: 'a12', emoji: '🌊', label: 'Onda' },
  { id: 'a13', emoji: '🚀', label: 'Foguete' },
  { id: 'a14', emoji: '💎', label: 'Diamante' },
  { id: 'a15', emoji: '🎯', label: 'Foco' },
  { id: 'a16', emoji: '🔥', label: 'Chama' },
  { id: 'a17', emoji: '✨', label: 'Brilho' },
  { id: 'a18', emoji: '🧠', label: 'Mente' },
  { id: 'a19', emoji: '🌙', label: 'Lua' },
  { id: 'a20', emoji: '💪', label: 'Força' },
];

const LEGACY_EMOJIS = ['🧠', '🌱', '💫', '🔥', '⚡', '🌟', '🎯', '🧬', '🌀', '🎓', '🦋', '🌊', '🎭', '🏆', '✨', '🌺', '🦉', '🚀', '💎', '🌙'];

export function resolveAvatarEmoji(value) {
  if (!value) return '';
  const trimmed = String(value).trim();
  const option = AVATAR_OPTIONS.find((item) => item.id === trimmed || item.emoji === trimmed);
  if (option) return option.emoji;
  const numericIndex = Number(trimmed);
  if (Number.isInteger(numericIndex) && numericIndex >= 0 && numericIndex < LEGACY_EMOJIS.length) {
    return LEGACY_EMOJIS[numericIndex];
  }
  return trimmed;
}

export function getInitials(name) {
  return name ? name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() : '?';
}

export function getAvatarPrefixedName(name, avatarValue) {
  const emoji = resolveAvatarEmoji(avatarValue);
  return emoji ? `${emoji} ${name}` : name;
}

/**
 * Resolve o nome de exibição social do aluno.
 *
 * Prioridade: nickname (StudentProfile) → profile_name (AccessCode) →
 * full_name (StudentProfile) → student_name (AccessCode) → email.
 *
 * O nickname é a identidade social padrão. Alunos sem nickname aparecem
 * pelo nome completo. Nome completo é usado somente em documentos oficiais.
 *
 * @param {Object}  params
 * @param {string}  params.email  - Email do aluno
 * @param {Object}  [params.code]    - Registro de AccessCode
 * @param {Object}  [params.profile]  - Registro de StudentProfile
 * @returns {string} Nome de exibição
 */
export function resolveDisplayName({ email, code, profile } = {}) {
  if (profile?.nickname?.trim()) return profile.nickname.trim();
  if (code?.profile_name?.trim()) return code.profile_name.trim();
  if (profile?.full_name?.trim()) return profile.full_name.trim();
  if (code?.student_name?.trim()) return code.student_name.trim();
  return email || 'Aluno';
}

/**
 * Constrói um mapa de email → { nickname, full_name } a partir de StudentProfiles.
 * Permite lookup rápido em componentes que não têm o perfil individual.
 *
 * @param {Array} profiles - Lista de StudentProfile
 * @returns {Map} email(lowercase) → { nickname, full_name }
 */
export function buildProfileMap(profiles = []) {
  const map = new Map();
  for (const p of profiles) {
    if (!p.student_email) continue;
    map.set(p.student_email.toLowerCase().trim(), p);
  }
  return map;
}

/**
 * Resolve o nome de exibição usando um mapa de perfis + lista de AccessCodes.
 *
 * @param {string} email - Email do aluno
 * @param {Map}   profileMap - Map de buildProfileMap()
 * @param {Array} accessCodes - Lista de AccessCodes
 * @returns {string} Nome de exibição
 */
export function resolveDisplayNameFromMaps(email, profileMap, accessCodes = []) {
  if (!email) return 'Aluno';
  const lower = email.toLowerCase().trim();
  const profile = profileMap?.get(lower);
  const code = accessCodes.find((c) => c.student_email?.toLowerCase().trim() === lower);
  return resolveDisplayName({ email, code, profile });
}