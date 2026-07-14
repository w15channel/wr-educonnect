import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Heart, PartyPopper, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TherapistWeekInviteCard({ studentEmail }) {
  const queryClient = useQueryClient();

  const { data: settingsList = [] } = useQuery({
    queryKey: ['therapist-week-settings'],
    queryFn: () => base44.entities.TherapistWeekSettings.list('-created_date', 1),
  });
  const currentRound = settingsList[0]?.current_round || 1;

  const { data: optIns = [], isLoading } = useQuery({
    queryKey: ['therapist-week-optin', studentEmail, currentRound],
    queryFn: () => base44.entities.TherapistWeekOptIn.filter({ student_email: studentEmail, round: currentRound }, '-created_date', 1),
    enabled: !!studentEmail,
  });
  const myOptIn = optIns[0];

  const respondMutation = useMutation({
    mutationFn: (response) => {
      if (myOptIn) {
        return base44.entities.TherapistWeekOptIn.update(myOptIn.id, { response, responded_at: new Date().toISOString() });
      }
      return base44.entities.TherapistWeekOptIn.create({ student_email: studentEmail, response, round: currentRound, responded_at: new Date().toISOString() });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['therapist-week-optin', studentEmail, currentRound] }),
  });

  if (isLoading) {
    return <div className="bg-card rounded-2xl border border-border p-5 animate-pulse h-40" />;
  }

  // Já aceitou o desafio
  if (myOptIn?.response === 'yes') {
    return (
      <div className="bg-card rounded-2xl border border-pink-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-pink-100 flex items-center justify-center">
            <PartyPopper size={16} className="text-pink-600" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">Você aceitou o desafio! 🎉</h3>
            <p className="text-xs text-muted-foreground">Terapeuta da Semana</p>
          </div>
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed">
          Parabéns por topar essa experiência! Você foi inscrito(a) para atender de forma real, como em um consultório.
          Os terapeutas da semana iniciam seus atendimentos em <strong>28/07</strong>. Fique de olho nos avisos — o encerramento
          das duplas é feito manualmente pelo administrador.
        </p>
      </div>
    );
  }

  // Ainda não respondeu
  if (!myOptIn) {
    return (
      <div className="bg-card rounded-2xl border border-pink-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-pink-100 flex items-center justify-center">
            <Heart size={16} className="text-pink-600" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">Terapeuta da Semana</h3>
            <p className="text-xs text-muted-foreground">Uma experiência real de consultório</p>
          </div>
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed mb-3">
          O "Terapeuta da Semana" é uma experiência prática em que você atende um colega como se estivesse em um consultório de verdade,
          colocando em prática o que está aprendendo. Os terapeutas da semana ingressam nos atendimentos em <strong>28/07</strong>, daqui a duas semanas.
          Somente quem responder <strong>sim</strong> nesta enquete será selecionado para participar.
        </p>
        <p className="text-sm font-semibold text-foreground mb-3">Você gostaria de ser Terapeuta da Semana?</p>
        <div className="flex gap-2">
          <Button size="sm" className="flex-1 gap-1.5" onClick={() => respondMutation.mutate('yes')} disabled={respondMutation.isPending}>
            <Heart size={13} /> Sim, quero participar
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => respondMutation.mutate('no')} disabled={respondMutation.isPending}>
            Não, obrigado(a)
          </Button>
        </div>
      </div>
    );
  }

  // Respondeu "não" — lembrete + opção de reconsiderar
  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
          <Heart size={16} className="text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-foreground">Terapeuta da Semana</h3>
          <p className="text-xs text-muted-foreground">Você optou por não participar</p>
        </div>
      </div>
      <p className="text-sm text-foreground/90 leading-relaxed mb-3">
        Você ainda pode mudar de ideia! Os terapeutas da semana ingressam nos atendimentos em <strong>28/07</strong> e vivenciam uma
        experiência real de atendimento, como em um consultório. Gostaria de reconsiderar e participar dessa experiência?
      </p>
      <div className="flex gap-2">
        <Button size="sm" className="flex-1 gap-1.5" onClick={() => respondMutation.mutate('yes')} disabled={respondMutation.isPending}>
          <Heart size={13} /> Sim, quero participar
        </Button>
        <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => respondMutation.mutate('no')} disabled={respondMutation.isPending}>
          <RotateCcw size={13} /> Continuar não participando
        </Button>
      </div>
    </div>
  );
}