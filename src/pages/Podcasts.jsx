import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { adminApi } from '@/lib/adminApi';
import {
  Headphones,
  Plus,
  Pencil,
  Trash2,
  Play,
  CheckCircle2,
  Radio,
  ExternalLink,
  Award,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import NotebookPodcastPlayer from '@/components/podcast/NotebookPodcastPlayer';
import useStudentRecords from '@/hooks/useStudentRecords';
import { pickAutoCorrectionResponse } from '@/lib/autoCorrectionResponses';
import ParticipationCelebration from '@/components/shared/ParticipationCelebration';

const EMPTY_FORM = {
  title: '',
  description: '',
  notebook_url: '',
  audio_url: '',
  module_number: '1',
  duration: '',
  hosts: 'Google NotebookLM · Deep Dive',
  order: 1,
};

export default function Podcasts() {
  const { user: session } = useOutletContext();
  const isTeacher = session?.role === 'admin';
  const userCourse = session?.course || 'tcc';
  const queryClient = useQueryClient();

  const [selectedModule, setSelectedModule] = useState('Todos');
  const [activePodcastId, setActivePodcastId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPodcast, setEditingPodcast] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [savingId, setSavingId] = useState(null);
  const [celebrationMsg, setCelebrationMsg] = useState('');

  const { data: podcasts = [], isLoading } = useQuery({
    queryKey: ['podcasts', userCourse],
    queryFn: () => base44.entities.Podcast.filter({ course: userCourse }, 'order', 200),
  });

  const { data: progresses = [] } = useStudentRecords('LessonProgress', session);
  const completedIds = useMemo(() => {
    const set = new Set();
    progresses.forEach((p) => {
      if (p.watched && String(p.lesson_id || '').startsWith('podcast:')) {
        set.add(String(p.lesson_id).replace('podcast:', ''));
      }
    });
    return set;
  }, [progresses]);

  const sortedPodcasts = useMemo(
    () =>
      [...podcasts]
        .filter((p) => isTeacher || p.is_published !== false)
        .sort((a, b) => (Number(a.module_number) || 1) - (Number(b.module_number) || 1) || (Number(a.order) || 0) - (Number(b.order) || 0)),
    [podcasts, isTeacher]
  );

  const filteredPodcasts = useMemo(
    () =>
      selectedModule === 'Todos'
        ? sortedPodcasts
        : sortedPodcasts.filter((p) => Number(p.module_number || 1) === Number(selectedModule)),
    [sortedPodcasts, selectedModule]
  );

  const currentPodcast = useMemo(
    () =>
      filteredPodcasts.find((p) => p.id === activePodcastId) ||
      sortedPodcasts.find((p) => p.id === activePodcastId) ||
      filteredPodcasts[0] ||
      sortedPodcasts[0] ||
      null,
    [filteredPodcasts, sortedPodcasts, activePodcastId]
  );

  const createMutation = useMutation({
    mutationFn: (data) => adminApi.create('Podcast', data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['podcasts'] });
      setShowForm(false);
      setEditingPodcast(null);
      setForm(EMPTY_FORM);
      if (created?.id) setActivePodcastId(created.id);
      toast.success('Episódio de podcast adicionado!');
    },
    onError: (err) => toast.error(err?.message || 'Não foi possível salvar o podcast.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.update('Podcast', id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcasts'] });
      setShowForm(false);
      setEditingPodcast(null);
      setForm(EMPTY_FORM);
      toast.success('Podcast atualizado!');
    },
    onError: (err) => toast.error(err?.message || 'Não foi possível atualizar o podcast.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.delete('Podcast', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcasts'] });
      toast.success('Podcast removido.');
    },
  });

  const handleOpenEdit = (podcast) => {
    setEditingPodcast(podcast);
    setForm({
      title: podcast.title || '',
      description: podcast.description || '',
      notebook_url: podcast.notebook_url || '',
      audio_url: podcast.audio_url || '',
      module_number: String(podcast.module_number || 1),
      duration: podcast.duration || '',
      hosts: podcast.hosts || 'Google NotebookLM · Deep Dive',
      order: Number(podcast.order) || 1,
    });
    setShowForm(true);
  };

  const handleSaveForm = () => {
    if (!form.title.trim() || !form.notebook_url.trim()) {
      toast.error('Informe o título e o link do Google NotebookLM.');
      return;
    }
    const payload = {
      ...form,
      course: userCourse,
      module_number: Number(form.module_number) || 1,
      order: Number(form.order) || 1,
      is_published: true,
    };
    if (editingPodcast) {
      updateMutation.mutate({ id: editingPodcast.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleMarkCompleted = async (podcast) => {
    if (!podcast?.id || savingId) return;
    setSavingId(podcast.id);
    try {
      const autoFeedback = pickAutoCorrectionResponse(`podcast:${podcast.id}`, 'participation');
      await base44.functions.invoke('saveStudentRecord', {
        action: 'lessonProgressUpsert',
        lesson_id: `podcast:${podcast.id}`,
        student_email: session?.email || session?.code || '',
        student_identifiers: [session?.email, session?.code].filter(Boolean),
        patch: {
          watched: true,
          comment: autoFeedback,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ['student-learning-records', 'LessonProgress'] });
      setCelebrationMsg(autoFeedback);
      toast.success('Episódio concluído e validado pela autocorreção!');
    } catch (err) {
      toast.error(err?.message || 'Não foi possível registrar a conclusão do episódio.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="app-page max-w-4xl mx-auto space-y-5 animate-fade-in-up">
      {celebrationMsg && (
        <ParticipationCelebration
          session={session}
          achievement={{ kind: 'lesson', message: 'concluiu um episódio do Podcast WR-EDU.' }}
          message={celebrationMsg}
          onClose={() => setCelebrationMsg('')}
        />
      )}

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shrink-0">
            <Headphones size={22} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
              Podcast WR · NotebookLM
            </h2>
            <p className="text-muted-foreground text-sm">
              Episódios em áudio gerados com Google NotebookLM para revisar e aprofundar cada módulo
            </p>
          </div>
        </div>

        {isTeacher && (
          <Dialog
            open={showForm}
            onOpenChange={(v) => {
              setShowForm(v);
              if (!v) {
                setEditingPodcast(null);
                setForm(EMPTY_FORM);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2 h-9 text-sm shrink-0">
                <Plus size={15} /> Novo Podcast (NotebookLM)
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingPodcast ? 'Editar Episódio de Podcast' : 'Adicionar Podcast do Google NotebookLM'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3.5 mt-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Título do Episódio *
                  </label>
                  <Input
                    placeholder="Ex: Episódio 01 — Fundamentos da Terapia Comportamental"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Link do Áudio Publicado no Google Drive *
                  </label>
                  <Input
                    placeholder="https://drive.google.com/file/d/.../view?usp=drivesdk"
                    value={form.notebook_url}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        notebook_url: e.target.value,
                        audio_url: e.target.value,
                      })
                    }
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Cole o link compartilhado do áudio no Google Drive (permissão: Qualquer pessoa com o link). O player WR encobre o Drive e reproduz o áudio diretamente.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Módulo
                    </label>
                    <Select
                      value={String(form.module_number)}
                      onValueChange={(v) => setForm({ ...form, module_number: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            Módulo {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Duração (opcional)
                    </label>
                    <Input
                      placeholder="Ex: 15:20"
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Resumo / Pauta do Episódio
                  </label>
                  <Textarea
                    rows={3}
                    placeholder="Principais tópicos discutidos no episódio..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <Button
                  onClick={handleSaveForm}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="w-full"
                >
                  {editingPodcast ? 'Salvar Alterações' : 'Publicar Podcast'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Player Exclusivo em Destaque */}
      {currentPodcast && (
        <NotebookPodcastPlayer
          podcast={currentPodcast}
          isCompleted={completedIds.has(currentPodcast.id)}
          onMarkCompleted={handleMarkCompleted}
          savingCompletion={savingId === currentPodcast.id}
        />
      )}

      {/* Filtro por Módulo */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {['Todos', ...Array.from({ length: 10 }, (_, i) => String(i + 1))].map((mod) => (
          <button
            key={mod}
            type="button"
            onClick={() => setSelectedModule(mod)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedModule === mod
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {mod === 'Todos' ? 'Todos os Módulos' : `Módulo ${mod}`}
          </button>
        ))}
      </div>

      {/* Lista de Episódios */}
      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filteredPodcasts.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-10 text-center space-y-2">
          <Headphones size={42} className="mx-auto text-muted-foreground/30" />
          <p className="text-base font-bold text-foreground">
            Nenhum episódio cadastrado neste filtro
          </p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {isTeacher
              ? 'Clique em "Novo Podcast (NotebookLM)" acima para colar o link do Google NotebookLM e disponibilizar o episódio no player exclusivo.'
              : 'Novos episódios do Google NotebookLM serão disponibilizados em breve.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredPodcasts.map((ep, idx) => {
            const isSelected = currentPodcast?.id === ep.id;
            const isDone = completedIds.has(ep.id);
            const autoFeedback = pickAutoCorrectionResponse(`podcast:${ep.id}`, 'participation');
            return (
              <div
                key={ep.id}
                onClick={() => setActivePodcastId(ep.id)}
                className={`rounded-2xl border p-4 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500/60 bg-indigo-500/5 shadow-md'
                    : isDone
                    ? 'border-green-300/60 bg-green-50/40 dark:border-green-600/30 dark:bg-green-950/15'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePodcastId(ep.id);
                    }}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs transition-colors ${
                      isSelected
                        ? 'bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow'
                        : isDone
                        ? 'bg-green-500 text-white'
                        : 'bg-secondary text-foreground'
                    }`}
                  >
                    {isDone ? <CheckCircle2 size={17} /> : <Play size={15} />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-foreground">{ep.title}</h4>
                      <Badge variant="secondary" className="text-[10px]">
                        Módulo {ep.module_number || 1}
                      </Badge>
                      {ep.duration && (
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {ep.duration}
                        </span>
                      )}
                      {isDone && (
                        <Badge className="text-[9px] bg-green-100 text-green-700 border-green-200">
                          ✓ Ouvido e Validado
                        </Badge>
                      )}
                    </div>

                    {ep.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {ep.description}
                      </p>
                    )}

                    {isDone && (
                      <p className="mt-2 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1 font-medium">
                        <Award size={12} className="shrink-0" /> {autoFeedback}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isTeacher && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(ep);
                          }}
                          className="p-2 rounded-lg text-muted-foreground hover:text-primary"
                          title="Editar episódio"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate(ep.id);
                          }}
                          className="p-2 rounded-lg text-muted-foreground hover:text-destructive"
                          title="Excluir episódio"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}