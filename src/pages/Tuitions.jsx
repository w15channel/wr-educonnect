import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';
import { DollarSign, Plus, CheckCircle, XCircle, AlertCircle, Trash2, CreditCard, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  paid: { label: 'Pago', icon: CheckCircle, card: 'border-green-200 bg-green-50', badge: 'text-green-700 bg-green-100 border-green-200' },
  pending: { label: 'Pendente', icon: AlertCircle, card: 'border-yellow-200 bg-yellow-50', badge: 'text-yellow-700 bg-yellow-100 border-yellow-200' },
  overdue: { label: 'Inadimplente', icon: XCircle, card: 'border-red-200 bg-red-50', badge: 'text-red-700 bg-red-100 border-red-200' },
};

export default function Tuitions() {
  const { user: session } = useOutletContext();
  const isAdmin = session?.role === 'admin';
  const queryClient = useQueryClient();
  const { emails: courseEmails, codePrefix } = useCourseFilteredEmails();
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [form, setForm] = useState({ student_email: '', student_name: '', month_ref: '', amount: '', due_date: '', status: 'pending', notes: '' });
  const [bulk, setBulk] = useState({ month_ref: '', amount: '', due_date: '', status: 'pending', notes: '', mode: 'all', selectedEmails: [] });
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [bulkLoading, setBulkLoading] = useState(false);

  const { data: tuitions = [], isLoading } = useQuery({
    queryKey: ['tuitions'],
    queryFn: () => isAdmin
      ? base44.entities.Tuition.list('-month_ref', 500)
      : base44.entities.Tuition.filter({ student_email: session?.email }, '-month_ref', 50),
    enabled: !!session,
  });

  const { data: codes = [] } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 500),
    enabled: isAdmin,
  });

  // Todos os alunos ativos da turma atual: /sex/ exibe apenas códigos SEX-
  const allStudents = codes
    .filter(c => c.is_active !== false)
    .filter(c => codePrefix ? (c.code || '').startsWith(codePrefix) : true)
    .filter(c => courseEmails ? courseEmails.has(c.student_email || '') || !c.student_email : true)
    .map(c => ({
      key: c.student_email || c.code,
      email: c.student_email || '',
      name: c.profile_name || c.student_name || c.code || 'Sem nome',
    }))
    .filter((s, i, arr) => arr.findIndex(x => x.key === s.key) === i); // dedup

  const allowedStudentKeys = new Set(allStudents.flatMap(s => [s.key, s.email]).filter(Boolean));
  const visibleTuitions = isAdmin ? tuitions.filter(t => allowedStudentKeys.has(t.student_email)) : tuitions;

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Tuition.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tuitions'] });
      setShowForm(false);
      setForm({ student_email: '', student_name: '', month_ref: '', amount: '', due_date: '', status: 'pending', notes: '' });
      toast.success('Mensalidade lançada!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Tuition.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tuitions'] }); toast.success('Status atualizado!'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Tuition.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tuitions'] }),
  });

  const handleBulkLaunch = async () => {
    if (!bulk.month_ref) { toast.error('Informe o mês de referência'); return; }
    setBulkLoading(true);
    let targets = allStudents;
    if (bulk.mode === 'selected') targets = targets.filter(s => bulk.selectedEmails.includes(s.key));
    for (const s of targets) {
      const alreadyExists = tuitions.find(t => (t.student_email === s.key || t.student_email === s.email) && t.month_ref === bulk.month_ref);
      if (!alreadyExists) {
        await base44.entities.Tuition.create({
          student_email: s.key,
          student_name: s.name,
          month_ref: bulk.month_ref,
          amount: Number(bulk.amount) || 0,
          due_date: bulk.due_date,
          status: bulk.status,
          notes: bulk.notes,
        });
      }
    }
    queryClient.invalidateQueries({ queryKey: ['tuitions'] });
    setBulkLoading(false);
    setShowBulk(false);
    setBulk({ month_ref: '', amount: '', due_date: '', status: 'pending', notes: '', mode: 'all', selectedEmails: [] });
    toast.success(`Mensalidades lançadas para ${targets.length} aluno(s)!`);
  };

  const toggleBulkEmail = (key) => {
    setBulk(prev => ({
      ...prev,
      selectedEmails: prev.selectedEmails.includes(key)
        ? prev.selectedEmails.filter(e => e !== key)
        : [...prev.selectedEmails, key],
    }));
  };

  const filtered = selectedStudent === 'all' ? visibleTuitions : visibleTuitions.filter(t => t.student_email === selectedStudent);

  const overallStatus = !isAdmin && tuitions.length > 0
    ? (tuitions.some(t => t.status === 'overdue') ? 'overdue' : tuitions.some(t => t.status === 'pending') ? 'pending' : 'paid')
    : null;

  return (
    <div className="app-page app-page--narrow space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground">Mensalidades</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{isAdmin ? 'Gerencie pagamentos dos alunos' : 'Histórico de mensalidades'}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" className="gap-2 h-9 text-sm" onClick={() => setShowBulk(v => !v)}>
              <Users size={15} /> Lançamento em Massa
              {showBulk ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </Button>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="gap-2 h-9 text-sm"><Plus size={15} /> Lançar Individual</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Mensalidade</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <Select value={form.student_email} onValueChange={v => {
                  const code = codes.find(c => c.student_email === v);
                  setForm({...form, student_email: v, student_name: code?.profile_name || code?.student_name || ''});
                }}>
                  <SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
                  <SelectContent>
                    {allStudents.map(s => (
                      <SelectItem key={s.key} value={s.key}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Mês de referência (ex: Janeiro/2025)" value={form.month_ref} onChange={e => setForm({...form, month_ref: e.target.value})} />
                <Input type="number" placeholder="Valor (R$)" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                <Input type="date" placeholder="Vencimento" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} />
                <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="overdue">Inadimplente</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Observações (opcional)" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                <Button onClick={() => createMutation.mutate({...form, amount: Number(form.amount)})} disabled={!form.student_email || !form.month_ref} className="w-full">
                  Lançar Mensalidade
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        )}
      </div>

      {/* Bulk launch panel */}
      {isAdmin && showBulk && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} className="text-primary" />
            <h3 className="font-bold text-foreground text-sm">Lançamento em Massa</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input placeholder="Mês de referência (ex: Maio/2025)" value={bulk.month_ref} onChange={e => setBulk({...bulk, month_ref: e.target.value})} />
            <Input type="number" placeholder="Valor (R$)" value={bulk.amount} onChange={e => setBulk({...bulk, amount: e.target.value})} />
            <Input type="date" placeholder="Vencimento" value={bulk.due_date} onChange={e => setBulk({...bulk, due_date: e.target.value})} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select value={bulk.status} onValueChange={v => setBulk({...bulk, status: v})}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="overdue">Inadimplente</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Observações (opcional)" value={bulk.notes} onChange={e => setBulk({...bulk, notes: e.target.value})} />
          </div>
          {/* Mode selector */}
          <div className="flex gap-2 flex-wrap">
            {[{ v: 'all', label: 'Todos os alunos' }, { v: 'selected', label: 'Alunos selecionados' }].map(opt => (
              <button
                key={opt.v}
                onClick={() => setBulk(b => ({ ...b, mode: opt.v, selectedEmails: [] }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${bulk.mode === opt.v ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary/30'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {bulk.mode === 'selected' && (
            <div className="space-y-1.5 max-h-44 overflow-y-auto border border-border rounded-xl p-2">
              {allStudents.map(s => {
                const checked = bulk.selectedEmails.includes(s.key);
                return (
                  <label key={s.key} className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-secondary/50 cursor-pointer">
                    <input type="checkbox" checked={checked} onChange={() => toggleBulkEmail(s.key)} className="accent-primary w-4 h-4" />
                    <span className="text-sm font-medium text-foreground">{s.name}</span>
                    {s.email && <span className="text-xs text-muted-foreground">{s.email}</span>}
                  </label>
                );
              })}
            </div>
          )}
          <Button
            onClick={handleBulkLaunch}
            disabled={bulkLoading || !bulk.month_ref || (bulk.mode === 'selected' && bulk.selectedEmails.length === 0)}
            className="w-full gap-2"
          >
            {bulkLoading ? 'Lançando...' : `🚀 Lançar para ${bulk.mode === 'all' ? `${allStudents.length} alunos` : `${bulk.selectedEmails.length} selecionados`}`}
          </Button>
          <p className="text-xs text-muted-foreground text-center">Alunos que já possuem mensalidade para este mês serão ignorados automaticamente.</p>
        </div>
      )}

      {/* Student status banner */}
      {!isAdmin && overallStatus && (
        <div className={`flex items-center gap-4 p-5 rounded-2xl border ${STATUS_CONFIG[overallStatus].card}`}>
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
            <CreditCard size={22} className={overallStatus === 'paid' ? 'text-green-600' : overallStatus === 'overdue' ? 'text-red-600' : 'text-yellow-600'} />
          </div>
          <div>
            <p className="font-bold text-foreground">Situação Financeira</p>
            <p className={`text-sm font-semibold ${overallStatus === 'paid' ? 'text-green-700' : overallStatus === 'overdue' ? 'text-red-700' : 'text-yellow-700'}`}>
              {overallStatus === 'paid' ? '✅ Em dia — Parabéns!' : overallStatus === 'overdue' ? '❌ Inadimplente — Mensalidades em atraso' : '⚠️ Mensalidades pendentes'}
            </p>
          </div>
        </div>
      )}

      {/* Admin filter */}
      {isAdmin && (
        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger className="w-full sm:w-64 h-9 text-sm"><SelectValue placeholder="Filtrar por aluno" /></SelectTrigger>
          <SelectContent>
          <SelectItem value="all">Todos os alunos</SelectItem>
          {allStudents.map(s => (
            <SelectItem key={s.key} value={s.key}>{s.name}</SelectItem>
          ))}
          </SelectContent>
        </Select>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <DollarSign size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold">Nenhuma mensalidade encontrada</p>
          {isAdmin && <p className="text-sm mt-1">Clique em "Lançar" para adicionar uma mensalidade</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => {
            const cfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            return (
              <div key={t.id} className={`bg-card rounded-2xl border p-4 flex items-center gap-3 flex-wrap ${t.status === 'overdue' ? 'border-red-200' : t.status === 'paid' ? 'border-green-200' : 'border-border'}`}>
                <div className="flex-1 min-w-0">
                  {isAdmin && <p className="font-bold text-sm text-foreground">{t.student_name || t.student_email}</p>}
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <span className="text-sm font-semibold text-foreground">{t.month_ref}</span>
                    {t.amount ? <span className="text-sm font-bold text-foreground">R$ {Number(t.amount).toFixed(2)}</span> : null}
                    {t.due_date && <span className="text-xs text-muted-foreground">Vence: {format(new Date(t.due_date + 'T12:00:00'), 'dd/MM/yyyy')}</span>}
                  </div>
                  {t.notes && <p className="text-xs text-muted-foreground mt-1">{t.notes}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isAdmin ? (
                    <Select value={t.status} onValueChange={v => updateMutation.mutate({ id: t.id, data: { status: v, paid_date: v === 'paid' ? new Date().toISOString().split('T')[0] : t.paid_date } })}>
                      <SelectTrigger className={`w-36 h-8 text-xs border rounded-xl ${cfg.badge}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="overdue">Inadimplente</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${cfg.badge}`}>
                      <StatusIcon size={12} /> {cfg.label}
                    </span>
                  )}
                  {isAdmin && (
                    <button onClick={() => deleteMutation.mutate(t.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1.5">
                      <Trash2 size={14} />
                    </button>
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