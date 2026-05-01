import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Video, MessageSquare, Send, Hand, Plus, ExternalLink, Radio, Youtube, Link, Wifi, WifiOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';

const YT_CHANNEL = 'https://www.youtube.com/@wrmidia';
// Channel ID do canal @wrmidia — necessário para o embed de live do canal
// Para encontrar: acesse youtube.com/@wrmidia → Sobre → Compartilhar canal → Copiar ID do canal
const WR_CHANNEL_ID = 'UCPlaceholder'; // ← substitua pelo Channel ID real (UCxxxxxxxx)
const WR_LIVE_EMBED = `https://www.youtube.com/embed/live_stream?channel=${WR_CHANNEL_ID}&autoplay=1`;

// Convert various live URLs to embeddable form
const getEmbedUrl = (url) => {
  if (!url) return null;
  // YouTube watch
  const ytWatch = url.match(/youtube\.com\/watch\?v=([^&\s]+)/);
  if (ytWatch) return `https://www.youtube.com/embed/${ytWatch[1]}?autoplay=1`;
  // YouTube short
  const ytShort = url.match(/youtu\.be\/([^?&\s]+)/);
  if (ytShort) return `https://www.youtube.com/embed/${ytShort[1]}?autoplay=1`;
  // YouTube live (already embed)
  if (url.includes('youtube.com/embed')) return url;
  // Zoom / Meet / Instagram / others — open in new tab (not embeddable)
  return null;
};

const isEmbeddable = (url) => !!getEmbedUrl(url);

const PLATFORM_ICONS = {
  youtube: { label: 'YouTube', color: 'text-red-500', bg: 'bg-red-50' },
  zoom: { label: 'Zoom', color: 'text-blue-500', bg: 'bg-blue-50' },
  meet: { label: 'Google Meet', color: 'text-green-500', bg: 'bg-green-50' },
  instagram: { label: 'Instagram', color: 'text-pink-500', bg: 'bg-pink-50' },
  other: { label: 'Link Externo', color: 'text-purple-500', bg: 'bg-purple-50' },
};

export default function LiveSessions() {
  const { user: session } = useOutletContext();
  const isTeacher = session?.role === 'admin';
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [newMsg, setNewMsg] = useState('');
  const chatEndRef = useRef(null);
  const [form, setForm] = useState({
    title: '', description: '', stream_url: '', scheduled_at: '', status: 'scheduled', platform: 'youtube'
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['live-sessions'],
    queryFn: () => base44.entities.LiveSession.list('-scheduled_at', 50),
  });

  const { data: chatMessages = [] } = useQuery({
    queryKey: ['chat', selectedSession?.id],
    queryFn: () => base44.entities.ChatMessage.filter({ session_id: selectedSession?.id }, 'created_date', 200),
    enabled: !!selectedSession,
    refetchInterval: selectedSession?.status === 'live' ? 3000 : false,
  });

  const createSessionMutation = useMutation({
    mutationFn: (data) => base44.entities.LiveSession.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-sessions'] });
      setShowForm(false);
      setForm({ title: '', description: '', stream_url: '', scheduled_at: '', status: 'scheduled', platform: 'youtube' });
      toast.success('Sessão criada!');
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LiveSession.update(id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['live-sessions'] });
      if (selectedSession && vars.id === selectedSession.id) {
        setSelectedSession(prev => ({ ...prev, ...vars.data }));
      }
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (id) => base44.entities.LiveSession.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-sessions'] });
      toast.success('Sessão removida.');
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.ChatMessage.create(data),
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

  const handleRaiseHand = () => {
    sendMessageMutation.mutate({
      session_id: selectedSession.id,
      author_name: session?.name || 'Anônimo',
      author_email: session?.email || '',
      content: `✋ ${session?.name || 'Aluno'} levantou a mão!`,
      is_hand_raised: true,
    });
    toast.success('Mão levantada! O professor foi notificado.');
  };

  const toggleLiveStatus = (sess) => {
    const newStatus = sess.status === 'live' ? 'ended' : 'live';
    updateSessionMutation.mutate({ id: sess.id, data: { status: newStatus } });
    toast.success(newStatus === 'live' ? '🔴 Live ativada! Alunos verão o indicador verde.' : '⭕ Live encerrada.');
  };

  const statusColors = {
    scheduled: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    live: 'bg-red-100 text-red-600 border-red-200',
    ended: 'bg-muted text-muted-foreground border-border',
  };
  const statusLabels = { scheduled: 'Agendada', live: '🔴 Ao Vivo', ended: 'Encerrada' };

  // ── Session detail view ──
  if (selectedSession) {
    // Prioridade: link específico da sessão (se for YouTube embeddable) → canal WR Mídia ao vivo
    const sessionEmbed = getEmbedUrl(selectedSession.stream_url);
    const embedSrc = sessionEmbed || WR_LIVE_EMBED;

    return (
      <div className="p-4 lg:p-6 h-full flex flex-col gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setSelectedSession(null)}>← Voltar</Button>
          <h2 className="text-lg font-bold text-foreground truncate flex-1">{selectedSession.title}</h2>
          <Badge className={statusColors[selectedSession.status]}>{statusLabels[selectedSession.status]}</Badge>
          {isTeacher && (
            <Button
              size="sm"
              variant={selectedSession.status === 'live' ? 'destructive' : 'default'}
              className="gap-1.5"
              onClick={() => toggleLiveStatus(selectedSession)}
            >
              {selectedSession.status === 'live' ? <><WifiOff size={14} /> Encerrar Live</> : <><Wifi size={14} /> Ativar Online</>}
            </Button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
          {/* Stream area — sempre exibe o canal WR Mídia (ou link específico da sessão) */}
          <div className="flex-1 flex flex-col bg-black rounded-2xl overflow-hidden border border-border min-h-[300px] relative">
            {selectedSession.status === 'live' && (
              <div className="absolute top-3 left-3 z-10 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> AO VIVO
              </div>
            )}

            <iframe
              src={embedSrc}
              className="w-full flex-1 min-h-[300px]"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
            />

            {/* Bottom bar */}
            <div className="bg-card border-t border-border flex items-center justify-between px-4 py-2.5 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <a href={`${YT_CHANNEL}/live`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-red-500 hover:underline shrink-0">
                  <Youtube size={14} /> Canal WR Mídia
                </a>
              </div>
              <div className="flex gap-2 shrink-0">
                {!isTeacher && selectedSession.status === 'live' && (
                  <Button variant="outline" size="sm" className="gap-1.5 text-yellow-600 border-yellow-300 hover:bg-yellow-50" onClick={handleRaiseHand}>
                    <Hand size={14} /> Levantar Mão
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="w-full lg:w-80 bg-card rounded-2xl border border-border flex flex-col h-[400px] lg:h-auto">
            <div className="p-3 border-b border-border bg-secondary/50 rounded-t-2xl">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <MessageSquare size={16} /> Chat ao Vivo
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatMessages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center mt-4">Seja o primeiro a enviar uma mensagem!</p>
              )}
              {chatMessages.map(msg => (
                <div key={msg.id} className={`text-sm ${msg.is_hand_raised ? 'bg-yellow-50 p-2 rounded-lg border border-yellow-200' : ''}`}>
                  <span className="font-semibold text-foreground mr-1.5">{msg.author_name}:</span>
                  <span className="text-muted-foreground">{msg.content}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSend} className="p-3 border-t border-border flex gap-2">
              <Input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Digite no chat..." className="flex-1 h-9 text-sm" />
              <Button type="submit" size="sm" className="h-9 w-9 p-0 shrink-0"><Send size={16} /></Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Sessions list ──
  const liveNow = sessions.filter(s => s.status === 'live');
  const upcoming = sessions.filter(s => s.status === 'scheduled');
  const past = sessions.filter(s => s.status === 'ended');

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Sala ao Vivo</h2>
          <p className="text-muted-foreground text-sm mt-1">Participe das transmissões ao vivo</p>
        </div>
        <div className="flex items-center gap-3">
          {/* YouTube channel link */}
          <a
            href={YT_CHANNEL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-red-500 border border-red-200 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors font-medium"
          >
            <Youtube size={16} /> Canal WR Mídia
          </a>
          {isTeacher && (
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus size={16} /> Nova Sessão</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Criar Sessão ao Vivo</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input placeholder="Título da sessão" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                  <Textarea placeholder="Descrição (opcional)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} />

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Plataforma de Transmissão</label>
                    <Select value={form.platform} onValueChange={v => setForm({...form, platform: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youtube">YouTube Live</SelectItem>
                        <SelectItem value="zoom">Zoom</SelectItem>
                        <SelectItem value="meet">Google Meet</SelectItem>
                        <SelectItem value="instagram">Instagram Live</SelectItem>
                        <SelectItem value="other">Outro Link</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                      Link da transmissão
                    </label>
                    <Input
                      placeholder={
                        form.platform === 'youtube' ? 'https://youtube.com/watch?v=...' :
                        form.platform === 'zoom' ? 'https://zoom.us/j/...' :
                        form.platform === 'meet' ? 'https://meet.google.com/...' :
                        'Cole o link da transmissão'
                      }
                      value={form.stream_url}
                      onChange={e => setForm({...form, stream_url: e.target.value})}
                    />
                    {form.platform === 'youtube' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Copie o link da live do seu canal: <a href={YT_CHANNEL} target="_blank" rel="noopener noreferrer" className="text-red-500 hover:underline">@wrmidia</a>
                      </p>
                    )}
                  </div>

                  <Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm({...form, scheduled_at: e.target.value})} />

                  <Button
                    onClick={() => createSessionMutation.mutate(form)}
                    disabled={!form.title || createSessionMutation.isPending}
                    className="w-full"
                  >
                    Criar Sessão
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* LIVE NOW banner */}
      {liveNow.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-red-600 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Ao Vivo Agora
          </h3>
          {liveNow.map(sess => (
            <SessionCard key={sess.id} sess={sess} isTeacher={isTeacher} statusColors={statusColors} statusLabels={statusLabels} onEnter={setSelectedSession} onToggle={toggleLiveStatus} onDelete={deleteSessionMutation.mutate} />
          ))}
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">Próximas Sessões</h3>
          {upcoming.map(sess => (
            <SessionCard key={sess.id} sess={sess} isTeacher={isTeacher} statusColors={statusColors} statusLabels={statusLabels} onEnter={setSelectedSession} onToggle={toggleLiveStatus} onDelete={deleteSessionMutation.mutate} />
          ))}
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-muted-foreground">Sessões Anteriores</h3>
          {past.map(sess => (
            <SessionCard key={sess.id} sess={sess} isTeacher={isTeacher} statusColors={statusColors} statusLabels={statusLabels} onEnter={setSelectedSession} onToggle={toggleLiveStatus} onDelete={deleteSessionMutation.mutate} />
          ))}
        </div>
      )}

      {sessions.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Video size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Nenhuma sessão ao vivo agendada</p>
          {isTeacher && <p className="text-sm mt-1">Clique em "Nova Sessão" para criar</p>}
        </div>
      )}
    </div>
  );
}

function SessionCard({ sess, isTeacher, statusColors, statusLabels, onEnter, onToggle, onDelete }) {
  const canEmbed = !!getEmbedUrl(sess.stream_url);
  const platform = sess.platform || (sess.stream_url?.includes('zoom') ? 'zoom' : sess.stream_url?.includes('meet') ? 'meet' : sess.stream_url?.includes('instagram') ? 'instagram' : 'youtube');
  const platformInfo = PLATFORM_ICONS[platform] || PLATFORM_ICONS.other;

  return (
    <div className={`bg-card p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${sess.status === 'live' ? 'border-red-200' : 'border-border'}`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${sess.status === 'live' ? 'bg-red-100' : 'bg-secondary'} relative`}>
          <Video size={22} className={sess.status === 'live' ? 'text-red-600' : 'text-muted-foreground'} />
          {sess.status === 'live' && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-card" />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{sess.title}</h3>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {sess.scheduled_at && (
              <p className="text-xs text-muted-foreground">{format(new Date(sess.scheduled_at), 'dd/MM/yyyy HH:mm')}</p>
            )}
            <span className={`text-xs px-1.5 py-0.5 rounded-md ${platformInfo.bg} ${platformInfo.color} font-medium`}>
              {platformInfo.label}
            </span>
            {sess.stream_url && !canEmbed && (
              <span className="text-xs text-muted-foreground">(link externo)</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        <Badge className={statusColors[sess.status]}>{statusLabels[sess.status]}</Badge>
        {isTeacher && (
          <>
            <Button
              size="sm"
              variant={sess.status === 'live' ? 'destructive' : 'outline'}
              className="gap-1.5 text-xs"
              onClick={(e) => { e.stopPropagation(); onToggle(sess); }}
            >
              {sess.status === 'live' ? <><WifiOff size={12} /> Encerrar</> : <><Wifi size={12} /> Ativar Online</>}
            </Button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(sess.id); }}
              className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </>
        )}
        <Button variant="outline" size="sm" onClick={() => onEnter(sess)}>Entrar</Button>
      </div>
    </div>
  );
}