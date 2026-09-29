import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, CheckCircle2, Clock3 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

/** Solicitação explícita da prova, feita somente depois de concluir a trilha. */
export default function ModuleUnlockRequestCard({ session, course = 'tcc', module }) {
  const queryClient = useQueryClient();
  const email = session?.email || session?.code || '';
  const moduleNumber = Number(module?.moduleNumber);
  const enabled = !!email && !!moduleNumber && module?.complete && !module?.examDone;
  const { data: requests = [] } = useQuery({
    queryKey: ['exam-request', email, course, moduleNumber],
    queryFn: () => base44.entities.ModuleUnlockRequest.filter({ student_email: email, course, module_number: moduleNumber }, '-created_date', 20),
    enabled: !!email && !!moduleNumber,
  });
  const request = requests.find((item) => item.request_type === 'exam' && item.status !== 'rejected');
  const mutation = useMutation({
    mutationFn: () => base44.entities.ModuleUnlockRequest.create({
      student_email: email,
      student_name: session?.name || session?.full_name || email,
      course,
      module_number: moduleNumber,
      from_module: moduleNumber,
      request_type: 'exam',
      status: 'pending',
      requested_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-request', email, course, moduleNumber] });
      toast.success(`Solicitação da prova do Módulo ${moduleNumber} enviada.`);
    },
    onError: () => toast.error('Não foi possível solicitar a prova. Tente novamente.'),
  });

  if (!moduleNumber || module?.examDone) return null;
  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-500/30 dark:bg-violet-950/20">
      <p className="flex items-center gap-2 text-sm font-bold text-foreground">
        {request?.status === 'approved' ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Clock3 size={16} className="text-violet-600" />}
        Solicitação da prova
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        {!module?.complete
          ? 'Conclua a trilha deste módulo para poder solicitar a prova.'
          : request?.status === 'approved'
            ? 'Sua prova foi liberada. Acesse a área de Provas para realizá-la.'
            : request
              ? 'Solicitação enviada. Você será avisado assim que a equipe liberar a prova.'
              : 'Sua trilha está completa. Solicite a prova para concluir este módulo e avançar ao próximo.'}
      </p>
      {!request && (
        <Button type="button" size="sm" className="mt-3 gap-2 font-bold" disabled={!enabled || mutation.isPending} onClick={() => mutation.mutate()}>
          <Send size={14} /> {mutation.isPending ? 'Enviando...' : `Solicitar prova do Módulo ${moduleNumber}`}
        </Button>
      )}
    </div>
  );
}
