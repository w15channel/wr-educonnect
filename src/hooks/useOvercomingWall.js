import { useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { isLegacyMsnAction, isSinceOvercomingWallCutoff } from '@/lib/overcomingWall';
import { personalizeWallNotice } from '@/lib/wallPersonalization';

/**
 * Base única do Mural de Superação.
 * A dashboard do aluno e o chat (aluno/admin) consomem exatamente os mesmos
 * registros, com os mesmos ids — por isso as reações, respostas e o histórico
 * aparecem espelhados nos dois lugares.
 */
export default function useOvercomingWall({ course, session, enabled = true }) {
  const queryClient = useQueryClient();
  const activeCourse = course || 'tcc';
  const chatSessionId = `class_chat_${activeCourse}`;
  const on = enabled && !!activeCourse;

  const { data: accessCodes = [] } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 2000),
    enabled: on,
    staleTime: 5 * 60000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['overcoming-wall-messages', chatSessionId],
    queryFn: async () => {
      const res = await base44.functions.invoke('saveStudentRecord', { action: 'listChatMessages', session_id: chatSessionId });
      return res.data?.records || [];
    },
    refetchInterval: 15000,
    staleTime: 10000,
    enabled: on,
  });

  const { data: activityRecords } = useQuery({
    queryKey: ['overcoming-wall-activity', activeCourse],
    // Busca sequencial e enxuta: o mural mostra apenas as conquistas recentes,
    // então pedir milhares de registros de uma vez só deixava o site lento.
    queryFn: async () => {
      const lessonProgresses = await base44.entities.LessonProgress.list('-created_date', 400);
      const taskSubmissions = await base44.entities.TaskSubmission.list('-created_date', 300);
      const examSubmissions = await base44.entities.ExamSubmission.list('-submitted_at', 200);
      const challengeResponses = await base44.entities.DailyChallengeResponse.list('-created_date', 300);
      const forumPosts = await base44.entities.ForumPost.list('-created_date', 300);
      const pairings = await base44.entities.TherapistPairing.list('-updated_date', 200);
      const lessons = await base44.entities.RecordedLesson.list('-created_date', 500);
      const tasks = await base44.entities.Task.list('-created_date', 300);
      const exams = await base44.entities.Exam.list('-created_date', 300);
      return { lessonProgresses, taskSubmissions, examSubmissions, challengeResponses, forumPosts, pairings, lessons, tasks, exams };
    },
    staleTime: 5 * 60000,
    enabled: on,
  });

  const { data: savedAchievements = [] } = useQuery({
    queryKey: ['overcoming-wall-achievements', activeCourse],
    queryFn: () => base44.entities.Achievement.filter({ course: activeCourse }, '-occurred_at', 200),
    refetchInterval: 60000,
    staleTime: 30000,
    enabled: on,
  });

  const { data: institutionalRecords } = useQuery({
    queryKey: ['overcoming-wall-institutional', activeCourse],
    queryFn: async () => {
      const shared = await base44.entities.WallPublication.filter({ course: activeCourse }, '-published_at', 100);
      const notices = await base44.entities.Announcement.filter({ course: activeCourse }, '-created_date', 100);
      const liveSessions = await base44.entities.LiveSession.filter({ course: activeCourse }, '-scheduled_at', 100);
      const calendarEvents = await base44.entities.CalendarEvent.list('-date', 200);
      return { shared, notices, liveSessions, calendarEvents };
    },
    refetchInterval: 120000,
    staleTime: 60000,
    enabled: on,
  });

  const { data: reactions = [] } = useQuery({
    queryKey: ['overcoming-wall-reactions'],
    queryFn: () => base44.entities.AchievementReaction.list('-created_date', 1500),
    refetchInterval: 30000,
    staleTime: 15000,
    enabled: on,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['overcoming-wall-notifications', session?.email],
    queryFn: async () => {
      const records = await base44.entities.Notification.filter({ recipient_email: session.email }, '-created_date', 100);
      return records.filter((item) => item.type === 'wall_reaction' || item.type === 'wall_reply');
    },
    enabled: on && !!session?.email,
  });

  const { data: personalPosts = [] } = useQuery({
    queryKey: ['student-wall-posts', session?.email],
    queryFn: () => base44.entities.StudentWallPost.filter(
      { student_email: session.email.trim().toLowerCase() },
      '-published_at',
      30
    ),
    refetchInterval: 60000,
    enabled: on && session?.role !== 'admin' && !!session?.email,
  });

  const { data: readReceipts = [] } = useQuery({
    queryKey: ['overcoming-wall-reads', session?.email],
    queryFn: async () => {
      const response = await base44.functions.invoke('manageOvercomingWall', {
        action: 'listReads', actor_email: session?.email, access_code: session?.code, access_code_id: session?.codeId,
      });
      return response.data?.records || [];
    },
    enabled: on && session?.role !== 'admin' && !!session?.email && !!(session?.code || session?.codeId),
  });

  const { data: monitorHistory = [] } = useQuery({
    queryKey: ['overcoming-wall-monitors', activeCourse],
    queryFn: () => base44.entities.MonitorHistory.filter({ course: activeCourse }, '-period_start', 100),
    enabled: on,
  });

  // Tempo real: cada publicação nova no chat da turma entra no mural na hora.
  useEffect(() => {
    if (!on || session?.code || session?.codeId) return;
    return base44.entities.ChatMessage.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['overcoming-wall-messages', chatSessionId] });
    });
  }, [on, chatSessionId, queryClient, session?.code, session?.codeId]);

  const courseEmails = useMemo(
    () => new Set(accessCodes.filter((code) => code.student_email && (code.course === activeCourse || (activeCourse === 'tcc' && !code.course))).map((code) => code.student_email)),
    [accessCodes, activeCourse]
  );

  const getStudentName = (email) => {
    const code = accessCodes.find((item) => item.student_email === email);
    return code?.profile_name || code?.student_name || 'Um aluno da turma';
  };

  const achievementPosts = useMemo(() => {
    if (!activityRecords) return [];
    const lessonById = Object.fromEntries(activityRecords.lessons.map((item) => [item.id, item]));
    const taskById = Object.fromEntries(activityRecords.tasks.map((item) => [item.id, item]));
    const examById = Object.fromEntries(activityRecords.exams.map((item) => [item.id, item]));
    const make = (record, kind, content, occurredAt, email = record.student_email) => ({
      id: `achievement-${kind}-${record.id}`,
      feedType: 'achievement',
      studentEmail: email,
      studentName: getStudentName(email),
      mentionedEmails: [],
      content,
      occurredAt,
    });

    const persisted = savedAchievements.map((record) => ({
      id: record.id,
      feedType: 'achievement',
      studentEmail: record.student_email,
      studentName: getStudentName(record.student_email),
      mentionedEmails: record.mentioned_emails || [],
      isCollective: record.kind === 'monitor',
      kind: record.kind,
      content: record.message,
      occurredAt: record.occurred_at || record.created_date,
    }));

    return [
      ...persisted,
      ...activityRecords.lessonProgresses
        .filter((r) => r.watched && lessonById[r.lesson_id])
        .map((r) => make(r, 'lesson', `concluiu a aula “${lessonById[r.lesson_id].title}”.`, r.updated_date || r.created_date)),
      ...activityRecords.taskSubmissions
        .filter((r) => taskById[r.task_id])
        .map((r) => make(r, 'task', `respondeu a tarefa “${taskById[r.task_id].title}”.`, r.submitted_at || r.created_date)),
      ...activityRecords.examSubmissions
        .filter((r) => examById[r.exam_id])
        .map((r) => make(r, 'exam', `concluiu “${examById[r.exam_id].title}”.`, r.submitted_at || r.created_date)),
      ...activityRecords.challengeResponses
        .map((r) => make(r, 'challenge', 'venceu mais uma etapa da ofensiva diária.', r.updated_date || r.created_date || r.date)),
      ...activityRecords.forumPosts
        .filter((r) => r.author_role !== 'teacher')
        .map((r) => make(r, r.space === 'debates' ? 'debate' : 'forum', r.space === 'debates' ? 'participou da sala de debates.' : 'compartilhou conhecimento no fórum.', r.created_date, r.author_email)),
      ...activityRecords.pairings.flatMap((r) => [
        r.therapist_submitted && make({ ...r, id: `${r.id}-therapist` }, 'report', 'concluiu seu relato como terapeuta da semana.', r.updated_date || r.created_date, r.therapist_email),
        r.patient_submitted && make({ ...r, id: `${r.id}-patient` }, 'report', 'concluiu seu relato como paciente da semana.', r.updated_date || r.created_date, r.patient_email),
      ].filter(Boolean)),
    ]
      .filter((post) => courseEmails.has(post.studentEmail) && isSinceOvercomingWallCutoff(post.occurredAt))
      .filter((post, index, posts) => posts.findIndex((c) => c.studentEmail === post.studentEmail && c.content === post.content) === index);
  }, [activityRecords, savedAchievements, accessCodes, courseEmails]);

  const institutionalPosts = useMemo(() => {
    if (!institutionalRecords) return [];
    const now = Date.now();
    const upcomingLimit = now + 45 * 24 * 60 * 60 * 1000;
    const recentLimit = now - 45 * 24 * 60 * 60 * 1000;
    return [
      ...institutionalRecords.shared.map((item) => ({ ...item, feedType: 'institutional', icon: 'share', occurredAt: item.published_at || item.created_date })),
      ...institutionalRecords.notices
        .filter((item) => item.type !== 'unlock_rule' && !item.recipient_email && new Date(item.created_date).getTime() >= recentLimit)
        .map((item) => personalizeWallNotice(item, session?.email, getStudentName))
        .map((item) => ({ id: `notice-${item.id}`, feedType: 'institutional', icon: 'notice', title: item.title || 'Recado importante', content: item.content, occurredAt: item.created_date })),
      ...institutionalRecords.liveSessions
        .filter((item) => { const date = new Date(item.scheduled_at).getTime(); return date >= now && date <= upcomingLimit; })
        .map((item) => ({ id: `live-${item.id}`, feedType: 'institutional', icon: 'event', title: 'Próximo evento', content: `${item.title} • ${new Date(item.scheduled_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`, occurredAt: item.created_date || item.scheduled_at })),
      ...institutionalRecords.calendarEvents
        .filter((item) => {
          const rawDate = item.date || item.event_date;
          const date = rawDate ? new Date(`${rawDate}T${item.time || item.event_time || '12:00'}`).getTime() : 0;
          return date >= now && date <= upcomingLimit && (!item.student_email || item.student_email === session?.email);
        })
        .map((item) => ({ id: `calendar-${item.id}`, feedType: 'institutional', icon: 'event', title: 'Compromisso próximo', content: `${item.title} • ${new Date(`${item.date || item.event_date}T${item.time || item.event_time || '12:00'}`).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`, occurredAt: item.created_date || item.date || item.event_date })),
    ].filter((item, index, items) => item.content && items.findIndex((c) => c.id === item.id) === index);
  }, [institutionalRecords, session?.email, accessCodes]);

  // Feed único (mais recente primeiro) — a mesma lista nas duas telas.
  const feed = useMemo(() => [
    ...notifications.map((item) => ({ ...item, id: `notification-${item.id}`, feedType: 'notification', occurredAt: item.created_date })),
    ...personalPosts.map((item) => ({ ...item, id: `personal-${item.id}`, feedType: 'personal', occurredAt: item.published_at || item.created_date })),
    ...institutionalPosts,
    ...achievementPosts,
    ...messages.filter((message) => !isLegacyMsnAction(message)).map((message) => ({ ...message, feedType: 'encouragement', occurredAt: message.created_date || message.updated_date })),
  ].sort((a, b) => new Date(b.occurredAt || 0) - new Date(a.occurredAt || 0)), [notifications, personalPosts, institutionalPosts, achievementPosts, messages]);

  const sharedPublications = institutionalRecords?.shared || [];

  const reactMutation = useMutation({
    mutationFn: (payload) => base44.functions.invoke('manageOvercomingWall', { action: 'react', actor_email: session?.email, access_code: session?.code, access_code_id: session?.codeId, ...payload }),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['overcoming-wall-reactions'] });
      toast.success(response?.data?.duplicate ? 'Você já registrou esta reação.' : 'Sua reação foi enviada!');
    },
    onError: (error) => toast.error(error?.message || 'Não foi possível enviar sua reação.'),
  });

  const replyMutation = useMutation({
    mutationFn: (payload) => base44.functions.invoke('manageOvercomingWall', { action: 'reply', actor_email: session?.email, access_code: session?.code, access_code_id: session?.codeId, ...payload }),
    onSuccess: () => toast.success('Resposta enviada somente para a pessoa escolhida.'),
    onError: (error) => toast.error(error?.message || 'Não foi possível enviar a resposta.'),
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content) => base44.functions.invoke('saveStudentRecord', {
      action: 'create',
      entity: 'ChatMessage',
      data: {
        session_id: chatSessionId,
        author_name: session?.name || 'Aluno',
        author_email: session?.email || session?.code || '',
        content,
        is_hand_raised: false,
      },
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['overcoming-wall-messages', chatSessionId] }),
  });

  const refreshMessages = () => queryClient.invalidateQueries({ queryKey: ['overcoming-wall-messages', chatSessionId] });

  const markHighlightReadMutation = useMutation({
    mutationFn: (highlight_key) => base44.functions.invoke('manageOvercomingWall', {
      action: 'markRead', actor_email: session?.email, access_code: session?.code, access_code_id: session?.codeId, highlight_key,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['overcoming-wall-reads', session?.email] }),
    onError: (error) => toast.error(error?.message || 'Não foi possível marcar o lembrete como lido.'),
  });

  return {
    chatSessionId,
    accessCodes,
    messages,
    feed,
    reactions,
    sharedPublications,
    achievementPosts,
    readReceipts,
    monitorHistory,
    markHighlightReadMutation,
    reactMutation,
    replyMutation,
    sendMessageMutation,
    refreshMessages,
    getStudentName,
  };
}