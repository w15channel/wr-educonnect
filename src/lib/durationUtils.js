/**
 * durationUtils
 * ─────────────
 * A carga horária da plataforma é contada em MINUTOS e sempre exibida como
 * tempo no formato HH:MM:SS (ex.: 01:30:00), nunca como texto ("1h").
 */

// Minutos padrão de cada tipo de atividade.
export const ACTIVITY_MINUTES = {
  lesson: 0,      // usa a duração do vídeo cadastrada pelo professor
  apostila: 30,   // 00:30:00 por capítulo da apostila marcado como lido
  task: 30,       // 00:30:00 por tarefa entregue
  quiz: 90,       // 01:30:00 por prova entregue
  exam: 90,       // 01:30:00 por prova entregue
  forum: 10,      // 00:10:00 por participação em fórum/debates
  mentorship: 60, // usa a duração cadastrada pelo professor
  therapist: 60,  // 01:00:00 por atendimento
  ofensiva: 20,   // 00:20:00 por participação
};

const pad = (n) => String(Math.trunc(Math.abs(n))).padStart(2, '0');

/** Converte minutos (aceita decimais) para "HH:MM:SS". */
export function formatDuration(minutes) {
  const totalSeconds = Math.max(0, Math.round((Number(minutes) || 0) * 60));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * Interpreta a duração cadastrada pelo professor e devolve minutos.
 * Aceita "45", "45 min", "1h", "1h30", "1:30", "01:30:00".
 */
export function parseDurationToMinutes(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? Math.max(0, value) : 0;

  const text = String(value).trim().toLowerCase();
  if (!text) return 0;

  // Formato de relógio: HH:MM:SS ou MM:SS / HH:MM
  const clock = text.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
  if (clock) {
    const [, a, b, c] = clock;
    return c !== undefined
      ? Number(a) * 60 + Number(b) + Number(c) / 60
      : Number(a) * 60 + Number(b);
  }

  // Formato textual: "1h 30min", "2 horas", "45 min"
  const hoursMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:h|hora)/);
  const minutesMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:min|m\b|minuto)/);
  if (hoursMatch || minutesMatch) {
    const hours = hoursMatch ? Number(hoursMatch[1].replace(',', '.')) : 0;
    const mins = minutesMatch ? Number(minutesMatch[1].replace(',', '.')) : 0;
    return Math.max(0, hours * 60 + mins);
  }

  // Apenas um número → minutos
  const standalone = text.match(/^(\d+(?:[.,]\d+)?)$/);
  if (standalone) return Math.max(0, Number(standalone[1].replace(',', '.')));

  return 0;
}
