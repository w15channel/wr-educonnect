export const LUNA_DM_EMAIL = 'luna@wr-edu.internal';
export const LUNA_DM_NAME = 'Luna · Assistente digital';

export function getDMSessionId(emailA, emailB) {
  const sorted = [String(emailA || '').toLowerCase(), String(emailB || '').toLowerCase()].sort();
  return `dm_${sorted[0]}_${sorted[1]}`;
}

export function isLunaDistribution(message) {
  return message?.is_luna_distribution === true || message?.author_email === LUNA_DM_EMAIL;
}