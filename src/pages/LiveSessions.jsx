import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { adminApi } from '@/lib/adminApi';
import { sortBySequence } from '@/lib/sequenceUtils';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';
import { useDisplayNameResolver } from '@/hooks/useOvercomingWall';
import { Video, MessageSquare, Send, Plus, Youtube, Wifi, WifiOff, Trash2, ExternalLink, ChevronLeft, Clock, Calendar, CheckCircle, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';

const YT_CHANNEL = 'https://www.youtube.com/channel/UCO_BmZpsYnRHYoK0xZITEZw';
const WR_CHANNEL_ID = 'UCO_BmZpsYnRHYoK0xZITEZw';
const WR_LIVE_EMBED = `https://www.youtube.com/embed/live_stream?channel=${WR_CHANNEL_ID}&autoplay=1`;

const getEmbedUrl = (url) => {
  if (!url) return null;
  const ytWatch = url.match(/youtube\.com\/watch\?v=([^&\s]+)/);
  if (ytWatch) return `https://www.youtube.com/embed/${ytWatch[1]}?autoplay=1`;
  const ytShort = url.match(/youtu\.be\/([^?&\s]+)/);
  if (ytShort) return `https://www.youtube.com/embed/${ytShort[1]}?autoplay=1`;
  if (url.includes('youtube.com/embed')) return url;
  return null;
};

const EMOJIS = ['👍', '❤️', '😂', '🔥', '👏', '🎉', '🤔', '😮'];

export default function LiveSessions() {
  const { user: session } = useOutletContext();
  const isTeacher = session?.role === 'admin';
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [newMsg, setNewMsg] = useState('');
  const [attendanceConfirmed, setAttendanceConfirmed] = useState(false);
  const [attendanceTimer, setAttendanceTimer] = useState(1200);
  const chatEndRef = useRef(null);
  const { getDisplayName } = useDisplayNameResolver();
  const [form, setForm] = useState({
    title: '', description: '', stream_url: '', scheduled_at: '', status: 'scheduled', platform: 'youtube'
  });
  const { course: routeCourse } = useCourseFilteredEmails();
  const activeCourse = routeCourse || session?.course || 'tcc';

  const { data: sessions = [] } = useQuery({
    queryKey: ['live-sessions', activeCourse],
    queryFn: () => base44.entities.LiveSession.filter({ course: activeCourse }, '-scheduled_at', 50),
  });

  const { data: chatMessages = [] } = useQuery({
    queryKey: ['chat', selectedSession?.id],
    queryFn: () => base44.entities.ChatMessage.filter({ session_id: selectedSession?.id }, 'created_date', 200),
    enabled: !!selectedSession,
    refetchInterval: selectedSession?.status === 'live' ? 3000 : false,
  });

  const createSessionMutation = useMutation({
    mutationFn: (data) => adminApi.create('LiveSession', { ...data, course: activeCourse }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-sessions'] });
      setShowForm(false);
      setForm({ title: '', description: '', stream_url: '', scheduled_at: '', status: 'scheduled', platform: 'youtube' });
      toast.success('Sessão criada!');
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.update('LiveSession', id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['live-sessions'] });
      if (selectedSession && vars.id === selectedSession.id) {
        setSelectedSession(prev => ({ ...prev, ...vars.data }));
      }
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (id) => adminApi.delete('LiveSession', id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['live-sessions'] }); toast.success('Sessão removida.'); },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('saveStudentRecord', {
      action: 'create',
      entity: 'ChatMessage',
      data,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chat', selectedSession?.id] }),
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !selectedSession) return;
    sendMessageMutation.mutate({
      session_id: selectedSession.id,
      author_name: session?.name || 'Anônimo',
      author_email: session?.email || '',
      content: newMsg,
    });
    setNewMsg('');
  };

  const sendEmoji = (emoji) => {
    if (!selectedSession) return;
    sendMessageMutation.mutate({
      session_id: selectedSession.id,
      author_name: session?.name || 'Anônimo',
      author_email: session?.email || '',
      content: emoji,
    });
  };

  const handleRaiseHand = () => {
    sendMessageMutation.mutate({
      session_id: selectedSession.id,
      author_name: session?.name || 'Anônimo',
      author_email: session?.email || '',
      content: `✋ ${session?.name || 'Aluno'} pediu para falar!`,
      is_hand_raised: true,
    });
    toast.success('Mão levantada! O professor foi notificado.');
  };

  const toggleLiveStatus = (sess) => {
    const newStatus = sess.status === 'live' ? 'ended' : 'live';
    updateSessionMutation.mutate({ id: sess.id, data: { status: newStatus } });
    toast.success(newStatus === 'live' ? '🔴 Live ativada!' : '⭕ Live encerrada.');
  };

  const { data: myAttendances = [] } = useQuery({
    queryKey: ['my-attendances', session?.email],
    queryFn: () => base44.entities.LiveAttendance.filter({ student_email: session?.email || '' }, '-created_date', 100),
    enabled: !isTeacher && !!session?.email,
  });

  const confirmAttendanceMutation = useMutation({
    mutationFn: (sess) => base44.functions.invoke('saveStudentRecord', {
      action: 'create',
      entity: 'LiveAttendance',
      data: {
        session_id: sess.id,
        session_title: sess.title,
        student_email: session?.email || '',
        student_name: session?.name || '',
        confirmed_at: new Date().toISOString(),
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-attendances', session?.email] });
      setAttendanceConfirmed(true);
      toast.success('✅ Presença confirmada!');
    },
  });

  // ── Session room view ──
  if (selectedSession) {
    const sessionEmbed = getEmbedUrl(selectedSession.stream_url);
    const embedSrc = sessionEmbed || WR_LIVE_EMBED;
    const isLive = selectedSession.status === 'live';
    const alreadyAttended = myAttendances.some(a => a.session_id === selectedSession.id);

    return (
      <div className="flex flex-col flex-1 min-h-[calc(100dvh-140px)] md:min-h-[calc(100dvh-48px)] bg-background overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-card flex-wrap gap-y-1.5">
          <Button variant="ghost" size="sm" onClick={() => setSelectedSession(null)} className="shrink-0 h-8 px-2 gap-1 text-xs">
            <ChevronLeft size={14} /> Voltar
          </Button>
          <h2 className="text-sm font-bold text-foreground truncate flex-1 min-w-0">{selectedSession.title}</h2>
          <div className="flex items-center gap-2 shrink-0">
            {isLive && (
              <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 border border-red-200 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> AO VIVO
              </span>
            )}
            {isTeacher && (
              <Button
                size="sm"
                variant={isLive ? 'destructive' : 'default'}
                className="gap-1 text-xs h-8 px-2"
                onClick={() => toggleLiveStatus(selectedSession)}
              >
                {isLive ? <><WifiOff size={12} /> Encerrar</> : <><Wifi size={12} /> Ativar</>}
              </Button>
            )}
          </div>
        </div>

        {/* Layout: video top / chat bottom on mobile, side-by-side on desktop */}
        <div className="flex flex-col xl:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Stream */}
          <div className="flex flex-col bg-black relative flex-shrink-0 xl:flex-1 min-h-0">
            {/* 16:9 iframe */}
            <div className="w-full aspect-video xl:aspect-auto xl:flex-1" style={{ minHeight: 0 }}>
              <iframe
                src={embedSrc}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                title="Transmissão ao vivo"
              />
            </div>
            {/* Bottom bar of video */}
            <div className="bg-card border-t border-border flex items-center justify-between px-3 py-2 gap-2 flex-wrap">
              <a
                href={`${YT_CHANNEL}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 font-medium"
              >
                <Youtube size={13} /> Canal WR Mídia
                <ExternalLink size={11} className="opacity-50" />
              </a>
              {!isTeacher && !sessionEmbed && (
                <a href={selectedSession.stream_url || `${YT_CHANNEL}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <ExternalLink size={12} /> Abrir no navegador
                </a>
              )}
            </div>
          </div>

          {/* Chat */}
          <div className="w-full xl:w-[30rem] 2xl:w-[34rem] bg-white border-t xl:border-t-0 xl:border-l border-gray-200 flex flex-col h-[42dvh] min-h-[360px] md:h-[420px] xl:h-full xl:min-h-0">
            <div className="px-3 py-2.5 border-b border-gray-200 flex items-center gap-2 bg-gray-50">
              <MessageSquare size={14} className="text-primary" />
              <h3 className="font-bold text-sm text-foreground flex-1">Chat ao Vivo</h3>
              <span className="text-[10px] text-muted-foreground">{chatMessages.length} msgs</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-white">
              {chatMessages.length === 0 && (
                <p className="text-xs text-gray-400 text-center mt-6 px-2">
                  O chat está vazio. Seja o primeiro a enviar uma mensagem!
                </p>
              )}
              {chatMessages.map(msg => (
                <div key={msg.id} className={`text-sm ${msg.is_hand_raised ? 'bg-amber-50 p-2 rounded-xl border border-amber-200' : 'py-0.5'}`}>
                  <span className="font-bold text-xs text-gray-900">{getDisplayName(msg.author_email) || msg.author_name}: </span>
                  <span className="text-xs text-gray-800">{msg.content}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            {/* Attendance + Emojis + Hand */}
            <div className="px-2 py-1.5 border-t border-gray-200 bg-gray-50 space-y-1.5">
              {!isTeacher && isLive && !alreadyAttended && !attendanceConfirmed && (
                attendanceTimer > 0
                  ? <AttendanceWidget secondsLeft={attendanceTimer} onTick={setAttendanceTimer} onConfirm={() => confirmAttendanceMutation.mutate(selectedSession)} loading={confirmAttendanceMutation.isPending} />
                  : <span className="text-xs text-muted-foreground">Janela de presença encerrada</span>
              )}
              {!isTeacher && isLive && (alreadyAttended || attendanceConfirmed) && (
                <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-full w-fit">
                  <CheckCircle size={11} /> Presença confirmada
                </span>
              )}
              <div className="flex items-center gap-1 flex-wrap">
                {EMOJIS.map(emoji => (
                  <button key={emoji} onClick={() => sendEmoji(emoji)} className="text-base hover:scale-125 transition-transform p-0.5">
                    {emoji}
                  </button>
                ))}
                {!isTeacher && isLive && (
                  <button
                    onClick={handleRaiseHand}
                    title="Pedir para falar"
                    className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    ✋ Falar
                  </button>
                )}
              </div>
            </div>
            <form onSubmit={handleSend} className="p-2 border-t border-gray-200 bg-white flex gap-2">
              <input
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                placeholder="Digite no chat..."
                className="flex-1 h-9 text-xs px-3 rounded-md border border-gray-300 outline-none focus:ring-1 focus:ring-blue-400 text-gray-900 placeholder:text-gray-400 bg-white"
              />
              <Button type="submit" size="sm" className="h-9 w-9 p-0 shrink-0"><Send size={14} /></Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Sessions list ──
  const orderedSessions = sortBySequence(sessions);
  const liveNow = orderedSessions.filter(s => s.status === 'live');
  const upcoming = orderedSessions.filter(s => s.status === 'scheduled');
  const past = orderedSessions.filter(s => s.status === 'ended');

  return (
    <div className="app-page app-page--narrow space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground">Sala ao Vivo</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Participe das transmissões ao vivo</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`${YT_CHANNEL}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-red-500 border border-red-200 bg-red-50 px-3 py-2 rounded-xl hover:bg-red-100 transition-colors font-semibold"
          >
            <Youtube size={14} /> Canal WR Mídia
          </a>
          {isTeacher && (
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button className="gap-2 h-9"><Plus size={15} /> Nova Sessão</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Criar Sessão ao Vivo</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input placeholder="Título da sessão" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                  <Textarea placeholder="Descrição (opcional)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} />
                  <Select value={form.platform} onValueChange={v => setForm({...form, platform: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="youtube">YouTube Live</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="meet">Google Meet</SelectItem>
                      <SelectItem value="other">Outro Link</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder={form.platform === 'youtube' ? 'https://youtube.com/watch?v=...' : 'Cole o link da transmissão'}
                    value={form.stream_url}
                    onChange={e => setForm({...form, stream_url: e.target.value})}
                  />
                  <Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm({...form, scheduled_at: e.target.value})} />
                  <Button onClick={() => createSessionMutation.mutate(form)} disabled={!form.title || createSessionMutation.isPending} className="w-full">
                    Criar Sessão
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Live now */}
      {liveNow.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-red-600 flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Ao Vivo Agora
          </h3>
          <div className="space-y-3">
            {liveNow.map(sess => (
              <SessionCard key={sess.id} sess={sess} isTeacher={isTeacher} onEnter={setSelectedSession} onToggle={toggleLiveStatus} onDelete={deleteSessionMutation.mutate} />
            ))}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Calendar size={15} className="text-blue-500" /> Próximas Sessões
          </h3>
          <div className="space-y-3">
            {upcoming.map(sess => (
              <SessionCard key={sess.id} sess={sess} isTeacher={isTeacher} onEnter={setSelectedSession} onToggle={toggleLiveStatus} onDelete={deleteSessionMutation.mutate} />
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
            <Clock size={15} /> Sessões Anteriores
          </h3>
          <div className="space-y-2">
            {past.map(sess => (
              <SessionCard key={sess.id} sess={sess} isTeacher={isTeacher} onEnter={setSelectedSession} onToggle={toggleLiveStatus} onDelete={deleteSessionMutation.mutate} />
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Video size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold">Nenhuma sessão ao vivo agendada</p>
          {isTeacher && <p className="text-sm mt-1">Clique em "Nova Sessão" para criar uma transmissão</p>}
        </div>
      )}
    </div>
  );
}

function AttendanceWidget({ secondsLeft, onConfirm, loading, onTick }) {
  React.useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => onTick(secondsLeft - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  if (secondsLeft <= 0) return <span className="text-xs text-muted-foreground">Janela de presença encerrada</span>;
  return (
    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 flex-wrap">
      <UserCheck size={13} className="text-blue-600 shrink-0" />
      <span className="text-xs font-semibold text-blue-800">Confirmar presença</span>
      <span className="text-xs font-mono text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">{String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}</span>
      <Button size="sm" className="h-7 px-2.5 text-xs bg-blue-600 hover:bg-blue-700" onClick={onConfirm} disabled={loading}>
        Confirmar
      </Button>
    </div>
  );
}

function SessionCard({ sess, isTeacher, onEnter, onToggle, onDelete }) {
  const isLive = sess.status === 'live';
  const isFutureSession = sess.scheduled_at && new Date(sess.scheduled_at) > new Date();
  const isEnded = sess.status === 'ended' && !isFutureSession;

  return (
    <div className={`bg-card rounded-2xl border shadow-sm hover:shadow-md transition-all p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${isLive ? 'border-red-200' : 'border-border'}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative ${isLive ? 'bg-red-100' : isEnded ? 'bg-muted' : 'bg-blue-100'}`}>
        <Video size={18} className={isLive ? 'text-red-600' : isEnded ? 'text-muted-foreground' : 'text-blue-600'} />
        {isLive && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-card" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-foreground truncate">{sess.title}</p>
        {sess.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{sess.description}</p>}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {sess.scheduled_at && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock size={11} /> {format(new Date(sess.scheduled_at), 'dd/MM/yyyy HH:mm')}
            </span>
          )}
          <Badge className={`text-[10px] px-2 py-0.5 ${isLive ? 'bg-red-100 text-red-700 border-red-200' : isEnded ? 'bg-muted text-muted-foreground border-border' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
            {isLive ? '🔴 Ao Vivo' : isEnded ? 'Encerrada' : 'Agendada'}
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        {isTeacher && (
          <>
            <Button
              size="sm"
              variant={isLive ? 'destructive' : 'outline'}
              className="gap-1 text-xs h-8 px-2.5"
              onClick={(e) => { e.stopPropagation(); onToggle(sess); }}
            >
              {isLive ? <><WifiOff size={12} /> Encerrar</> : <><Wifi size={12} /> Ativar</>}
            </Button>
            <button onClick={() => onDelete(sess.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 size={14} />
            </button>
          </>
        )}
        <Button
          size="sm"
          className="h-8 px-3 gap-1 text-xs"
          onClick={() => {
            if (!isTeacher && !isLive) {
              if (sess.stream_url) {
                window.open(sess.stream_url, '_blank', 'noopener,noreferrer');
              } else {
                toast.info(
                  sess.scheduled_at
                    ? `Esta live ainda não começou. Programada para ${format(new Date(sess.scheduled_at), 'dd/MM/yyyy')} às ${format(new Date(sess.scheduled_at), 'HH:mm')}.`
                    : 'Esta live ainda não começou.'
                );
              }
              return;
            }
            onEnter(sess);
          }}
        >
          Entrar <Video size={12} />
        </Button>
      </div>
    </div>
  );
}