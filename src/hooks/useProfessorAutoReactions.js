import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const REACTIONS = ['love', 'celebrate', 'applaud'];
const DELAY_MS = 5000;

/**
 * Prestígio do Professor no Mural de Superação.
 * Enquanto a conta do professor (admin) está com o mural aberto, cada nova
 * publicação ou conquista de aluno recebe uma reação aleatória — amar,
 * celebrar ou aplaudir — feita em nome dele, uma por vez.
 */
export default function useProfessorAutoReactions({ enabled, session, feed = [], reactions = [] }) {
  const queryClient = useQueryClient();
  const workingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !session?.email || workingRef.current) return;

    const candidates = feed
      .map((item) => {
        if (item.feedType === 'achievement') return { id: item.id, targetType: 'achievement', owner: item.studentEmail };
        if (item.feedType === 'encouragement') return { id: item.id, targetType: 'publication', owner: item.author_email };
        return null;
      })
      .filter((item) => item?.owner && item.owner !== session.email)
      .filter((item) => !reactions.some((reaction) => reaction.target_id === item.id && reaction.actor_email === session.email));

    if (candidates.length === 0) return;

    const target = candidates[0];
    const reaction = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
    workingRef.current = true;

    const timer = setTimeout(async () => {
      try {
        await base44.functions.invoke('manageOvercomingWall', {
          action: 'react',
          actor_email: session.email,
          access_code: session.code,
          target_id: target.id,
          target_type: target.targetType,
          target_owner_email: target.owner,
          reaction,
        });
        await queryClient.invalidateQueries({ queryKey: ['overcoming-wall-reactions'] });
      } finally {
        workingRef.current = false;
      }
    }, DELAY_MS);

    return () => {
      clearTimeout(timer);
      workingRef.current = false;
    };
  }, [enabled, session?.email, session?.code, feed, reactions, queryClient]);
}