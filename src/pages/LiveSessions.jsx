import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Video, MessageSquare, Send, Hand, Plus, ExternalLink, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function LiveSessions() {
  const { user } = useOutletContext();
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [newMsg, setNewMsg] = useState('');
  const chatEndRef = useRef(null);
  const [form, setForm] = useState({ title: '', description: '', stream_url: '', scheduled_at: '', status: 'scheduled' });

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
      setForm({ title: '', description: '', stream_url: '', scheduled_at: '', status: 'scheduled' });
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LiveSession.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['live-sessions'] }),
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
      author_name: user?.full_name || 'Anônimo',
      author_email: user?.email || '',
      content: newMsg,
    });
    setNewMsg('');
  };

  const handleRaiseHand = () => {
    sendMessageMutation.mutate({
      session_id: selectedSession.id,
      author_name: user?.full_name || 'Anônimo',
      author_email: user?.email || '',
      content: `✋ ${user?.full_name || 'Aluno'} levantou a mão!`,
      is_hand_raised: true,
    });
    toast.success('Mão levantada! O professor foi notificado.');
  };

  const statusColors = {
    scheduled: 'bg-yellow-100 text-yellow-700',
    live: 'bg-red-100 text-red-600',
    ended: 'bg-muted text-muted-foreground',
  };
  const statusLabels = { scheduled: 'Agendada', live: 'Ao Vivo', ended: 'Encerrada' };

  if (selectedSession) {
    return (
      <div className="p-4 lg:p-6 h-full flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="outline" size="sm" onClick={() => setSelectedSession(null)}>← Voltar</Button>
          <h2 className="text-lg font-bold text-foreground truncate">{selectedSession.title}</h2>
          <Badge className={statusColors[selectedSession.status]}>{statusLabels[selectedSession.status]}</Badge>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
          {/* Stream area */}
          <div className="flex-1 flex flex-col bg-foreground/5 rounded-2xl overflow-hidden border border-border min-h-[300px]">
            {selectedSession.status === 'live' && (
              <div className="absolute top-2 left-2 z-10 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> AO VIVO
              </div>
            )}
            {selectedSession.stream_url ? (
              <iframe
                src={selectedSession.stream_url}
                className="w-full flex-1"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Video size={48} className="opacity-30" />
                <p className="text-sm">Nenhum link de transmissão configurado</p>
                {selectedSession.stream_url === '' && (
                  <a href={selectedSession.stream_url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm flex items-center gap-1 hover:underline">
                    <ExternalLink size={14} /> Abrir link externo
                  </a>
                )}
              </div>
            )}

            {/* Controls */}
            <div className="h-14 bg-card border-t border-border flex items-center justify-between px-4">
              <span className="text-sm font-medium text-foreground truncate">{selectedSession.title}</span>
              <div className="flex gap-2">
                {!isTeacher && selectedSession.status === 'live' && (
                  <Button variant="outline" size="sm" className="gap-1.5 text-yellow-600 border-yellow-300 hover:bg-yellow-50" onClick={handleRaiseHand}>
                    <Hand size={16} /> Levantar Mão
                  </Button>
                )}
                {isTeacher && (
                  <>
                    {selectedSession.status === 'scheduled' && (
                      <Button size="sm" className="gap-1.5 bg-red-600 hover:bg-red-700" onClick={() => updateSessionMutation.mutate({ id: selectedSession.id, data: { status: 'live' } })}>
                        <Radio size={14} /> Iniciar Live
                      </Button>
                    )}
                    {selectedSession.status === 'live' && (
                      <Button size="sm" variant="destructive" onClick={() => updateSessionMutation.mutate({ id: selectedSession.id, data: { status: 'ended' } })}>
                        Encerrar Live
                      </Button>
                    )}
                  </>
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
              {chatMessages.map(msg => (
                <div key={msg.id} className={`text-sm ${msg.is_hand_raised ? 'bg-yellow-50 p-2 rounded-lg border border-yellow-200' : ''}`}>
                  <span className="font-semibold text-foreground mr-1.5">{msg.author_name}:</span>
                  <span className="text-muted-foreground">{msg.content}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSend} className="p-3 border-t border-border flex gap-2">
              <Input
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                placeholder="Digite no chat..."
                className="flex-1 h-9 text-sm"
              />
              <Button type="submit" size="sm" className="h-9 w-9 p-0 shrink-0">
                <Send size={16} />
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Sala ao Vivo</h2>
          <p className="text-muted-foreground text-sm mt-1">Participe das transmissões ao vivo</p>
        </div>
        {isTeacher && (
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus size={16} /> Nova Sessão</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar Sessão ao Vivo</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <Input placeholder="Título da sessão" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                <Textarea placeholder="Descrição" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                <Input placeholder="URL da transmissão (YouTube Live, etc.)" value={form.stream_url} onChange={e => setForm({...form, stream_url: e.target.value})} />
                <Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm({...form, scheduled_at: e.target.value})} />
                <Button onClick={() => createSessionMutation.mutate(form)} disabled={!form.title} className="w-full">
                  Criar Sessão
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Video size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Nenhuma sessão ao vivo agendada</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map(session => (
            <div
              key={session.id}
              onClick={() => setSelectedSession(session)}
              className="bg-card p-5 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${session.status === 'live' ? 'bg-red-100' : 'bg-secondary'}`}>
                  <Video size={22} className={session.status === 'live' ? 'text-red-600' : 'text-muted-foreground'} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{session.title}</h3>
                  {session.scheduled_at && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {format(new Date(session.scheduled_at), 'dd/MM/yyyy HH:mm')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={statusColors[session.status]}>{statusLabels[session.status]}</Badge>
                <Button variant="outline" size="sm">Entrar</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}