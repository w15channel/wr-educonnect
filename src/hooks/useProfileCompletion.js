import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { buildInitialValues, missingSteps } from '@/lib/profileRequirements';

const normalize = (value) => String(value || '').trim().toLowerCase();

/** Marca local de cadastro concluído — evita que a Luna repita o pedido. */
export const profileDoneKey = (codeId) => `wr_profile_done_${codeId}`;

/** Entre vários cadastros do mesmo aluno, vale o mais preenchido. */
const pickBestProfile = (profiles, session) => {
  if (profiles.length <= 1) return profiles[0] || null;
  const score = (p) => missingSteps(buildInitialValues(p, session)).length;
  return [...profiles].sort((a, b) => score(a) - score(b))[0];
};

/** Busca todos os cadastros do aluno: pelo vínculo do código e pelo email/código. */
export async function findStudentProfiles(session) {
  const results = [];
  if (session?.codeId) {
    results.push(...await base44.entities.StudentProfile.filter({ code_id: session.codeId }, '-created_date', 20));
  }
  for (const id of [session?.email, session?.code].filter(Boolean).map(normalize)) {
    results.push(...await base44.entities.StudentProfile.filter({ student_email: id }, '-created_date', 20));
  }
  const unique = [];
  results.forEach((item) => { if (!unique.some((p) => p.id === item.id)) unique.push(item); });
  return unique;
}

/**
 * Descobre se o cadastro do aluno está completo (exceto a foto, que é opcional).
 * A busca considera o vínculo do código e também o email/código do aluno, para
 * que cadastros antigos não sejam pedidos de novo. Em caso de falha na consulta,
 * nada é pedido — assim ninguém entra em loop de cadastro.
 */
export default function useProfileCompletion(session) {
  const codeId = session?.codeId;
  const isStudent = !!session && session.role !== 'admin';

  const { data: profiles = [], isLoading, isSuccess } = useQuery({
    queryKey: ['profile-completion', codeId, session?.email, session?.code],
    queryFn: () => findStudentProfiles(session),
    enabled: !!codeId && isStudent,
    staleTime: 60000,
  });

  const profile = useMemo(() => pickBestProfile(profiles, session), [profiles, session]);
  const values = useMemo(() => buildInitialValues(profile, session), [profile, session]);
  const missing = useMemo(() => missingSteps(values), [values]);

  const alreadyDone = !!codeId && localStorage.getItem(profileDoneKey(codeId)) === '1';

  return {
    profile,
    values,
    missing,
    isLoading,
    needsCompletion: isStudent && !!codeId && isSuccess && !isLoading && !alreadyDone && missing.length > 0,
  };
}