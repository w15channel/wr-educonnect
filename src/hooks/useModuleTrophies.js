import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { parseModuleNumber } from '@/lib/examChecklistRules';

const normalize = (value = '') => String(value || '').trim().toLowerCase();

export default function useModuleTrophies(course = 'tcc') {
  const { data: completions = [], isLoading } = useQuery({
    queryKey: ['verified-module-trophies', course],
    queryFn: async () => {
      const result = await base44.entities.Achievement.aggregate({
        query: { course, kind: 'module', dedupe_key: { $regex: '^module-trophy:' } },
        groupBy: ['student_email', 'source_id'], min: 'occurred_at', limit: 1000,
      });
      return result.rows.map(row => ({
        id: `${row.student_email}:${row.source_id}`, student_email: row.student_email,
        moduleNumber: parseModuleNumber(row.source_id), submitted_at: row.min_occurred_at,
      }));
    },
    staleTime: 60000,
    refetchInterval: 120000,
  });
  const byEmail = useMemo(() => {
    const map = new Map();
    completions.forEach((item) => {
      const email = normalize(item.student_email);
      if (!map.has(email)) map.set(email, []);
      if (!map.get(email).some((entry) => entry.moduleNumber === item.moduleNumber)) map.get(email).push(item);
    });
    map.forEach((items) => items.sort((a, b) => a.moduleNumber - b.moduleNumber));
    return map;
  }, [completions]);
  return { completions, byEmail, isLoading };
}