import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { KeyRound, Hourglass, CheckCircle2, Sparkles } from 'lucide-react';
import { resolveCurrentStudentModule } from '@/lib/moduleAttribution';

/**
 * Pedido de liberação do módulo seguinte. Aparece para o aluno depois que ele
 * cumpre o checklist e entrega a prova do módulo em que está sendo pontuado.
 */
export default function ModuleUnlockRequestCard({ session, course = 'tcc', module }) {
  const email = session?.email || session?.code || '';
  const queryClient = useQueryClient();

  const { data: unlocks = [] } = useQuery({
    queryKey: ['module-unlocks', email],
    queryFn: () => base44.entities.StudentModuleUnlock.filter({ student_email: email }, '-unlocked_at', 50),
    enabled: !!email,
  });
  const { data: requests = [] } = useQuery({
    queryKey: ['module-unlock-requests', email],
    queryFn: () => base44.entities.ModuleUnlockRequest.filter({ student_email: email }, '-created_date', 50),
    enabled: !!email,
  });

  const scoringModule = resolveCurrentStudentModule(unlocks);
  const nextModule = scoringModule + 1;
  const pending = requests.find((r) => r.status === 'pending' && Number(r.module_number) === nextModule);
  const eligible = !!module && module.moduleNumber === scoringModule && module.complete && module.examDone;

  const requestMutation = useMutation({
    mutationFn: () => base44.entities.ModuleUnlockRequest.create({
      student_email: email,
      student_name: session?.name || session?.profile_name || email,
      course,
      module_number: nextModule,
      from_module: scoringModule,
      status: 'pending',
      requested_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-unlock-requests', email] });
      toast.success('Pedido enviado! A coordenação vai liberar o próximo módulo.');
    },
    onError: () => toast.error('Não foi possível enviar o pedido agora.'),
  });

  if (!email) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Sparkles size={15} className="text-primary" />
        <p className="text-sm font-bold text-foreground">Você está sendo pontuado no Módulo {scoringModule}</p>
      </div>

      {pending ? (
        <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-amber-700">
          <Hourglass size={13} /> Pedido de liberação do Módulo {nextModule} enviado — aguardando a coordenação.
        </p>
      ) : nextModule > 10 ? (
        <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-green-700">
          <CheckCircle2 size={13} /> Você já está no último módulo do curso.
        </p>
      ) : eligible ? (
        <button
          type="button"
          onClick={() => requestMutation.mutate()}
          disabled={requestMutation.isPending}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          <KeyRound size={15} />
          {requestMutation.isPending ? 'Enviando pedido...' : `Pedir liberação do Módulo ${nextModule}`}
        </button>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Conclua o checklist e entregue a prova do Módulo {scoringModule} para pedir a liberação do Módulo {nextModule}.
        </p>
      )}
    </div>
  );
}