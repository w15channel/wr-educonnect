import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';
import { Heart, Shuffle, UserCheck, ClipboardList, Star, Lock, CheckCircle2, Trash2 } from 'lucide-react';
import { ClickableStudent } from '@/components/shared/StudentProfileCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';

export default function TerapeutaDaSemana() {
  const { user: session } = useOutletContext();
  const isTeacher = session?.role === 'admin';
  const queryClient = useQueryClient();
  const { emails: courseEmails, course: routeCourse, codePrefix } = useCourseFilteredEmails();
  const activeCourse = routeCourse || session?.course || 'tcc';
  const [evalDialog, setEvalDialog] = useState(null); // { pairing, role: 'therapist'|'patient' }
  const [comment, setComment] = useState('');
  const [score, setScore] = useState([7]);

  const { data: pairings = [] } = useQuery({
    queryKey: ['therapist-pairings'],
    queryFn: () => base44.entities.TherapistPairing.list('-pairing_date', 100),
  });

  const { data: accessCodes = [] } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 200),
  });

  const { data: scoreItems = [] } = useQuery({
    queryKey: ['score-items-terapeuta'],
    queryFn: () => base44.entities.ScoreItem.list('-created_date', 2000),
  });

  const createPairingMutation = useMutation({
    mutationFn: (data) => base44.entities.TherapistPairing.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['therapist-pairings'] }),
  });

  const deletePairingMutation = useMutation({
    mutationFn: (id) => base44.entities.TherapistPairing.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['therapist-pairings'] }); toast.success('Pareamento removido.'); },
  });

  const updatePairingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TherapistPairing.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapist-pairings'] });
      setEvalDialog(null);
      setComment('');
      setScore([7]);
      toast.success('Avaliação enviada!');
    },
  });

  // Período atual: últimos 5 dias
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const periodStart = format(addDays(today, -4), 'yyyy-MM-dd');

  // Filtro por curso: /sex/ exibe apenas alunos SEX-
  const courseEmailSet = courseEmails || new Set(
    accessCodes
      .filter(c =>
        c.course === activeCourse &&
        c.student_email &&
        (!codePrefix || (c.code || '').startsWith(codePrefix))
      )
      .map(c => c.student_email)
  );

  const currentPairings = pairings.filter(p =>
    p.pairing_date >= periodStart &&
    (!courseEmailSet || (courseEmailSet.has(p.therapist_email) && courseEmailSet.has(p.patient_email)))
  );
  const pastPairings = pairings.filter(p =>
    p.pairing_date < periodStart &&
    (!courseEmailSet || (courseEmailSet.has(p.therapist_email) && courseEmailSet.has(p.patient_email)))
  );

  // Pairings do aluno logado
  const myTherapistPairing = currentPairings.find(p => p.therapist_email === session?.email);
  const myPatientPairing = currentPairings.find(p => p.patient_email === session?.email);

  const getStudentInfo = (email) => {
    const code = accessCodes.find(c => c.student_email === email);
    return {
      name: code?.profile_name || code?.student_name || email,
      photo: code?.profile_photo_url || '',
      color: code?.profile_avatar_color || '#5b5ef4',
    };
  };

  const handleGeneratePairings = async () => {
    await queryClient.invalidateQueries({ queryKey: ['access-codes'] });
    const freshCodes = await base44.entities.AccessCode.list('-created_date', 200);
    const activeStudents = freshCodes.filter(c =>
      c.is_active &&
      c.student_email &&
      c.course === activeCourse &&
      (!codePrefix || (c.code || '').startsWith(codePrefix))
    );
    if (activeStudents.length < 2) {
      toast.error('São necessários pelo menos 2 alunos para criar pareamentos.');
      return;
    }

    // Balancear: top 10 pontuados ficam juntos, demais são sorteados aleatoriamente
    const freshScores = await base44.entities.ScoreItem.list('-created_date', 2000);
    const scoreMap = {};
    freshScores.filter(s => s.verified).forEach(s => {
      if (s.student_email) scoreMap[s.student_email] = (scoreMap[s.student_email] || 0) + (s.score || 0);
    });
    const sorted = [...activeStudents].sort((a, b) => (scoreMap[b.student_email] || 0) - (scoreMap[a.student_email] || 0));
    const top = sorted.slice(0, Math.min(10, Math.floor(sorted.length / 2) * 2)); // top 10 (par)
    const rest = sorted.slice(top.length);

    // Embaralha dentro de cada grupo
    const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
    const topShuffled = shuffle(top);
    const restShuffled = shuffle(rest);
    const allOrdered = [...topShuffled, ...restShuffled];

    const date = todayStr;
    const endDate = format(addDays(today, 4), 'yyyy-MM-dd');
    const pairs = [];
    for (let i = 0; i < allOrdered.length - 1; i += 2) {
      pairs.push({ therapist: allOrdered[i], patient: allOrdered[i + 1] });
    }
    if (allOrdered.length % 2 !== 0) {
      pairs.push({ therapist: allOrdered[allOrdered.length - 1], patient: allOrdered[0] });
    }
    for (const { therapist, patient } of pairs) {
      await createPairingMutation.mutateAsync({
        therapist_email: therapist.student_email,
        therapist_name: therapist.profile_name || therapist.student_name,
        patient_email: patient.student_email,
        patient_name: patient.profile_name || patient.student_name,
        pairing_date: date,
        period_end: endDate,
      });
    }
    toast.success(`✅ ${pairs.length} pareamento(s) gerado(s) — top pontuados pareados entre si!`);
  };

  const handleSubmitEval = () => {
    if (!evalDialog) return;
    const { pairing, role } = evalDialog;
    const updateData = role === 'therapist'
      ? { therapist_comment: comment, therapist_score: score[0], therapist_submitted: true }
      : { patient_comment: comment, patient_score: score[0], patient_submitted: true };
    updatePairingMutation.mutate({ id: pairing.id, data: updateData });
  };

  const StudentAvatar = ({ email, size = 'md' }) => {
    const info = getStudentInfo(email);
    const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-12 h-12 text-base';
    return info.photo
      ? <img src={info.photo} alt={info.name} className={`${sz} rounded-full object-cover`} />
      : <div className={`${sz} rounded-full flex items-center justify-center font-bold text-white`} style={{ backgroundColor: info.color }}>{info.name?.charAt(0)?.toUpperCase()}</div>;
  };

  return (
    <div className="p-4 lg:p-7 max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
            <Heart size={22} className="text-pink-500" /> Terapeuta da Semana
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Pareamentos a cada 5 dias</p>
        </div>
        {isTeacher && (
          <Button onClick={handleGeneratePairings} className="gap-2" disabled={createPairingMutation.isPending}>
            <Shuffle size={15} /> Gerar Novos Pareamentos
          </Button>
        )}
      </div>

      {/* Meus pareamentos */}
      {!isTeacher && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Sou terapeuta de... */}
          <div className={`bg-card rounded-2xl border p-5 space-y-3 ${myTherapistPairing ? 'border-pink-200' : 'border-border'}`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-pink-100 flex items-center justify-center">
                <UserCheck size={16} className="text-pink-600" />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">Você é Terapeuta de</p>
                <p className="text-xs text-muted-foreground">Você realiza a sessão</p>
              </div>
            </div>
            {myTherapistPairing ? (
              <>
                <div className="flex items-center gap-3 rounded-xl p-3 border border-pink-200 bg-transparent backdrop-blur-sm">
                  <StudentAvatar email={myTherapistPairing.patient_email} />
                  <div>
                    <ClickableStudent email={myTherapistPairing.patient_email} className="font-bold text-sm">{getStudentInfo(myTherapistPairing.patient_email).name}</ClickableStudent>
                    <p className="text-xs text-muted-foreground">Paciente</p>
                  </div>
                </div>
                {myTherapistPairing.therapist_submitted ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200 gap-1"><CheckCircle2 size={11} /> Avaliação enviada</Badge>
                ) : (
                  <Button size="sm" className="w-full gap-2" onClick={() => { setEvalDialog({ pairing: myTherapistPairing, role: 'therapist' }); setComment(''); setScore([7]); }}>
                    <ClipboardList size={14} /> Avaliar Paciente
                  </Button>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum pareamento ativo</p>
            )}
          </div>

          {/* Sou paciente de... */}
          <div className={`bg-card rounded-2xl border p-5 space-y-3 ${myPatientPairing ? 'border-blue-200' : 'border-border'}`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
                <Heart size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">Seu Terapeuta é</p>
                <p className="text-xs text-muted-foreground">Você é o paciente</p>
              </div>
            </div>
            {myPatientPairing ? (
              <>
                <div className="flex items-center gap-3 rounded-xl p-3 border border-blue-200 bg-transparent backdrop-blur-sm">
                  <StudentAvatar email={myPatientPairing.therapist_email} />
                  <div>
                    <ClickableStudent email={myPatientPairing.therapist_email} className="font-bold text-sm">{getStudentInfo(myPatientPairing.therapist_email).name}</ClickableStudent>
                    <p className="text-xs text-muted-foreground">Terapeuta</p>
                  </div>
                </div>
                {myPatientPairing.patient_submitted ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200 gap-1"><CheckCircle2 size={11} /> Avaliação enviada</Badge>
                ) : (
                  <Button size="sm" variant="outline" className="w-full gap-2" onClick={() => { setEvalDialog({ pairing: myPatientPairing, role: 'patient' }); setComment(''); setScore([7]); }}>
                    <ClipboardList size={14} /> Avaliar Terapeuta
                  </Button>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum pareamento ativo</p>
            )}
          </div>
        </div>
      )}

      {/* Visão do professor: todos os pareamentos */}
      {isTeacher && (
        <Tabs defaultValue="current">
          <TabsList>
            <TabsTrigger value="current">Pareamentos Atuais</TabsTrigger>
            <TabsTrigger value="past">Anteriores</TabsTrigger>
          </TabsList>
          <TabsContent value="current" className="mt-4 space-y-3">
            {currentPairings.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Heart size={40} className="mx-auto mb-3 opacity-20" />
                <p>Nenhum pareamento ativo. Clique em "Gerar Novos Pareamentos".</p>
              </div>
            )}
            {currentPairings.map(p => (
              <PairingCard key={p.id} pairing={p} getStudentInfo={getStudentInfo} showScores={isTeacher} onDelete={() => deletePairingMutation.mutate(p.id)} />
            ))}
          </TabsContent>
          <TabsContent value="past" className="mt-4 space-y-3">
            {pastPairings.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">Nenhum pareamento anterior.</p>}
            {pastPairings.map(p => (
              <PairingCard key={p.id} pairing={p} getStudentInfo={getStudentInfo} showScores={isTeacher} onDelete={() => deletePairingMutation.mutate(p.id)} />
            ))}
          </TabsContent>
        </Tabs>
      )}

      {/* Lista atual para alunos */}
      {!isTeacher && currentPairings.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-bold text-sm text-foreground mb-4">Todos os Pareamentos desta Rodada</h3>
          <div className="space-y-2">
            {currentPairings.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-secondary/40 rounded-xl">
                <StudentAvatar email={p.therapist_email} size="sm" />
                <span className="text-xs font-semibold text-foreground truncate flex-1">{getStudentInfo(p.therapist_email).name}</span>
                <span className="text-[10px] text-muted-foreground bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">terapeuta</span>
                <span className="text-xs text-muted-foreground">→</span>
                <span className="text-[10px] text-muted-foreground bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">paciente</span>
                <span className="text-xs font-semibold text-foreground truncate flex-1 text-right">{getStudentInfo(p.patient_email).name}</span>
                <StudentAvatar email={p.patient_email} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialog Avaliação */}
      <Dialog open={!!evalDialog} onOpenChange={() => setEvalDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock size={16} className="text-muted-foreground" />
              {evalDialog?.role === 'therapist' ? 'Avaliação do Paciente' : 'Avaliação do Terapeuta'}
              <span className="text-xs font-normal text-muted-foreground">(privada)</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            <div className="bg-secondary/50 rounded-xl p-3 text-xs text-muted-foreground flex items-center gap-2">
              <Lock size={12} /> Esta avaliação é <strong>visível apenas para o professor</strong>.
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Relato do caso</label>
              <Textarea
                rows={5}
                placeholder="Descreva como foi a sessão, os pontos observados..."
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-3">
                Nota: <span className="text-primary font-bold text-lg">{score[0]}</span>/10
              </label>
              <Slider min={0} max={10} step={0.5} value={score} onValueChange={setScore} className="w-full" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>0</span><span>10</span></div>
            </div>
            <Button
              className="w-full"
              disabled={!comment.trim() || updatePairingMutation.isPending}
              onClick={handleSubmitEval}
            >
              Enviar Avaliação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PairingCard({ pairing, getStudentInfo, showScores, onDelete }) {
  const therapist = getStudentInfo(pairing.therapist_email);
  const patient = getStudentInfo(pairing.patient_email);
  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1">
          {therapist.photo
            ? <img src={therapist.photo} alt={therapist.name} className="w-9 h-9 rounded-full object-cover" />
            : <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: therapist.color || '#ec4899' }}>{therapist.name?.charAt(0)}</div>
          }
          <div>
            <p className="text-xs font-bold text-foreground">{therapist.name}</p>
            <Badge className="text-[9px] bg-pink-100 text-pink-700 border-pink-200">Terapeuta</Badge>
          </div>
        </div>
        <span className="text-muted-foreground text-sm">⇄</span>
        <div className="flex items-center gap-2 flex-1">
          {patient.photo
            ? <img src={patient.photo} alt={patient.name} className="w-9 h-9 rounded-full object-cover" />
            : <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: patient.color || '#3b82f6' }}>{patient.name?.charAt(0)}</div>
          }
          <div>
            <p className="text-xs font-bold text-foreground">{patient.name}</p>
            <Badge className="text-[9px] bg-blue-100 text-blue-700 border-blue-200">Paciente</Badge>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {pairing.therapist_submitted ? <CheckCircle2 size={13} className="text-green-500" /> : <div className="w-3 h-3 rounded-full bg-orange-300" />}
          {pairing.patient_submitted ? <CheckCircle2 size={13} className="text-green-500" /> : <div className="w-3 h-3 rounded-full bg-orange-300" />}
          {onDelete && (
            <button onClick={onDelete} className="ml-1 p-1.5 text-muted-foreground hover:text-destructive rounded-lg transition-colors" title="Excluir pareamento">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
      {showScores && (pairing.therapist_submitted || pairing.patient_submitted) && (
        <div className="border-t border-border pt-3 space-y-2">
          {pairing.therapist_submitted && (
            <div className="border border-pink-200 rounded-xl p-3 bg-transparent">
              <p className="text-xs font-bold text-pink-600 mb-1">Avaliação do Terapeuta → Paciente</p>
              <p className="text-xs text-foreground">{pairing.therapist_comment}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <Star size={11} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-bold">{pairing.therapist_score}/10</span>
              </div>
            </div>
          )}
          {pairing.patient_submitted && (
            <div className="border border-blue-200 rounded-xl p-3 bg-transparent">
              <p className="text-xs font-bold text-blue-600 mb-1">Avaliação do Paciente → Terapeuta</p>
              <p className="text-xs text-foreground">{pairing.patient_comment}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <Star size={11} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-bold">{pairing.patient_score}/10</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}