import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { adminApi } from '@/lib/adminApi';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';
import { Heart, Shuffle, UserCheck, ClipboardList, Star, Lock, CheckCircle2, Trash2, ArrowLeftRight, Send, Phone, Mail, Archive } from 'lucide-react';
import { ClickableStudent } from '@/components/shared/StudentProfileCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { formatScore, roundScore } from '@/lib/scoreUtils';
import { sortBySequence } from '@/lib/sequenceUtils';
import { resolveAvatarEmoji } from '@/lib/avatarUtils';
import RelatosMural from '@/components/therapist/RelatosMural';
import ParticipationCelebration from '@/components/shared/ParticipationCelebration';
import { publishToStudentWallBatch } from '@/lib/studentWallPost';
import { buildScoreBalancedPairings, findStudentPairings, getLatestPairingDate, isActiveStudent, normalizeStudentEmail } from '@/lib/therapistPairings';
import { visiblePairingsForReportWall } from '@/lib/therapistReports';

export default function TerapeutaDaSemana() {
  const { user: session } = useOutletContext();
  const isTeacher = session?.role === 'admin';
  const queryClient = useQueryClient();
  const { emails: courseEmails, course: routeCourse, codePrefix } = useCourseFilteredEmails();
  const activeCourse = routeCourse || session?.course || 'tcc';
  const [evalDialog, setEvalDialog] = useState(null); // { pairing, role: 'therapist'|'patient' }
  const [comment, setComment] = useState('');
  const [score, setScore] = useState([7]);
  const [celebrating, setCelebrating] = useState(false);
  const [swapSelection, setSwapSelection] = useState(null); // id of first pairing selected for swap
  const [manualTherapist, setManualTherapist] = useState(null); // email of student selected as therapist for manual pairing
  const [selectedModule, setSelectedModule] = useState('1');

  const { data: pairings = [] } = useQuery({
    queryKey: ['therapist-pairings', isTeacher ? 'admin' : normalizeStudentEmail(session?.email)],
    queryFn: async () => {
      if (isTeacher) return base44.entities.TherapistPairing.list('-pairing_date', 1000);
      if (!session?.email) return [];
      // Buscamos todos os pareamentos e filtramos no cliente por email
      // normalizado (lowercase + trim). O filtro do banco faz match exato,
      // então diferenças de maiúsculas ou espaços no email impediriam o
      // aluno de ver sua dupla — essa abordagem resolve o problema para
      // qualquer aluno que enfrente essa situação.
      const all = await base44.entities.TherapistPairing.list('-pairing_date', 1000);
      const normalized = normalizeStudentEmail(session.email);
      return all.filter(p =>
        normalizeStudentEmail(p.therapist_email) === normalized ||
        normalizeStudentEmail(p.patient_email) === normalized
      );
    },
  });

  const { data: accessCodes = [] } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 10000),
  });

  const { data: studentProfiles = [] } = useQuery({
    queryKey: ['student-profiles-contacts'],
    queryFn: () => base44.entities.StudentProfile.list('-updated_date', 10000),
  });

  const { data: weekSettingsList = [] } = useQuery({
    queryKey: ['therapist-week-settings'],
    queryFn: () => base44.entities.TherapistWeekSettings.list('-created_date', 1),
    enabled: isTeacher,
  });


  const createPairingMutation = useMutation({
    mutationFn: (data) => base44.entities.TherapistPairing.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['therapist-pairings'] }),
  });

  const deletePairingMutation = useMutation({
    mutationFn: (id) => base44.entities.TherapistPairing.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['therapist-pairings'] }); toast.success('Pareamento removido.'); },
  });

  const archivePairingMutation = useMutation({
    mutationFn: ({ id, archived }) => base44.entities.TherapistPairing.update(id, { is_archived: archived }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['therapist-pairings'] });
      toast.success(variables.archived ? 'Pareamento arquivado.' : 'Pareamento reativado.');
    },
  });

  const updatePairingMutation = useMutation({
    mutationFn: async ({ id, data, pairing, role }) => {
      const updated = await base44.entities.TherapistPairing.update(id, data);
      if (!pairing || !role) return updated;
      const studentEmail = role === 'therapist' ? pairing.therapist_email : pairing.patient_email;
      const refId = `therapist_pairing:${pairing.id}:${role}`;
      const existing = await adminApi.list('ScoreItem', { filter: { student_email: studentEmail, ref_id: refId }, limit: 10 });
      const scoreData = {
        student_email: studentEmail, category: 'task', ref_id: refId,
        ref_title: role === 'therapist' ? `Relato Terapeuta da Semana (${pairing.pairing_date})` : `Relato Terapeuta da Semana — Paciente (${pairing.pairing_date})`,
        score: 10, max_score: 10, verified: true, module_number: Number(pairing.module_number) || Number(selectedModule),
        notes: `Relato enviado como ${role === 'therapist' ? 'terapeuta' : 'paciente'} na atividade Terapeuta da Semana: +10 pontos.`,
      };
      if (existing[0]) await adminApi.update('ScoreItem', existing[0].id, scoreData);
      else await adminApi.create('ScoreItem', scoreData);
      await base44.functions.invoke('populateScoreCache', { student_email: studentEmail });
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapist-pairings'] });
      queryClient.invalidateQueries({ queryKey: ['score-items-all'] });
      queryClient.invalidateQueries({ queryKey: ['access-codes'] });
      setEvalDialog(null);
      setComment('');
      setScore([7]);
      toast.success('Avaliação enviada!');
      setCelebrating(true);
    },
  });

  const publishPairingsMutation = useMutation({
    mutationFn: async (pairingsToPublish) => {
      const updated = await Promise.all(
        pairingsToPublish.map(p => base44.entities.TherapistPairing.update(p.id, { is_published: true }))
      );
      // Mural individual: sempre que uma publicação é feita em nome do aluno,
      // ele recebe uma menção em seu próprio mural com a informação da dupla.
      await publishToStudentWallBatch(
        pairingsToPublish.flatMap((p) => {
          const therapistName = p.therapist_name || getStudentInfo(p.therapist_email).name;
          const patientName = p.patient_name || getStudentInfo(p.patient_email).name;
          const therapistContact = getStudentContact(p.therapist_email);
          const patientContact = getStudentContact(p.patient_email);
          const sourceId = p.id;
          return [
            {
              studentEmail: p.therapist_email,
              title: 'Sua dupla desta semana',
              message: `${therapistName}, sua dupla na atividade Terapeuta da Semana é ${patientName}, que terá a função de paciente. Contato: ${patientContact.label}.`,
              sourceType: 'therapist_pairing',
              sourceId,
              relatedEmail: p.patient_email,
              relatedName: patientName,
              publishedBy: session?.email,
            },
            {
              studentEmail: p.patient_email,
              title: 'Sua dupla desta semana',
              message: `${patientName}, sua dupla na atividade Terapeuta da Semana é ${therapistName}, que terá a função de terapeuta. Contato: ${therapistContact.label}.`,
              sourceType: 'therapist_pairing',
              sourceId,
              relatedEmail: p.therapist_email,
              relatedName: therapistName,
              publishedBy: session?.email,
            },
          ];
        })
      );
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapist-pairings'] });
      queryClient.invalidateQueries({ queryKey: ['student-wall-posts'] });
      toast.success('✅ Lista publicada! Os alunos já podem ver os pareamentos.');
    },
  });

  const swapPatientsMutation = useMutation({
    mutationFn: async ({ pairingA, pairingB }) => {
      await base44.entities.TherapistPairing.update(pairingA.id, {
        patient_email: pairingB.patient_email,
        patient_name: pairingB.patient_name,
      });
      await base44.entities.TherapistPairing.update(pairingB.id, {
        patient_email: pairingA.patient_email,
        patient_name: pairingA.patient_name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapist-pairings'] });
      setSwapSelection(null);
      toast.success('Pacientes trocados com sucesso.');
    },
  });

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // Filtro por curso: /sex/ exibe apenas alunos SEX-
  const isCodeInActiveDomain = (code) => {
    const email = code.student_email || '';
    if (!isActiveStudent(code) || !email) return false;
    if (courseEmails && courseEmails.size > 0) return courseEmails.has(email);
    return code.course === activeCourse && (!codePrefix || (code.code || '').startsWith(codePrefix));
  };

  const getStudentTotalScore = (email, items = accessCodes) => roundScore(items.find((code) => code.student_email === email)?.pontuacao_total || 0);

  const courseEmailSet = new Set([...(courseEmails || accessCodes
      .filter(isCodeInActiveDomain)
      .map(c => c.student_email))]
    .map(normalizeStudentEmail)
    .filter(Boolean));

  // Todos os alunos ativos do domínio participam
  const activeDomainStudents = accessCodes.filter(isCodeInActiveDomain);
  const rankedDomainStudents = [...activeDomainStudents].sort((a, b) => getStudentTotalScore(b.student_email) - getStudentTotalScore(a.student_email));


  // Todos os pareamentos começam como "atuais". Só passam para "anteriores"
  // quando ambos os alunos enviam seus depoimentos OU quando o admin arquiva
  // manualmente.
  // Para alunos, a query já traz apenas seus próprios pareamentos — não
  // aplicamos o filtro de curso, que poderia excluí-los por divergência de
  // email ou curso entre o AccessCode e o pareamento. Para professores,
  // mantemos o filtro por domínio do curso.
  const domainPairingsAll = isTeacher
    ? pairings.filter(p =>
        courseEmailSet.size === 0 || (
          courseEmailSet.has(normalizeStudentEmail(p.therapist_email)) &&
          courseEmailSet.has(normalizeStudentEmail(p.patient_email))
        )
      )
    : pairings;
  const latestPairingDate = getLatestPairingDate(domainPairingsAll);

  const isPairingCompleted = (p) => Boolean(p.therapist_submitted && p.patient_submitted);
  const isPairingPast = (p) => Boolean(p.is_archived) || isPairingCompleted(p);

  const currentPairings = sortBySequence(domainPairingsAll.filter(p => !isPairingPast(p)));
  const pastPairings = sortBySequence(domainPairingsAll.filter(p => isPairingPast(p)));

  // Alunos veem seu pareamento publicado mais recente que ainda não foi
  // arquivado, independentemente de qual rodada (data) ele pertence.
  const publishedActivePairings = domainPairingsAll.filter(p => p.is_published && !p.is_archived);

  // Pairings do aluno logado (apenas publicados e não arquivados)
  const { asTherapist: myTherapistPairing, asPatient: myPatientPairing } = findStudentPairings(
    publishedActivePairings,
    session?.email
  );

  const getStudentInfo = (email) => {
    const normalizedEmail = normalizeStudentEmail(email);
    const code = accessCodes.find(c => normalizeStudentEmail(c.student_email) === normalizedEmail);
    return {
      name: code?.profile_name || code?.student_name || email,
      photo: code?.profile_photo_url || '',
      color: code?.profile_avatar_color || '#5b5ef4',
      avatarEmoji: resolveAvatarEmoji(code?.profile_avatar_emoji),
    };
  };

  const getStudentContact = (email) => {
    const normalizedEmail = normalizeStudentEmail(email);
    const profile = studentProfiles.find(p => normalizeStudentEmail(p.student_email) === normalizedEmail);
    const whatsapp = profile?.whatsapp || '';
    const contactEmail = profile?.email || email || '';
    return {
      whatsapp,
      email: contactEmail,
      label: whatsapp || contactEmail || 'contato não informado',
    };
  };

  useEffect(() => {
    if (isTeacher || !session?.email || publishedActivePairings.length === 0) return;
    const entries = publishedActivePairings.flatMap((p) => {
      const therapistName = p.therapist_name || getStudentInfo(p.therapist_email).name;
      const patientName = p.patient_name || getStudentInfo(p.patient_email).name;
      const therapistContact = getStudentContact(p.therapist_email);
      const patientContact = getStudentContact(p.patient_email);
      if (normalizeStudentEmail(p.therapist_email) === normalizeStudentEmail(session.email)) {
        return [{
          studentEmail: p.therapist_email,
          title: 'Sua dupla desta semana',
          message: `${therapistName}, sua dupla na atividade Terapeuta da Semana é ${patientName}, que terá a função de paciente. Contato: ${patientContact.label}.`,
          sourceType: 'therapist_pairing',
          sourceId: p.id,
          relatedEmail: p.patient_email,
          relatedName: patientName,
          publishedBy: 'system-reconciliation',
        }];
      }
      if (normalizeStudentEmail(p.patient_email) === normalizeStudentEmail(session.email)) {
        return [{
          studentEmail: p.patient_email,
          title: 'Sua dupla desta semana',
          message: `${patientName}, sua dupla na atividade Terapeuta da Semana é ${therapistName}, que terá a função de terapeuta. Contato: ${therapistContact.label}.`,
          sourceType: 'therapist_pairing',
          sourceId: p.id,
          relatedEmail: p.therapist_email,
          relatedName: therapistName,
          publishedBy: 'system-reconciliation',
        }];
      }
      return [];
    });
    if (entries.length > 0) {
      publishToStudentWallBatch(entries).then(() => {
        queryClient.invalidateQueries({ queryKey: ['student-wall-posts'] });
      });
    }
  }, [isTeacher, session?.email, publishedActivePairings.map(p => `${p.id}:${p.is_published}`).join('|'), studentProfiles.length, accessCodes.length]);

  const handleGeneratePairings = async () => {
    await queryClient.invalidateQueries({ queryKey: ['access-codes'] });
    const freshCodes = await base44.entities.AccessCode.list('-created_date', 10000);
    const activeStudents = freshCodes.filter(isCodeInActiveDomain);
    if (activeStudents.length < 2) {
      toast.error('São necessários pelo menos 2 alunos ativos neste domínio.');
      return;
    }

    const date = todayStr;
    const { pairs, unpaired } = buildScoreBalancedPairings(activeStudents);
    for (const { therapist, patient } of pairs) {
      await createPairingMutation.mutateAsync({
        therapist_email: therapist.student_email,
        therapist_name: therapist.profile_name || therapist.student_name,
        patient_email: patient.student_email,
        patient_name: patient.profile_name || patient.student_name,
        pairing_date: date,
        module_number: Number(selectedModule),
        is_published: false,
      });
    }
    if (unpaired.length > 0) {
      toast.warning(`${pairs.length} dupla(s) gerada(s). ${unpaired.length} aluno(s) ficaram sem combinação compatível por sobrenome ou quantidade ímpar.`);
    } else {
      toast.success(`✅ ${pairs.length} dupla(s) equilibrada(s) gerada(s). Revise e compartilhe quando estiver pronto.`);
    }
  };

  // Alunos já em dupla na rodada atual (para o pareamento manual)
  const pairedEmails = new Set(currentPairings.flatMap(p => [p.therapist_email, p.patient_email]));

  const handleManualStudentClick = (student) => {
    if (createPairingMutation.isPending) return;
    const email = student.student_email;
    if (pairedEmails.has(email)) {
      toast.info('Este aluno já está em uma dupla nesta rodada. Exclua o pareamento para reutilizá-lo.');
      return;
    }
    if (!manualTherapist) {
      setManualTherapist(email);
      return;
    }
    if (manualTherapist === email) {
      setManualTherapist(null);
      return;
    }
    const therapistCode = activeDomainStudents.find(c => c.student_email === manualTherapist);
    if (!therapistCode || pairedEmails.has(manualTherapist)) {
      setManualTherapist(null);
      return;
    }
    const hasDraftBatch = currentPairings.some(p => !p.is_published);
    createPairingMutation.mutate({
      therapist_email: therapistCode.student_email,
      therapist_name: therapistCode.profile_name || therapistCode.student_name,
      patient_email: student.student_email,
      patient_name: student.profile_name || student.student_name,
      pairing_date: hasDraftBatch ? latestPairingDate : todayStr,
      module_number: Number(selectedModule),
      is_published: false,
    }, {
      onSuccess: () => {
        setManualTherapist(null);
        toast.success('Dupla criada como rascunho. Publique a lista quando estiver pronta.');
      },
    });
  };

  const deleteReportMutation = useMutation({
    mutationFn: ({ pairingId, field }) => {
      const data = field === 'therapist'
        ? { therapist_comment: '', therapist_score: null, therapist_submitted: false }
        : { patient_comment: '', patient_score: null, patient_submitted: false };
      return base44.entities.TherapistPairing.update(pairingId, data);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['therapist-pairings'] }); toast.success('Relato excluído.'); },
  });

  const editReport = (report) => {
    const pairing = pairings.find((item) => item.id === report.pairingId);
    if (!pairing) return;
    setEvalDialog({ pairing, role: report.field });
    setComment(report.comment || '');
    setScore([Number(report.score) || 0]);
  };

  // Todos os pareamentos do domínio (atuais + anteriores) com pelo menos um relato
  const allDomainPairings = visiblePairingsForReportWall(domainPairingsAll, session?.email, isTeacher);

  const handleSubmitEval = () => {
    if (!evalDialog) return;
    const { pairing, role } = evalDialog;
    const updateData = role === 'therapist'
      ? { therapist_comment: comment, therapist_score: roundScore(score[0]), therapist_submitted: true }
      : { patient_comment: comment, patient_score: roundScore(score[0]), patient_submitted: true };
    updatePairingMutation.mutate({ id: pairing.id, data: updateData, pairing, role });
  };

  const updatePairingModule = async (pairing, moduleNumber) => {
    try {
      await adminApi.update('TherapistPairing', pairing.id, { module_number: moduleNumber });
      const refIds = [`therapist_pairing:${pairing.id}:therapist`, `therapist_pairing:${pairing.id}:patient`];
      const scoreLists = await Promise.all(refIds.map(refId => adminApi.list('ScoreItem', { filter: { ref_id: refId }, limit: 20 })));
      const scores = scoreLists.flat();
      await Promise.all(scores.map(item => adminApi.update('ScoreItem', item.id, { module_number: moduleNumber })));
      const affectedEmails = [...new Set(scores.map(item => item.student_email).filter(Boolean))];
      await Promise.all(affectedEmails.map(studentEmail => base44.functions.invoke('populateScoreCache', { student_email: studentEmail })));
      queryClient.invalidateQueries({ queryKey: ['therapist-pairings'] });
      queryClient.invalidateQueries({ queryKey: ['score-items-all'] });
      toast.success(`Pontuação destinada ao Módulo ${moduleNumber}.`);
    } catch (error) {
      toast.error(error.message || 'Não foi possível alterar o módulo.');
    }
  };

  const StudentAvatar = ({ email, size = 'md' }) => {
    const info = getStudentInfo(email);
    const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-12 h-12 text-base';
    return info.photo
      ? <img src={info.photo} alt={info.name} className={`${sz} rounded-full object-cover`} />
      : <div className={`${sz} rounded-full flex items-center justify-center font-bold text-white`} style={{ backgroundColor: info.color }}>{info.avatarEmoji || info.name?.charAt(0)?.toUpperCase()}</div>;
  };

  return (
    <div className="app-page max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      {celebrating && <ParticipationCelebration session={session} achievement={{ kind: 'report', message: 'concluiu seu relato da semana.' }} message="Relato enviado! Obrigado por cuidar da turma! 🎉" onClose={() => setCelebrating(false)} />}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
            <Heart size={22} className="text-pink-500" /> Terapeuta da Semana
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Maior pontuação com a menor pontuação compatível, sem sobrenomes similares</p>
        </div>
        {isTeacher && (
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleGeneratePairings} className="gap-2" disabled={createPairingMutation.isPending}>
              <Shuffle size={15} /> Gerar Novos Pareamentos
            </Button>
            {currentPairings.length > 0 && !currentPairings.every(p => p.is_published) && (
              <Button
                variant="default"
                className="gap-2 bg-green-600 hover:bg-green-700"
                onClick={() => publishPairingsMutation.mutate(currentPairings.filter(p => !p.is_published))}
                disabled={publishPairingsMutation.isPending}
              >
                <Send size={15} /> Compartilhar Duplas
              </Button>
            )}
          </div>
        )}
      </div>

      {isTeacher && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="rounded-xl border border-violet-200 bg-violet-500/5 p-3">
            <label className="mb-1 block text-sm font-bold text-foreground">Módulo de destino da pontuação</label>
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{Array.from({ length: 10 }, (_, index) => index + 1).map(module => <SelectItem key={module} value={String(module)}>Módulo {module}</SelectItem>)}</SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">Novos pareamentos e seus 10,0 pontos serão enquadrados no módulo selecionado.</p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-foreground">Alunos deste domínio</h3>
              <p className="text-xs text-muted-foreground">
                Monte as duplas manualmente: clique em um aluno para defini-lo como <strong>terapeuta</strong> e depois clique em outro para defini-lo como <strong>paciente</strong>. Você também pode usar "Gerar Novos Pareamentos" para criar um rascunho automático.
              </p>
            </div>
            <Badge variant="secondary">{activeDomainStudents.length} alunos</Badge>
          </div>
          {manualTherapist && (
            <div className="bg-pink-50 border border-pink-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm text-pink-800">
              <UserCheck size={15} className="shrink-0" />
              <span>
                <strong>{getStudentInfo(manualTherapist).name}</strong> será o(a) terapeuta. Clique em outro aluno para escolher o(a) paciente, ou clique novamente para cancelar.
              </span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
            {rankedDomainStudents.map((student) => {
              const isPaired = pairedEmails.has(student.student_email);
              const isSelected = manualTherapist === student.student_email;
              return (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => handleManualStudentClick(student)}
                  className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition-colors ${
                    isSelected
                      ? 'bg-pink-100 ring-2 ring-pink-400'
                      : isPaired
                        ? 'bg-secondary/40 opacity-60 cursor-not-allowed'
                        : 'bg-secondary/40 hover:bg-pink-50'
                  }`}
                  title={isPaired ? 'Já em dupla nesta rodada' : isSelected ? 'Clique para cancelar a seleção' : manualTherapist ? 'Clique para definir como paciente' : 'Clique para definir como terapeuta'}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{student.profile_name || student.student_name || 'Sem nome'}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{student.student_email}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isSelected ? (
                      <Badge className="text-[9px] bg-pink-500 text-white border-pink-500">Terapeuta selecionado</Badge>
                    ) : isPaired ? (
                      <Badge className="text-[9px] bg-green-100 text-green-700 border-green-200">Em dupla</Badge>
                    ) : (
                      <Badge className="text-[9px] bg-secondary text-muted-foreground border-border">Disponível</Badge>
                    )}
                    <span className="text-[10px] font-bold text-muted-foreground">{formatScore(getStudentTotalScore(student.student_email))} pts</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

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
                    <ContactLine contact={getStudentContact(myTherapistPairing.patient_email)} roleLabel="Contato do paciente" />
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
                    <ContactLine contact={getStudentContact(myPatientPairing.therapist_email)} roleLabel="Contato do terapeuta" />
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
            {currentPairings.length > 0 && !currentPairings.every(p => p.is_published) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-yellow-800">
                <ArrowLeftRight size={15} className="shrink-0" />
                <span>
                  <strong>Rascunho</strong> — Os alunos ainda não podem ver estes pareamentos.
                  Reposicione os pares clicando em <strong>Trocar</strong> em dois cartões seguidos, depois clique em{' '}
                  <strong>Publicar Lista para Alunos</strong>.
                </span>
              </div>
            )}
            {currentPairings.map(p => (
              <PairingCard
                key={p.id}
                pairing={p}
                getStudentInfo={getStudentInfo}
                showScores={isTeacher}
                onDelete={() => deletePairingMutation.mutate(p.id)}
                onArchive={() => archivePairingMutation.mutate({ id: p.id, archived: true })}
                onModuleChange={(moduleNumber) => updatePairingModule(p, moduleNumber)}
                isDraft={!p.is_published}
                swapSelectedId={swapSelection}
                onSwap={() => {
                  if (swapPatientsMutation.isPending) return;
                  if (!swapSelection) {
                    setSwapSelection(p.id);
                  } else if (swapSelection === p.id) {
                    setSwapSelection(null);
                  } else {
                    const pairingA = currentPairings.find(x => x.id === swapSelection);
                    if (pairingA) {
                      swapPatientsMutation.mutate({ pairingA, pairingB: p });
                    } else {
                      setSwapSelection(null);
                    }
                  }
                }}
              />
            ))}
          </TabsContent>
          <TabsContent value="past" className="mt-4 space-y-3">
            {pastPairings.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">Nenhum pareamento anterior.</p>}
            {pastPairings.map(p => (
              <PairingCard key={p.id} pairing={p} getStudentInfo={getStudentInfo} showScores={isTeacher} onDelete={() => deletePairingMutation.mutate(p.id)} onArchive={p.is_archived ? () => archivePairingMutation.mutate({ id: p.id, archived: false }) : undefined} onModuleChange={(moduleNumber) => updatePairingModule(p, moduleNumber)} />
            ))}
          </TabsContent>
        </Tabs>
      )}

      {/* Mural permanente de relatos — histórico por datas */}
      <RelatosMural
        pairings={allDomainPairings}
        getStudentInfo={getStudentInfo}
        isTeacher={isTeacher}
        session={session}
        activeCourse={activeCourse}
        onEditReport={editReport}
        onDeleteReport={(r) => deleteReportMutation.mutate({ pairingId: r.pairingId, field: r.field })}
      />

      {/* Dialog Avaliação */}
      <Dialog open={!!evalDialog} onOpenChange={() => setEvalDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock size={16} className="text-muted-foreground" />
              {evalDialog?.role === 'therapist' ? 'Avaliação do Paciente' : 'Avaliação do Terapeuta'}
              <span className="text-xs font-normal text-muted-foreground">(somente sua dupla e professor)</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            <div className="bg-secondary/50 rounded-xl p-3 text-xs text-muted-foreground flex items-center gap-2">
              <Lock size={12} /> Este relato fica <strong>visível somente para você, sua dupla e o professor</strong>.
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
                Nota: <span className="text-primary font-bold text-lg">{formatScore(score[0])}</span>/10,000
              </label>
              <Slider min={0} max={10} step={0.5} value={score} onValueChange={setScore} className="w-full" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>0,000</span><span>10,000</span></div>
            </div>
            <Button
              className="w-full"
              disabled={!comment.trim() || updatePairingMutation.isPending}
              onClick={handleSubmitEval}
            >
              {evalDialog && (evalDialog.role === 'therapist' ? evalDialog.pairing.therapist_submitted : evalDialog.pairing.patient_submitted) ? 'Salvar alterações' : 'Enviar Avaliação'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ContactLine({ contact, roleLabel }) {
  if (contact?.whatsapp) {
    return (
      <a
        href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-green-600 hover:underline"
      >
        <Phone size={11} /> {roleLabel}: {contact.whatsapp}
      </a>
    );
  }
  if (contact?.email) {
    return (
      <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
        <Mail size={11} /> {roleLabel}: {contact.email}
      </span>
    );
  }
  return <span className="mt-1 block text-[11px] text-muted-foreground">{roleLabel}: contato não informado</span>;
}

function PairingCard({ pairing, getStudentInfo, showScores, onDelete, onArchive, isDraft, swapSelectedId, onSwap, onModuleChange }) {
  const therapist = getStudentInfo(pairing.therapist_email);
  const patient = getStudentInfo(pairing.patient_email);
  const isSwapSelected = swapSelectedId === pairing.id;
  const isSwapPending = !!swapSelectedId && swapSelectedId !== pairing.id;
  return (
    <div className={`bg-card rounded-2xl border p-4 space-y-3 transition-colors ${isSwapSelected ? 'border-yellow-400 ring-2 ring-yellow-300' : isDraft ? 'border-dashed border-yellow-300' : 'border-border'}`}>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1">
          {therapist.photo
            ? <img src={therapist.photo} alt={therapist.name} className="w-9 h-9 rounded-full object-cover" />
            : <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: therapist.color || '#ec4899' }}>{therapist.avatarEmoji || therapist.name?.charAt(0)}</div>
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
            : <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: patient.color || '#3b82f6' }}>{patient.avatarEmoji || patient.name?.charAt(0)}</div>
          }
          <div>
            <p className="text-xs font-bold text-foreground">{patient.name}</p>
            <Badge className="text-[9px] bg-blue-100 text-blue-700 border-blue-200">Paciente</Badge>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isDraft && onSwap && (
            <button
              onClick={onSwap}
              className={`p-1.5 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1 ${isSwapSelected ? 'bg-yellow-400 text-white' : isSwapPending ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'text-muted-foreground hover:text-yellow-700 hover:bg-yellow-50'}`}
              title={isSwapSelected ? 'Cancelar seleção' : isSwapPending ? 'Trocar paciente com este par' : 'Selecionar para trocar paciente'}
            >
              <ArrowLeftRight size={13} />
              {isSwapSelected ? 'Selecionado' : isSwapPending ? 'Trocar aqui' : 'Trocar'}
            </button>
          )}
          {pairing.therapist_submitted ? <CheckCircle2 size={13} className="text-green-500" /> : <div className="w-3 h-3 rounded-full bg-orange-300" />}
          {pairing.patient_submitted ? <CheckCircle2 size={13} className="text-green-500" /> : <div className="w-3 h-3 rounded-full bg-orange-300" />}
          {onArchive && (
            <button onClick={onArchive} className="ml-1 p-1.5 text-muted-foreground hover:text-amber-600 rounded-lg transition-colors" title={pairing.is_archived ? 'Desarquivar' : 'Arquivar'}>
              <Archive size={13} />
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="ml-1 p-1.5 text-muted-foreground hover:text-destructive rounded-lg transition-colors" title="Excluir pareamento">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
      {showScores && onModuleChange && <div className="flex items-center gap-2 border-t border-border pt-3"><span className="text-xs font-semibold text-muted-foreground">Pontuação no</span><Select value={String(pairing.module_number || 1)} onValueChange={value => onModuleChange(Number(value))}><SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: 10 }, (_, index) => index + 1).map(module => <SelectItem key={module} value={String(module)}>Módulo {module}</SelectItem>)}</SelectContent></Select></div>}
      {showScores && (pairing.therapist_submitted || pairing.patient_submitted) && (
        <div className="border-t border-border pt-3 space-y-2">
          {pairing.therapist_submitted && (
            <div className="border border-pink-200 rounded-xl p-3 bg-transparent">
              <p className="text-xs font-bold text-pink-600 mb-1">Avaliação do Terapeuta → Paciente</p>
              <p className="text-xs text-foreground">{pairing.therapist_comment}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <Star size={11} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-bold">{formatScore(pairing.therapist_score)}/10,000</span>
              </div>
            </div>
          )}
          {pairing.patient_submitted && (
            <div className="border border-blue-200 rounded-xl p-3 bg-transparent">
              <p className="text-xs font-bold text-blue-600 mb-1">Avaliação do Paciente → Terapeuta</p>
              <p className="text-xs text-foreground">{pairing.patient_comment}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <Star size={11} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-bold">{formatScore(pairing.patient_score)}/10,000</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}