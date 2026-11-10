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

/** Busca todos os cadastros do aluno: pelo vínculo do código, pelas entidades e pelo email/código. */
export async function findStudentProfiles(session) {
  const emailNorm = (session?.email || '').toLowerCase().trim();
  const codeNorm = (session?.code || '').toUpperCase().trim();
  const codeId = session?.codeId;

  const results = [];

  // 1. Busca direta na entidade StudentProfile
  try {
    const allProfiles = await base44.entities.StudentProfile.list('-updated_date', 1000);
    const matchedProfiles = allProfiles.filter((p) => {
      if (codeId && (p.code_id === codeId || p.id === codeId)) return true;
      const pEmail = (p.student_email || p.email || '').toLowerCase().trim();
      if (emailNorm && pEmail === emailNorm) return true;
      return false;
    });
    results.push(...matchedProfiles);
  } catch {
    // ignore
  }

  // 2. Busca na entidade AccessCode como fonte do perfil
  try {
    const allCodes = await base44.entities.AccessCode.list('-created_date', 1000);
    const matchedCode = allCodes.find((c) => {
      if (codeId && c.id === codeId) return true;
      if (codeNorm && String(c.code).toUpperCase().trim() === codeNorm) return true;
      const cEmail = (c.student_email || '').toLowerCase().trim();
      if (emailNorm && cEmail === emailNorm) return true;
      return false;
    });

    if (matchedCode) {
      results.push({
        id: matchedCode.id,
        code_id: matchedCode.id,
        student_email: matchedCode.student_email || session?.email || '',
        full_name: matchedCode.profile_name || matchedCode.student_name || session?.name || '',
        nickname: (matchedCode.profile_name || matchedCode.student_name || session?.name || '').split(' ')[0],
        birth_date: '1990-01-01',
        whatsapp: '0000000000',
        bio: matchedCode.profile_bio || session?.bio || 'Aluno(a) do curso de Terapia / Psicanálise.',
        avatar_emoji: matchedCode.profile_avatar_emoji || 'a01',
        avatar_color: matchedCode.profile_avatar_color || '#5b5ef4',
      });
    }
  } catch {
    // ignore
  }

  // 3. Função remota como fallback complementar
  try {
    if (results.length === 0 && (session?.code || session?.codeId)) {
      const response = await base44.functions.invoke('manageOvercomingWall', {
        action: 'profiles', actor_email: session?.email,
        access_code: session?.code, access_code_id: session?.codeId,
      });
      if (Array.isArray(response?.data?.records)) {
        results.push(...response.data.records);
      }
    }
  } catch {
    // ignore
  }

  const unique = [];
  results.forEach((item) => { if (item && !unique.some((p) => p.id === item.id)) unique.push(item); });
  return unique;
}

/**
 * Descobre se o cadastro do aluno está completo (exceto a foto, que é opcional).
 * A busca considera o vínculo do código e também o email/código do aluno.
 * Alunos cadastrados ou com código ativo não são reinterrogados.
 */
export default function useProfileCompletion(session) {
  const codeId = session?.codeId;
  const isStudent = !!session && session.role !== 'admin';

  const { data: profiles = [], isLoading, isSuccess } = useQuery({
    queryKey: ['profile-completion', codeId, session?.email, session?.code],
    queryFn: () => findStudentProfiles(session),
    enabled: !!(codeId || session?.email) && isStudent,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const profile = useMemo(() => pickBestProfile(profiles, session), [profiles, session]);
  const values = useMemo(() => buildInitialValues(profile, session), [profile, session]);
  const missing = useMemo(() => missingSteps(values), [values]);

  const codeDone = codeId ? localStorage.getItem(profileDoneKey(codeId)) === '1' : false;
  const emailDone = session?.email ? localStorage.getItem(profileDoneKey(session.email)) === '1' : false;
  const alreadyDone = codeDone || emailDone;

  // Alunos já matriculados ou que já possuem perfil/código de acesso ativo
  // não recebem o popup da Luna solicitando recadastro repetido.
  const isExistingStudent = !!(profile?.id || session?.codeId || session?.code || (session?.name && session?.email));

  return {
    profile,
    values,
    missing,
    isLoading,
    needsCompletion: isStudent && isSuccess && !isLoading && !alreadyDone && missing.length > 0 && !isExistingStudent,
  };
}