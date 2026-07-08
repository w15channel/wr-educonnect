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

// Encerra o módulo atual do curso: congela o ranking geral num histórico e
// zera a contagem para o novo módulo.
export default function CloseModuleButton({ course, nextModuleNumber = 1 }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [moduleNumber, setModuleNumber] = useState(String(nextModuleNumber));
  const [loading, setLoading] = useState(false);

  const handleClose = async () => {
    const num = Number(moduleNumber);
    if (!Number.isFinite(num) || num <= 0) {
      toast.error('Informe um número de módulo válido.');
      return;
    }
    setLoading(true);
    try {
      const session = getSession();
      const res = await base44.functions.invoke('closeModule', {
        course,
        module_number: num,
        admin_email: session?.email,
      });
      if (!res.data?.success) throw new Error(res.data?.error || 'Falha ao encerrar módulo.');
      // Recalcula com o novo corte aplicado
      await base44.functions.invoke('recalculateScores', {});
      await queryClient.invalidateQueries();
      toast.success(`Módulo ${num} encerrado! ${res.data.students_snapshotted} aluno(s) registrados no histórico e ranking zerado.`);
      setOpen(false);
      setModuleNumber(String(num + 1));
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
        className="text-xs gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
        onClick={() => setOpen(true)}
      >
        <Lock size={13} /> Encerrar Módulo
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => !loading && setOpen(false)}>
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Lock size={18} className="text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground">Encerrar Módulo</h3>
                <p className="text-xs text-muted-foreground truncate">{COURSE_LABELS[course] || course}</p>
              </div>
              <button onClick={() => !loading && setOpen(false)} className="p-2 rounded-xl hover:bg-secondary transition-colors shrink-0">
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2.5">
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  A pontuação geral atual de cada aluno será <strong>congelada no Histórico Acadêmico</strong> deste módulo.
                  Em seguida, o <strong>ranking geral reinicia do zero</strong> para o novo módulo. As atividades já registradas
                  permanecem no histórico individual, mas não contam mais para o novo ranking.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Número do módulo que está sendo encerrado</label>
                <Input
                  type="number"
                  min="1"
                  value={moduleNumber}
                  onChange={(e) => setModuleNumber(e.target.value)}
                  placeholder="Ex: 1"
                  className="h-10"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={loading}>
                  Cancelar
                </Button>
                <Button className="flex-1 bg-amber-600 hover:bg-amber-700" onClick={handleClose} disabled={loading}>
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