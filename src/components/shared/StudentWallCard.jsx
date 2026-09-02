import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, MessageSquareHeart } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ClickableStudent } from '@/components/shared/StudentProfileCard';
import { normalizeStudentEmail } from '@/lib/therapistPairings';

/**
 * Mural individual do aluno.
 *
 * Lista as publicações feitas em nome do aluno logado (ex.: pareamento do
 * Terapeuta da Semana, avisos direcionados, etc. — ver `src/lib/studentWallPost.js`).
 * Qualquer nova funcionalidade que publique algo em nome de um aluno deve
 * gravar um `StudentWallPost` para que a mensagem apareça aqui automaticamente.
 */
export default function StudentWallCard({ studentEmail, className = '' }) {
  const queryClient = useQueryClient();
  const normalizedStudentEmail = normalizeStudentEmail(studentEmail);

  const { data: posts = [] } = useQuery({
    queryKey: ['student-wall-posts', normalizedStudentEmail],
    queryFn: async () => {
      const requestedEmails = [...new Set([studentEmail, normalizedStudentEmail].filter(Boolean))];
      const results = await Promise.all(requestedEmails.map((email) =>
        base44.entities.StudentWallPost.filter({ student_email: email }, '-published_at', 30)
      ));
      return [...new Map(results.flat().map((post) => [post.id, post])).values()]
        .sort((a, b) => String(b.published_at || '').localeCompare(String(a.published_at || '')))
        .slice(0, 30);
    },
    enabled: !!normalizedStudentEmail,
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.StudentWallPost.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['student-wall-posts', normalizedStudentEmail] }),
  });

  if (!studentEmail || posts.length === 0) return null;

  return (
    <div className={`bg-card rounded-2xl border border-border p-5 space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
          <MessageSquareHeart size={16} className="text-violet-600" />
        </div>
        <div>
          <p className="font-bold text-sm text-foreground">Seu mural individual</p>
          <p className="text-xs text-muted-foreground">Publicações feitas em seu nome na plataforma</p>
        </div>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {posts.map((post) => (
          <div
            key={post.id}
            className={`rounded-xl border p-3 text-sm cursor-pointer ${post.is_read ? 'border-border bg-secondary/30' : 'border-violet-200 bg-violet-500/5'}`}
            onClick={() => !post.is_read && markReadMutation.mutate(post.id)}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-xs text-foreground flex items-center gap-1.5">
                {!post.is_read && <Bell size={11} className="text-violet-600" />}
                {post.title || 'Publicação'}
              </p>
              {post.published_at && (
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {format(new Date(post.published_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{post.message}</p>
            {post.related_email && (
              <p className="mt-2 text-[11px] font-semibold text-violet-600">
                Contato da dupla:{' '}
                <ClickableStudent email={post.related_email} className="text-violet-700">
                  {post.related_name || post.related_email}
                </ClickableStudent>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
