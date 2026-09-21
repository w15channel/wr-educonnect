import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { findStudentProfiles } from '@/hooks/useProfileCompletion';
import { resolveDisplayName } from '@/lib/avatarUtils';

/**
 * Identidade usada nas interações sociais da plataforma.
 * O apelido escolhido pelo aluno sempre vence o nome civil; este último fica
 * disponível apenas como fallback e para fluxos formais/documentais.
 */
export default function useSocialIdentity(session) {
  const isStudent = !!session && session.role !== 'admin';
  const hasIdentifier = !!(session?.email || session?.code || session?.codeId);

  const { data: profiles = [], isLoading, isFetching } = useQuery({
    queryKey: ['social-identity', session?.codeId, session?.email, session?.code],
    queryFn: () => findStudentProfiles(session),
    enabled: isStudent && hasIdentifier,
    // A identidade é pequena, sensível e pode ter sido alterada em outra tela
    // ou dispositivo. Confirme-a no ingresso antes de saudar o aluno.
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const profile = useMemo(() => {
    const withNickname = profiles.find((item) => item?.nickname?.trim());
    return withNickname || profiles[0] || null;
  }, [profiles]);

  const socialName = resolveDisplayName({
    email: session?.email,
    profile,
    code: {
      nickname: session?.nickname,
      profile_name: session?.profile_name,
      student_name: session?.name || session?.full_name,
    },
  });

  return {
    profile,
    socialName,
    firstName: socialName.trim().split(/\s+/)[0] || 'Aluno',
    isLoading: isLoading || isFetching,
  };
}
