import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';
import { LifeBuoy, Sparkles, ArrowRight, Clock, Loader2, CheckCircle2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import SupportTicketCard from '@/components/support/SupportTicketCard';

const STATUS_GROUPS = [
  { id: 'open', label: 'Aguardando Atendimento', icon: Clock, badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20', accent: 'border-l-amber-500' },
  { id: 'in_progress', label: 'Em Atendimento', icon: Loader2, badge: 'bg-blue-500/10 text-blue-600 border-blue-500/20', accent: 'border-l-blue-500' },
  { id: 'resolved', label: 'Solucionados', icon: CheckCircle2, badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', accent: 'border-l-emerald-500' },
];

function ExpandableGroup({ group, tickets, isTeacher, isDefaultOpen, onRespond, onChangeStatus, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(isDefaultOpen);
  const Icon = group.icon;
  const isEmpty = tickets.length === 0;

  return (
    <div className={`rounded-2xl border border-border bg-card overflow-hidden ${isEmpty ? 'opacity-60' : ''}`}>
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50 ${group.accent} border-l-4`}
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${group.badge}`}>
          <Icon size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-sm text-foreground">{group.label}</span>
          <span className="block text-[11px] text-muted-foreground">{tickets.length} {tickets.length === 1 ? 'chamado' : 'chamados'}</span>
        </span>
        {!isEmpty && (
          <ChevronDown
            size={18}
            className={`shrink-0 text-muted-foreground transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
        )}
      </button>
      {expanded && !isEmpty && (
        <div className="space-y-3 p-3 pt-1">
          {tickets.map((ticket) => (
            <SupportTicketCard
              key={ticket.id}
              ticket={ticket}
              isTeacher={isTeacher}
              onRespond={onRespond}
              onChangeStatus={onChangeStatus}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

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

  const editMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SupportTicket.update(id, data),
    onSuccess: () => { invalidate(); toast.success('Chamado atualizado com sucesso.'); },
    onError: () => toast.error('Não foi possível atualizar o chamado.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SupportTicket.delete(id),
    onSuccess: () => { invalidate(); toast.success('Chamado excluído.'); },
    onError: () => toast.error('Não foi possível excluir o chamado.'),
  });

  // Agrupa chamados por status
  const groupedTickets = STATUS_GROUPS.reduce((acc, group) => {
    acc[group.id] = tickets.filter((t) => t.status === group.id);
    return acc;
  }, {});

  const cardProps = {
    isTeacher,
    onRespond: (id, support_response) => respondMutation.mutate({ id, support_response }),
    onChangeStatus: (id, status) => statusMutation.mutate({ id, status }),
    onEdit: (id, data) => editMutation.mutate({ id, data }),
    onDelete: (id) => deleteMutation.mutate(id),
  };

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
            onClick={() => navigate('../chat?tab=luna&support=true')}
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
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="bg-card rounded-2xl border border-border h-16 animate-pulse" />)}</div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <LifeBuoy size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold">Nenhum chamado por aqui</p>
          <p className="text-sm mt-1">{isTeacher ? 'Nenhum aluno abriu chamados ainda.' : 'Quando algo der errado, fale com a Luna acima.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {STATUS_GROUPS.map((group) => (
            <ExpandableGroup
n              key={group.id}
              group={group}
              tickets={groupedTickets[group.id] || []}
              {...cardProps}
              isDefaultOpen={group.id === 'open' || group.id === 'in_progress'}
            />
          ))}
        </div>
      )}
    </div>
  );
}