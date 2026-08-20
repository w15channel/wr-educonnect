import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getSession } from '@/lib/customAuth';
import { Lock, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const COURSE_LABELS = {
  tcc: 'Terapia Cognitivo-Comportamental',
  psicanalise: 'Psicanalista Freudiano',
  sexologia: 'Sexólogo(a)',
};

// Encerra o período atual do curso: congela o ranking geral num histórico
// (com uma janela de datas customizável) e zera a contagem para o novo período.
export default function ClosePeriodButton({ course, nextModuleNumber = 1 }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [periodLabel, setPeriodLabel] = useState(`Período ${nextModuleNumber}`);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = async () => {
    if (!periodLabel.trim()) {
      toast.error('Informe um nome para o período.');
      return;
    }
    if (!periodStart || !periodEnd) {
      toast.error('Informe a data de início e término do período.');
      return;
    }
    if (periodEnd < periodStart) {
      toast.error('A data final não pode ser anterior à data inicial.');
      return;
    }
    setLoading(true);
    try {
      const session = getSession();
      // Recalcula ANTES de fechar, para que qualquer ScoreItem retroativo criado
      // agora fique com created_date anterior ao corte (evita vazamento para o novo período)
      await base44.functions.invoke('recalculateScores', {});
      const res = await base44.functions.invoke('closeModule', {
        course,
        module_number: nextModuleNumber,
        period_label: periodLabel.trim(),
        period_start: periodStart,
        period_end: periodEnd,
        admin_email: session?.email,
      });
      if (!res.data?.success) throw new Error(res.data?.error || 'Falha ao encerrar período.');
      await queryClient.invalidateQueries();
      toast.success(`${periodLabel} encerrado! ${res.data.students_snapshotted} aluno(s) registrados no histórico e ranking zerado.`);
      setOpen(false);
      setPeriodLabel(`Período ${nextModuleNumber + 1}`);
      setPeriodStart('');
      setPeriodEnd('');
    } catch (e) {
      toast.error('Erro: ' + (e?.message || 'tente novamente'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="text-xs gap-1.5 border-primary text-primary hover:bg-accent"
        onClick={() => setOpen(true)}
      >
        <Lock size={13} /> Encerrar Período
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4" onClick={() => !loading && setOpen(false)}>
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                <Lock size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground">Encerrar Período</h3>
                <p className="text-xs text-muted-foreground truncate">{COURSE_LABELS[course] || course}</p>
              </div>
              <button onClick={() => !loading && setOpen(false)} className="p-2 rounded-xl hover:bg-secondary transition-colors shrink-0">
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-accent border border-primary rounded-xl p-3 flex gap-2.5">
                <AlertTriangle size={16} className="text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-primary leading-relaxed">
                  A pontuação geral atual de cada aluno será <strong>congelada no Ranking por Período</strong>.
                  Em seguida, o <strong>ranking atual reinicia do zero</strong> para o novo período. As atividades já registradas
                  permanecem no histórico individual, mas não contam mais para o novo ranking.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Nome do período</label>
                <Input
                  value={periodLabel}
                  onChange={(e) => setPeriodLabel(e.target.value)}
                  placeholder="Ex: Período 1 — Jan/Fev 2026"
                  className="h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Início do período</label>
                  <Input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Fim do período</label>
                  <Input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={loading}>
                  Cancelar
                </Button>
                <Button className="flex-1 bg-primary hover:bg-primary" onClick={handleClose} disabled={loading}>
                  {loading ? 'Encerrando...' : 'Confirmar Encerramento'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}