import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';
import { LifeBuoy, Sparkles, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import SupportTicketCard from '@/components/support/SupportTicketCard';

export default function Support() {
  const { user: session } = useOutletContext();
  const isTeacher = session?.role === 'admin';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { course: routeCourse } = useCourseFilteredEmails();
  const userCourse = routeCourse || session?.course || 'tcc';
  const myId = session?.email || session?.code || '';

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['support-tickets', userCourse, isTeacher ? 'all' : myId],
    queryFn: async () => {
      const records = await base44.entities.SupportTicket.filter({ course: userCourse }, '-created_date', 300);
      return isTeacher ? records : records.filter((t) => t.student_email === myId);
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['support-tickets'] });

  const respondMutation = useMutation({
    mutationFn: ({ id, support_response }) => base44.entities.SupportTicket.update(id, {
      support_response,
      status: 'in_progress',
      responded_at: new Date().toISOString(),
    }),
    onSuccess: () => { invalidate(); toast.success('Resposta enviada ao aluno.'); },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.SupportTicket.update(id, { status }),
    onSuccess: () => { invalidate(); toast.success('Situação do chamado atualizada.'); },
  });

  return (
    <div className="app-page app-page--narrow animate-fade-in-up">
      <div className="mb-5">
        <h2 className="text-xl lg:text-2xl font-bold text-foreground">Suporte ao Aluno</h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          {isTeacher
            ? 'Chamados abertos pelos alunos: responda e acompanhe cada atendimento.'
            : 'Está com algum problema na plataforma? Fale com a Luna e ela abre um chamado para você.'}
        </p>
      </div>

      {!isTeacher && (
        <div className="mb-5">
          <button
            type="button"
            onClick={() => navigate('/chat?tab=luna&support=true')}
            className="group flex w-full items-center gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-5 text-left transition-colors hover:bg-primary/10"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Sparkles size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-foreground">Falar com a Luna para abrir um chamado</p>
              <p className="text-xs text-muted-foreground mt-0.5">Conte o que está acontecendo e ela registra o chamado para a equipe de suporte.</p>
            </div>
            <ArrowRight size={20} className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="bg-card rounded-2xl border border-border h-24 animate-pulse" />)}</div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <LifeBuoy size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold">Nenhum chamado por aqui</p>
          <p className="text-sm mt-1">{isTeacher ? 'Nenhum aluno abriu chamados ainda.' : 'Quando algo der errado, fale com a Luna acima.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <SupportTicketCard
              key={ticket.id}
              ticket={ticket}
              isTeacher={isTeacher}
              onRespond={(id, support_response) => respondMutation.mutate({ id, support_response })}
              onChangeStatus={(id, status) => statusMutation.mutate({ id, status })}
            />
          ))}
        </div>
      )}
    </div>
  );
}