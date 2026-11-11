import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gem, Check, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ParticipationCelebration from '@/components/shared/ParticipationCelebration';
import TuitionPlanForm from '@/components/tuitions/TuitionPlanForm';
import useTuitionPlan from '@/hooks/useTuitionPlan';
import { formatCurrency, formatShortDate, todayIso } from '@/lib/tuitionPlanDates';

/**
 * Contribuição mensal do aluno na saudação.
 * Primeiro pede valor + dia do vencimento (só uma vez) e depois mostra a
 * mensalidade do período com o botão de confirmar o pagamento.
 */
export default function TuitionPlanCard({ session, mode = 'greeting' }) {
  const navigate = useNavigate();
  const { loading, plan, openTuition, savePlan, confirmPayment } = useTuitionPlan(session);
  const [paying, setPaying] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState('');
  const [celebration, setCelebration] = useState(null);

  if (session?.role === 'admin' || !session?.email || loading) return null;

  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const tuitionsPath = path.startsWith('/degree/student')
    ? '/degree/student/tuitions'
    : `${path.startsWith('/adm') ? '/adm' : '/student'}/tuitions`;

  const errorText = (error) => error?.response?.data?.error || error?.message || 'Não foi possível concluir agora.';

  const handleSavePlan = (amount, dueDay) => {
    savePlan.mutate({ amount, dueDay }, {
      onSuccess: () => toast.success('Mensalidade combinada! Já lançamos o vencimento escolhido.'),
      onError: (error) => toast.error(errorText(error)),
    });
  };

  const openPayment = () => {
    setPayAmount(String(plan?.amount ?? ''));
    setPayDate(todayIso());
    setPaying(true);
  };

  const submitPayment = (event) => {
    event.preventDefault();
    const amount = Number(String(payAmount).replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Informe o valor que você contribuiu.');
      return;
    }
    confirmPayment.mutate({ amount, paidDate: payDate }, {
      onSuccess: (response) => {
        setPaying(false);
        const data = response?.data || {};
        if (data.diamond) {
          setCelebration({ message: 'Você conquistou o Diamante da Contribuição! 💎', achievement: data.achievement });
        } else {
          toast.success('Contribuição confirmada! Obrigado por fortalecer a comunidade.');
        }
      },
      onError: (error) => toast.error(errorText(error)),
    });
  };

  return (
    <>
      {celebration && (
        <ParticipationCelebration
          session={session}
          achievement={celebration.achievement}
          message={celebration.message}
          onClose={() => setCelebration(null)}
        />
      )}

      <section className="rounded-2xl border border-cyan-200/60 bg-gradient-to-br from-cyan-500/10 via-sky-500/5 to-amber-500/10 p-4 sm:p-5" aria-label="Contribuição mensal">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-500 shadow-lg shadow-cyan-500/20">
            <Gem size={18} className="text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1 space-y-2.5">
            <div>
              <p className="text-sm font-bold text-foreground">
                {plan ? 'Sua contribuição mensal' : 'Vamos combinar sua contribuição? 💎'}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {plan
                  ? `Valor de ${formatCurrency(plan.amount)} com vencimento todo dia ${plan.dueDay}.`
                  : 'Escolha o valor da sua contribuição e o dia do vencimento. A partir daí a mensalidade de cada mês é lançada nessa data.'}
              </p>
            </div>

            {!plan && (
              <TuitionPlanForm
                onSubmit={handleSavePlan}
                saving={savePlan.isPending}
                submitLabel="Salvar meu vencimento"
              />
            )}

            {plan && openTuition && !paying && (
              <div className="rounded-xl border border-border/70 bg-background/70 px-3 py-2.5">
                <p className="text-[11px] font-bold text-foreground">
                  Mensalidade de {openTuition.month_ref}
                  {openTuition.due_date ? ` • vence ${formatShortDate(openTuition.due_date)}` : ''}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {openTuition.status === 'overdue'
                    ? 'Está em atraso — confirme sua contribuição para ficar em dia.'
                    : 'Já contribuiu este mês? Confirme abaixo e receba seu diamante.'}
                </p>
                <Button size="sm" onClick={openPayment} className="mt-2 w-full gap-2 bg-cyan-600 hover:bg-cyan-700 sm:w-auto">
                  <Gem size={13} aria-hidden="true" /> Confirmar pagamento
                </Button>
              </div>
            )}

            {plan && !openTuition && !paying && (
              <p className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                <Check size={13} aria-hidden="true" /> Tudo em dia — obrigado por contribuir! 💎
              </p>
            )}

            {paying && (
              <form onSubmit={submitPayment} className="space-y-2 rounded-xl border border-border/70 bg-background/70 p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="tuition-paid-amount" className="text-[11px] font-bold text-foreground">Valor pago (R$)</Label>
                    <Input id="tuition-paid-amount" inputMode="decimal" value={payAmount} onChange={(event) => setPayAmount(event.target.value)} className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="tuition-paid-date" className="text-[11px] font-bold text-foreground">Data do pagamento</Label>
                    <Input id="tuition-paid-date" type="date" value={payDate} onChange={(event) => setPayDate(event.target.value)} className="h-9" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={confirmPayment.isPending} className="flex-1 gap-2 bg-cyan-600 hover:bg-cyan-700">
                    {confirmPayment.isPending ? 'Enviando...' : 'Enviar contribuição'}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setPaying(false)}>Cancelar</Button>
                </div>
              </form>
            )}

            {plan && mode === 'greeting' && (
              <button
                type="button"
                onClick={() => navigate(tuitionsPath)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-700 hover:underline dark:text-cyan-300"
              >
                <Settings2 size={12} aria-hidden="true" /> Alterar em Mensalidades
              </button>
            )}

            {plan && mode === 'settings' && (
              <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                <p className="mb-2 text-[11px] font-bold text-foreground">Ajustar valor e vencimento</p>
                <TuitionPlanForm
                  initialAmount={plan.amount}
                  initialDay={plan.dueDay}
                  onSubmit={handleSavePlan}
                  saving={savePlan.isPending}
                  submitLabel="Salvar alterações"
                  hint="O novo valor e o novo dia valem a partir da mensalidade em aberto."
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}