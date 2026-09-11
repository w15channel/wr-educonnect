import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { buildInitialValues, missingSteps } from '@/lib/profileRequirements';

/**
 * Descobre se o cadastro do aluno está completo (exceto a foto, que é opcional).
 * A busca é sempre pelo code_id, para nunca cruzar dados de outro aluno.
 */
export default function useProfileCompletion(session) {
  const codeId = session?.codeId;
  const isStudent = !!session && session.role !== 'admin';

  const { data = [], isLoading } = useQuery({
    queryKey: ['profile-completion', codeId],
    queryFn: () => base44.entities.StudentProfile.filter({ code_id: codeId }, '-created_date', 1),
    enabled: !!codeId && isStudent,
    staleTime: 60000,
  });

  const profile = data[0] || null;
  const values = useMemo(() => buildInitialValues(profile, session), [profile, session]);
  const missing = useMemo(() => missingSteps(values), [values]);

  return {
    profile,
    values,
    missing,
    isLoading,
    needsCompletion: isStudent && !!codeId && !isLoading && missing.length > 0,
  };
}