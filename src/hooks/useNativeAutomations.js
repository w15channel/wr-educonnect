import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Dispara o motor de automação nativo sempre que alguém usa o app,
 * no máximo uma vez a cada 30 minutos por aparelho.
 * Não consome integrações: são regras de código próprias do app.
 */
const STORAGE_KEY = 'wr-edu:automacoes';
const INTERVAL_MS = 30 * 60 * 1000;

export default function useNativeAutomations(enabled) {
  useEffect(() => {
    if (!enabled) return;
    const last = Number(localStorage.getItem(STORAGE_KEY) || 0);
    if (Date.now() - last < INTERVAL_MS) return;
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    base44.functions.invoke('automationEngine', {}).catch(() => {
      // Automação é silenciosa: uma falha não pode atrapalhar a navegação do aluno.
    });
  }, [enabled]);
}