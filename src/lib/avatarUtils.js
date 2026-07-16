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
