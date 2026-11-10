import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { mergeModuleReleaseSchedules } from '@/lib/moduleReleaseSchedule';

export default function useModuleReleaseSchedule(enabled = true) {
  const [now, setNow] = useState(Date.now);
  const query = useQuery({
    queryKey: ['module-release-schedule'],
    queryFn: () => base44.entities.ModuleReleaseSchedule.list('module_number', 20),
    staleTime: 60000,
    refetchInterval: 60000,
    enabled,
  });
  // O calendário embarcado é a automação secundária: mesmo que a consulta ou
  // a automação principal falhe por falta de créditos, a data libera o módulo
  // diretamente no cliente. Dados remotos válidos ainda podem antecipá-la.
  const schedule = mergeModuleReleaseSchedules(query.data);
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const next = schedule.map(r => Date.parse(r.release_at)).filter(t => t > Date.now()).sort((a, b) => a - b)[0];
    const timer = window.setTimeout(refresh, next ? Math.min(Math.max(1, next - Date.now()), 2147483647) : 2147483647);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { clearTimeout(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [schedule, now]);
  // Falha remota não é erro operacional: o calendário local segue íntegro.
  return { schedule, now, isLoading: false, error: null, usingFallback: query.isLoading || !!query.error };
}
