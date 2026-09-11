import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { buildInitialValues, missingSteps } from '@/lib/profileRequirements';

const normalize = (value) => String(value || '').trim().toLowerCase();

/** Entre vários cadastros do mesmo aluno, vale o mais preenchido. */
const pickBestProfile = (profiles, session) => {
  if (profiles.length <= 1) return profiles[0] || null;
  const score = (p) => missingSteps(buildInitialValues(p, session)).length;
  return [...profiles].sort((a, b) => score(a) - score(b))[0];
};

/**
 * Descobre se o cadastro do aluno está completo (exceto a foto, que é opcional).
 * A busca prioriza o code_id, mas cai para o email/código do aluno quando o
 * cadastro antigo foi salvo sem o vínculo — assim a Luna não pede tudo de novo.
 */
export default function useProfileCompletion(session) {
  const codeId = session?.codeId;
  const isStudent = !!session && session.role !== 'admin';
  const identifiers = [session?.email, session?.code].filter(Boolean).map(normalize);

  const { data: profile = null, isLoading } = useQuery({
    queryKey: ['profile-completion', codeId, identifiers.join('|')],
    queryFn: async () => {
      const byCode = await base44.entities.StudentProfile.filter({ code_id: codeId }, '-created_date', 20);
      const best = pickBestProfile(byCode, session);
      if (best && missingSteps(buildInitialValues(best, session)).length === 0) return best;

      // Cadastros legados foram gravados apenas com o email do aluno.
      const byEmail = [];
      for (const id of identifiers) {
        const found = await base44.entities.StudentProfile.filter({ student_email: id }, '-created_date', 20);
        byEmail.push(...found);
      }
      return pickBestProfile([...byCode, ...byEmail], session) || null;
    },
    enabled: !!codeId && isStudent,
    staleTime: 60000,
  });

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