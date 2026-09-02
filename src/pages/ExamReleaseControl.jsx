import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { ClipboardCheck, Search, Unlock, Lock, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import useAdminModuleProgress from '@/hooks/useAdminModuleProgress';
import { EXAM_RELEASE_MIN_PERCENT, examReleaseBlockReason } from '@/lib/examChecklistRules';

/**
 * Liberação de Provas (admin)
 * ───────────────────────────
 * Mostra, para cada aluno do curso, quanto do checklist do módulo em vigência
 * já foi cumprido e quantas atividades ainda faltam. A liberação das provas só
 * fica disponível quando o mínimo exigido é atingido — e o servidor recalcula
 * o progresso antes de gravar a liberação.
 */
export default function ExamReleaseControl() {
  const { user: session } = useOutletContext() || {};
  const queryClient = useQueryClient();
  const course = session?.course || 'tcc';
  const isAdmin = session?.role === 'admin';
  const [search, setSearch] = useState('');
  const [onlyEligible, setOnlyEligible] = useState(false);

  const { rows, isLoading, hasCourseData } = useAdminModuleProgress({ course });

  const releaseMutation = useMutation({
    mutationFn: async ({ row, action }) => {
      const response = await base44.functions.invoke('releaseModuleExams', {
        admin_email: session?.email,
        student_email: row.email,
        student_name: row.name,
        module_number: row.moduleNumber,
        course,
        action,
      });
      const data = response?.data || response;
      if (data?.error || data?.success === false) throw new Error(data?.error || 'Falha ao atualizar a liberação.');
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exam-releases', course] });
      toast.success(variables.action === 'release'
        ? `Provas do Módulo ${variables.row.moduleNumber} liberadas para ${variables.row.name}.`
        : `Liberação das provas de ${variables.row.name} revogada.`);
    },
    onError: (error) => toast.error(error?.response?.data?.error || error?.message || 'Não foi possível concluir a ação.'),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows
      .filter((row) => !onlyEligible || row.summary.eligible)
      .filter((row) => !term || row.name.toLowerCase().includes(term) || row.email.includes(term))
      .sort((a, b) => b.summary.percent - a.summary.percent || a.name.localeCompare(b.name));
  }, [rows, search, onlyEligible]);

  const eligibleCount = rows.filter((row) => row.summary.eligible).length;

  if (!isAdmin) {
    return (
      <div className="app-page max-w-3xl mx-auto">
        <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          <AlertCircle size={16} /> Esta ferramenta é exclusiva da administração.
        </div>
      </div>
    );
  }

  return (
    <div className="app-page max-w-5xl mx-auto animate-fade-in-up space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shrink-0">
          <ClipboardCheck size={22} className="text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl lg:text-2xl font-bold text-foreground">Liberação de Provas</h2>
          <p className="text-sm text-muted-foreground">
            Percentual do checklist de cada aluno no módulo em vigência — libere as provas de quem já cumpriu o exigido.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar aluno por nome ou e-mail"
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant={onlyEligible ? 'default' : 'outline'}
          size="sm"
          className="h-10 gap-1.5 text-xs font-bold"
          onClick={() => setOnlyEligible((value) => !value)}
        >
          <CheckCircle2 size={14} /> Somente aptos ({eligibleCount})
        </Button>
      </div>

      {!isLoading && !hasCourseData && (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
          <AlertCircle size={16} /> Nenhuma aula ou tarefa cadastrada neste curso — o checklist não pode ser calculado.
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Nenhum aluno encontrado para os filtros atuais.
        </p>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((row) => {
            const { summary } = row;
            const blockReason = examReleaseBlockReason(summary);
            return (
              <div key={row.email} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">{row.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{row.email}</p>
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground">
                    Módulo {row.moduleNumber}
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                    summary.eligible ? 'border-green-200 bg-green-50 text-green-700' : 'border-amber-200 bg-amber-50 text-amber-800'
                  }`}>
                    {summary.eligible ? <Unlock size={11} /> : <Lock size={11} />}
                    {summary.eligible ? `Apto (${EXAM_RELEASE_MIN_PERCENT}% exigido)` : 'Não atingiu o mínimo'}
                  </span>
                  {row.released && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-[11px] font-bold text-violet-700">
                      <CheckCircle2 size={11} /> Provas liberadas
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2.5">
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full ${summary.eligible ? 'bg-green-500' : 'bg-amber-500'}`}
                      style={{ width: `${summary.percent}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-xs font-black text-foreground">{summary.percent}%</span>
                </div>

                <p className="mt-2 text-[11px] text-muted-foreground">
                  {summary.completed} de {summary.total} atividades cumpridas · faltam {summary.missing}
                  {summary.missingItems.length > 0 && (
                    <span> · Pendências: {summary.missingItems.map((item) => item.label).join(', ')}</span>
                  )}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    className="h-8 gap-1.5 text-xs font-bold"
                    disabled={!!blockReason || row.released || releaseMutation.isPending}
                    title={blockReason || ''}
                    onClick={() => releaseMutation.mutate({ row, action: 'release' })}
                  >
                    <Unlock size={13} /> Liberar provas do Módulo {row.moduleNumber}
                  </Button>
                  {row.released && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 text-xs font-bold"
                      disabled={releaseMutation.isPending}
                      onClick={() => releaseMutation.mutate({ row, action: 'revoke' })}
                    >
                      <RotateCcw size={13} /> Revogar liberação
                    </Button>
                  )}
                  {blockReason && !row.released && (
                    <span className="text-[11px] font-semibold text-amber-700">{blockReason}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
