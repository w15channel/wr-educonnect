import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import useModuleReleaseSchedule from '@/hooks/useModuleReleaseSchedule';

export default function useModuleAccess(course = 'tcc', session) {
  const email = session?.email || session?.code || '';
  const customAccess = !!(session?.code || session?.codeId);
  // O calendário de liberação é relevante tanto para alunos Google OAuth
  // quanto para alunos de código de acesso — ambos precisam ver os módulos
  // liberados pelo calendário além das liberações manuais.
  const { schedule, now, isLoading: loadingSchedule, error: scheduleError } = useModuleReleaseSchedule(true);
  const { data: saved = [], isLoading, error } = useQuery({
    queryKey: ['module-unlocks', email],
    queryFn: () => base44.entities.StudentModuleUnlock.filter({ student_email: email }, '-unlocked_at', 100),
    enabled: !!email,
    staleTime: 30000,
    refetchInterval: 60000,
  });
  const unlocks = useMemo(() => {
    const current = saved.filter(u => (u.course || 'tcc') === course && Date.parse(u.unlocked_at) <= now);
    const known = new Set(current.map(u => Number(u.module_number)));
    return [...current, ...schedule.filter(r => Date.parse(r.release_at) <= now && !known.has(Number(r.module_number)))
      .map(r => ({ student_email: email, course, module_number: Number(r.module_number), unlocked_at: r.release_at, unlocked_by: 'sistema:calendario-2026' }))];
  }, [saved, course, schedule, now, email]);
  const availableModules = useMemo(() => [...new Set([1, ...unlocks.map(u => Number(u.module_number))])].sort((a, b) => a - b), [unlocks]);
  const moduleUnlocked = Array.from({ length: 10 }, (_, i) => session?.role === 'admin' || availableModules.includes(i + 1));
  return { unlocks, schedule, availableModules, moduleUnlocked, currentModule: Math.max(...availableModules), isLoading: loadingSchedule || (!!email && isLoading), error: scheduleError || error };
}