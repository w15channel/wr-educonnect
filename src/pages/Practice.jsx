import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, CheckCircle2, Clock3, HandHeart, Plus, Sparkles, Star, Trash2, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { adminApi } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const EMPTY = { date: new Date().toISOString().slice(0, 10), theme: '', objective: '', practices: '', facilitator: '', duration_minutes: 60, admin_notes: '', participant_emails: [] };
const emailOf = value => String(value || '').trim().toLowerCase();

export default function Practice() {
  const { user } = useOutletContext();
  const isAdmin = user?.role === 'admin';
  const course = user?.course || 'tcc';
  const email = emailOf(user?.email || user?.code);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [reflectionFor, setReflectionFor] = useState(null);
  const [reflection, setReflection] = useState({ experience: '', insights: '', application: '', rating: 5 });

  const { data: mentorships = [], isLoading } = useQuery({ queryKey: ['mentorships'], queryFn: () => base44.entities.Mentorship.list('-date', 300) });
  const { data: reflections = [] } = useQuery({ queryKey: ['mentorship-reflections'], queryFn: () => base44.entities.MentorshipReflection.list('-created_date', 500) });
  const { data: codes = [] } = useQuery({ queryKey: ['practice-students'], queryFn: () => base44.entities.AccessCode.list('student_name', 500), enabled: isAdmin });
  const students = useMemo(() => codes.filter(c => c.student_email && (c.course === course || (course === 'tcc' && !c.course))), [codes, course]);
  const visible = mentorships.filter(m => (m.course || 'tcc') === course && (isAdmin || (m.participant_emails || []).map(emailOf).includes(email)));

  const create = useMutation({
    mutationFn: async data => {
      const selected = students.filter(s => data.participant_emails.includes(s.student_email));
      const payload = { ...data, duration_minutes: Number(data.duration_minutes), course, status: 'realizada', participant_names: selected.map(s => s.profile_name || s.student_name || s.student_email) };
      const response = await adminApi.create('Mentorship', payload);
      const mentorship = response.record || response;
      await Promise.all(selected.map(student => adminApi.create('ScoreItem', {
        student_email: student.student_email, category: 'mentorship', ref_id: mentorship.id,
        ref_title: `Mentoria: ${data.theme}`, score: 10, max_score: 10, verified: true,
        notes: `Atividade complementar realizada em ${data.date}`,
      })));
      return mentorship;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['mentorships'] }); queryClient.invalidateQueries({ queryKey: ['score-items-all'] }); setOpen(false); setForm(EMPTY); toast.success('Mentoria registrada e 10,0 pontos creditados aos participantes.'); },
    onError: error => toast.error(error.message || 'Não foi possível registrar a mentoria.'),
  });

  const remove = useMutation({
    mutationFn: async mentorship => {
      const scores = await adminApi.list('ScoreItem', { filter: { ref_id: mentorship.id, category: 'mentorship' }, limit: 500 });
      const related = reflections.filter(r => r.mentorship_id === mentorship.id);
      await Promise.all([...scores.map(s => adminApi.delete('ScoreItem', s.id)), ...related.map(r => adminApi.delete('MentorshipReflection', r.id))]);
      await adminApi.delete('Mentorship', mentorship.id);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['mentorships'] }); queryClient.invalidateQueries({ queryKey: ['mentorship-reflections'] }); toast.success('Mentoria e pontuações removidas.'); },
  });

  const saveReflection = useMutation({
    mutationFn: async data => {
      const existing = reflections.find(r => r.mentorship_id === reflectionFor.id && emailOf(r.student_email) === email);
      const payload = { ...data, mentorship_id: reflectionFor.id, student_email: email, student_name: user?.full_name || user?.name || '', is_private: true };
      return existing ? base44.entities.MentorshipReflection.update(existing.id, payload) : base44.entities.MentorshipReflection.create(payload);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['mentorship-reflections'] }); setReflectionFor(null); toast.success('Sua reflexão foi salva com privacidade.'); },
    onError: error => toast.error(error.message || 'Não foi possível salvar sua reflexão.'),
  });

  const toggleStudent = studentEmail => setForm(current => ({ ...current, participant_emails: current.participant_emails.includes(studentEmail) ? current.participant_emails.filter(e => e !== studentEmail) : [...current.participant_emails, studentEmail] }));
  const openReflection = mentorship => {
    const saved = reflections.find(r => r.mentorship_id === mentorship.id && emailOf(r.student_email) === email);
    setReflection(saved ? { experience: saved.experience || '', insights: saved.insights || '', application: saved.application || '', rating: saved.rating || 5 } : { experience: '', insights: '', application: '', rating: 5 });
    setReflectionFor(mentorship);
  };

  return <div className="app-page app-page--narrow animate-fade-in-up space-y-6">
    <section className="rounded-3xl border border-rose-400/20 bg-gradient-to-br from-rose-500/10 via-background to-violet-500/10 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex gap-4"><div className="rounded-2xl bg-rose-500/15 p-3"><HandHeart className="text-rose-400" size={28} /></div><div><h1 className="text-2xl font-bold">Mentorias</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Memória formativa das vivências terapêuticas, aprendizados e impressões de cada encontro.</p><div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-500">10,0 pontos por participação</span><span className="rounded-full bg-violet-500/10 px-3 py-1 text-violet-500">Atividade complementar</span></div></div></div>
      {isAdmin && <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button className="gap-2"><Plus size={16}/> Registrar mentoria</Button></DialogTrigger><DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Registrar mentoria realizada</DialogTitle></DialogHeader><div className="grid gap-4 sm:grid-cols-2">
        <div><Label>Data *</Label><Input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div><div><Label>Duração (minutos)</Label><Input type="number" min="1" value={form.duration_minutes} onChange={e=>setForm({...form,duration_minutes:e.target.value})}/></div>
        <div className="sm:col-span-2"><Label>Tema da abordagem *</Label><Input placeholder="Ex.: Escuta ativa e vínculo terapêutico" value={form.theme} onChange={e=>setForm({...form,theme:e.target.value})}/></div>
        <div><Label>Mentor(a) / facilitador(a)</Label><Input value={form.facilitator} onChange={e=>setForm({...form,facilitator:e.target.value})}/></div><div><Label>Objetivo do encontro</Label><Input value={form.objective} onChange={e=>setForm({...form,objective:e.target.value})}/></div>
        <div className="sm:col-span-2"><Label>Práticas e técnicas utilizadas</Label><Textarea rows={3} value={form.practices} onChange={e=>setForm({...form,practices:e.target.value})}/></div><div className="sm:col-span-2"><Label>Observações administrativas (visíveis apenas ao administrador)</Label><Textarea rows={2} value={form.admin_notes} onChange={e=>setForm({...form,admin_notes:e.target.value})}/></div>
        <div className="sm:col-span-2"><div className="mb-2 flex justify-between"><Label>Alunos participantes *</Label><button className="text-xs text-primary" onClick={()=>setForm({...form,participant_emails:students.map(s=>s.student_email)})}>Selecionar todos</button></div><div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border p-2">{students.map(s=><label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-secondary"><Checkbox checked={form.participant_emails.includes(s.student_email)} onCheckedChange={()=>toggleStudent(s.student_email)}/><span className="text-sm">{s.profile_name || s.student_name || s.student_email}</span></label>)}</div><p className="mt-1 text-xs text-muted-foreground">{form.participant_emails.length} participante(s) · o crédito de 10,0 pontos será automático.</p></div>
      </div><Button className="mt-5 w-full" disabled={!form.theme.trim() || !form.date || !form.participant_emails.length || create.isPending} onClick={()=>create.mutate(form)}>{create.isPending ? 'Registrando...' : 'Concluir e creditar participantes'}</Button></DialogContent></Dialog>}</div>
    </section>

    {isLoading ? <p className="text-sm text-muted-foreground">Carregando mentorias...</p> : visible.length === 0 ? <div className="rounded-2xl border border-dashed p-10 text-center"><Sparkles className="mx-auto mb-3 text-muted-foreground"/><p className="font-semibold">Nenhuma mentoria registrada</p><p className="text-sm text-muted-foreground">Os encontros realizados aparecerão aqui.</p></div> : <div className="grid gap-4">{visible.map(m => { const own = reflections.find(r=>r.mentorship_id===m.id && emailOf(r.student_email)===email); const count = reflections.filter(r=>r.mentorship_id===m.id).length; return <article key={m.id} className="rounded-2xl border bg-card p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><div className="mb-2 flex flex-wrap gap-2 text-xs text-muted-foreground"><span className="flex items-center gap-1"><CalendarDays size={13}/>{format(new Date(`${m.date}T12:00:00`),'dd MMM yyyy',{locale:ptBR})}</span><span className="flex items-center gap-1"><Clock3 size={13}/>{m.duration_minutes || 60} min</span><span className="flex items-center gap-1"><Users size={13}/>{(m.participant_emails||[]).length} participantes</span></div><h2 className="text-lg font-bold">{m.theme}</h2>{m.facilitator && <p className="text-sm text-muted-foreground">Facilitação: {m.facilitator}</p>}</div>{isAdmin && <Button variant="ghost" size="icon" className="text-destructive" onClick={()=>confirm('Excluir esta mentoria e retirar os pontos concedidos?')&&remove.mutate(m)}><Trash2 size={16}/></Button>}</div>
      {(m.objective || m.practices) && <div className="mt-4 grid gap-3 sm:grid-cols-2">{m.objective&&<div className="rounded-xl bg-secondary/50 p-3"><p className="text-xs font-bold uppercase text-muted-foreground">Objetivo</p><p className="mt-1 text-sm">{m.objective}</p></div>}{m.practices&&<div className="rounded-xl bg-secondary/50 p-3"><p className="text-xs font-bold uppercase text-muted-foreground">Práticas</p><p className="mt-1 text-sm">{m.practices}</p></div>}</div>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4"><span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-500"><CheckCircle2 size={16}/> Participação: 10,0 pontos</span>{isAdmin ? <span className="text-xs text-muted-foreground">{count} reflexão(ões) recebida(s)</span> : <Button variant={own?'outline':'default'} size="sm" onClick={()=>openReflection(m)}>{own?'Editar minha reflexão':'Registrar minha experiência'}</Button>}</div>
      {isAdmin && m.admin_notes && <p className="mt-3 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-600"><strong>Nota administrativa:</strong> {m.admin_notes}</p>}
      {isAdmin && count > 0 && <details className="mt-3 rounded-xl border p-3"><summary className="cursor-pointer text-sm font-semibold">Consultar impressões dos alunos ({count})</summary><div className="mt-3 space-y-3">{reflections.filter(r=>r.mentorship_id===m.id).map(r=><div key={r.id} className="rounded-lg bg-secondary/50 p-3 text-sm"><div className="mb-1 flex justify-between gap-2"><strong>{r.student_name || r.student_email}</strong><span className="text-amber-500">{'★'.repeat(r.rating || 0)}</span></div><p>{r.experience}</p>{r.insights&&<p className="mt-1 text-muted-foreground"><strong>Aprendizados:</strong> {r.insights}</p>}{r.application&&<p className="mt-1 text-muted-foreground"><strong>Aplicação:</strong> {r.application}</p>}</div>)}</div></details>}</article>})}</div>}

    <Dialog open={!!reflectionFor} onOpenChange={v=>!v&&setReflectionFor(null)}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Diário da vivência</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">Este registro reflexivo ajuda a integrar teoria e prática. Sua resposta fica vinculada à mentoria.</p><div className="space-y-4"><div><Label>Como foi sua experiência? *</Label><Textarea rows={3} value={reflection.experience} onChange={e=>setReflection({...reflection,experience:e.target.value})}/></div><div><Label>Quais percepções ou aprendizados surgiram?</Label><Textarea rows={3} value={reflection.insights} onChange={e=>setReflection({...reflection,insights:e.target.value})}/></div><div><Label>Como pretende aplicar esse aprendizado?</Label><Textarea rows={2} value={reflection.application} onChange={e=>setReflection({...reflection,application:e.target.value})}/></div><div><Label>Valor percebido</Label><div className="mt-2 flex gap-2">{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setReflection({...reflection,rating:n})}><Star size={24} className={n<=reflection.rating?'fill-amber-400 text-amber-400':'text-muted-foreground'}/></button>)}</div></div></div><Button disabled={!reflection.experience.trim()||saveReflection.isPending} onClick={()=>saveReflection.mutate(reflection)}>Salvar reflexão</Button></DialogContent></Dialog>
  </div>;
}
