import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { KeyRound, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Painel admin: pedidos de liberação de módulo enviados pelos alunos.
 * Aprovar grava a liberação — dali em diante o aluno é pontuado no novo módulo.
 */
export default function ModuleUnlockPanel({ course = 'tcc', adminEmail = '' }) {
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['module-unlock-requests-admin', course],
    queryFn: () => base44.entities.ModuleUnlockRequest.filter({ course, status: 'pending' }, '-created_date', 200),
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ request, approve }) => {
      if (approve) {
        await base44.entities.StudentModuleUnlock.create({
          student_email: request.student_email,
          student_name: request.student_name || request.student_email,
          course: request.course || course,
          module_number: Number(request.module_number),
          unlocked_at: new Date().toISOString(),
          unlocked_by: adminEmail,
        });
      }
      await base44.entities.ModuleUnlockRequest.update(request.id, {
        status: approve ? 'approved' : 'rejected',
        resolved_at: new Date().toISOString(),
        resolved_by: adminEmail,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['module-unlock-requests-admin', course] });
      queryClient.invalidateQueries({ queryKey: ['ranking-module-unlocks'] });
      toast.success(variables.approve ? 'Módulo liberado para o aluno!' : 'Pedido recusado.');
    },
    onError: () => toast.error('Não foi possível concluir a ação.'),
  });

  return (
    <div className="mb-5 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <KeyRound size={16} className="text-primary" />
        <p className="text-sm font-bold text-foreground">Liberação de módulos</p>
        {requests.length > 0 && (
          <span className="ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
            {requests.length} pedido(s)
          </span>
        )}
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Todo aluno começa no Módulo 1. Ao liberar, a pontuação seguinte dele passa a contar no novo módulo.
      </p>

      {isLoading ? (
        <div className="mt-3 h-14 animate-pulse rounded-xl bg-muted" />
      ) : requests.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">Nenhum pedido de liberação pendente.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {requests.map((request) => (
            <div key={request.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-foreground">{request.student_name || request.student_email}</p>
                <p className="text-[11px] text-muted-foreground">
                  Concluiu o Módulo {request.from_module || Number(request.module_number) - 1} · pede o Módulo {request.module_number}
                </p>
              </div>
              <Button
                size="sm"
                className="h-8 gap-1 text-xs"
                disabled={resolveMutation.isPending}
                onClick={() => resolveMutation.mutate({ request, approve: true })}
              >
                <Check size={13} /> Liberar Módulo {request.module_number}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1 text-xs"
                disabled={resolveMutation.isPending}
                onClick={() => resolveMutation.mutate({ request, approve: false })}
              >
                <X size={13} /> Recusar
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}