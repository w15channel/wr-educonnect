import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Play, Clock, Plus, Trash2, ExternalLink, CheckCircle, Circle, MessageSquare, BookOpen, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { toast } from 'sonner';

const EMPTY_FORM = { title: '', description: '', video_url: '', duration: '' };

export default function Lessons() {
  const { user: session } = useOutletContext();
  const isTeacher = session?.role === 'admin';
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [expandedLesson, setExpandedLesson] = useState(null);
  const [commentDraft, setCommentDraft] = useState({});
  const [summaryDraft, setSummaryDraft] = useState({});

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['lessons'],
    queryFn: () => base44.entities.RecordedLesson.list('order', 100),
  });

  const { data: progresses = [] } = useQuery({
    queryKey: ['lesson-progress', session?.email],
    queryFn: () => base44.entities.LessonProgress.filter({ student_email: session?.email }, '-created_date', 200),
    enabled: !isTeacher && !!session?.email,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RecordedLesson.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      setShowForm(false);
      setForm(EMPTY_FORM);
      toast.success('Aula criada!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RecordedLesson.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      setShowForm(false);
      setEditingLesson(null);
      setForm(EMPTY_FORM);
      toast.success('Aula atualizada!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RecordedLesson.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lessons'] }),
  });

  const upsertProgress = async (lessonId, patch) => {
    const existing = progresses.find(p => p.lesson_id === lessonId);
    if (existing) {
      await base44.entities.LessonProgress.update(existing.id, patch);
    } else {
      await base44.entities.LessonProgress.create({ lesson_id: lessonId, student_email: session?.email, ...patch });
    }
    queryClient.invalidateQueries({ queryKey: ['lesson-progress', session?.email] });
  };

  const toggleWatched = async (lessonId) => {
    const existing = progresses.find(p => p.lesson_id === lessonId);
    await upsertProgress(lessonId, { watched: !existing?.watched });
    toast.success(!existing?.watched ? 'Aula marcada como assistida!' : 'Marcação removida.');
  };

  const saveComment = async (lessonId) => {
    await upsertProgress(lessonId, { comment: commentDraft[lessonId] || '' });
    toast.success('Comentário salvo!');
  };

  const saveSummary = async (lessonId) => {
    await upsertProgress(lessonId, { summary: summaryDraft[lessonId] || '' });
    toast.success('Resumo salvo!');
  };

  const getProgress = (lessonId) => progresses.find(p => p.lesson_id === lessonId);

  const watchedCount = progresses.filter(p => p.watched).length;
  const progressPct = lessons.length > 0 ? Math.round((watchedCount / lessons.length) * 100) : 0;

  const getEmbedUrl = (url) => {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return url;
  };

  const openEdit = (lesson) => {
    setEditingLesson(lesson);
    setForm({ title: lesson.title, description: lesson.description || '', video_url: lesson.video_url || '', duration: lesson.duration || '' });
    setShowForm(true);
  };

  const handleSave = () => {
    if (editingLesson) {
      updateMutation.mutate({ id: editingLesson.id, data: form });
    } else {
      createMutation.mutate({ ...form, order: lessons.length + 1 });
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-5 gap-3">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground">Aulas Gravadas</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Assista às aulas no seu ritmo</p>
        </div>
        {isTeacher && (
          <Dialog open={showForm} onOpenChange={(v) => { setShowForm(v); if (!v) { setEditingLesson(null); setForm(EMPTY_FORM); } }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus size={16} /> Nova Aula</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingLesson ? 'Editar Aula' : 'Adicionar Aula Gravada'}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <Input placeholder="Título da aula" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                <Textarea placeholder="Descrição" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                <Input placeholder="URL do vídeo (YouTube, Vimeo, etc.)" value={form.video_url} onChange={e => setForm({...form, video_url: e.target.value})} />
                <Input placeholder="Duração (ex: 45 min)" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} />
                <Button onClick={handleSave} disabled={!form.title} className="w-full">
                  {editingLesson ? 'Salvar Alterações' : 'Salvar Aula'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Student progress bar */}
      {!isTeacher && lessons.length > 0 && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-primary" />
              <span className="font-semibold text-sm text-foreground">Seu Progresso no Curso</span>
            </div>
            <span className="text-sm font-bold text-primary">{progressPct}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
            <div className="bg-primary h-3 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{watchedCount} de {lessons.length} aulas assistidas</p>
        </div>
      )}

      {/* Video Player Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>{selectedVideo?.title}</DialogTitle></DialogHeader>
          {selectedVideo && (
            <div className="mt-2">
              {getEmbedUrl(selectedVideo.video_url) ? (
                <div className="aspect-video rounded-xl overflow-hidden bg-black">
                  <iframe src={getEmbedUrl(selectedVideo.video_url)} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                </div>
              ) : (
                <div className="aspect-video rounded-xl bg-muted flex items-center justify-center flex-col gap-3">
                  <p className="text-muted-foreground">Vídeo não disponível para embed</p>
                  {selectedVideo.video_url && (
                    <a href={selectedVideo.video_url} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center gap-1 text-sm hover:underline">
                      <ExternalLink size={14} /> Abrir link externo
                    </a>
                  )}
                </div>
              )}
              {selectedVideo.description && <p className="text-muted-foreground mt-4 text-sm">{selectedVideo.description}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-card rounded-2xl border border-border animate-pulse h-20" />
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Play size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Nenhuma aula gravada ainda</p>
          {isTeacher && <p className="text-sm mt-1">Clique em "Nova Aula" para adicionar</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson, idx) => {
            const prog = getProgress(lesson.id);
            const isExpanded = expandedLesson === lesson.id;
            const isWatched = prog?.watched;

            return (
              <div key={lesson.id} className={`bg-card rounded-2xl border shadow-sm transition-all ${isWatched ? 'border-green-200' : 'border-border'}`}>
                <div className="flex items-center gap-3 p-3 sm:p-4">
                  {/* Thumbnail */}
                  <div
                    className="w-20 h-14 sm:w-24 sm:h-16 bg-foreground/5 rounded-xl overflow-hidden relative flex items-center justify-center shrink-0 cursor-pointer group"
                    onClick={() => setSelectedVideo(lesson)}
                  >
                    {lesson.thumbnail_url ? (
                      <img src={lesson.thumbnail_url} alt={lesson.title} className="w-full h-full object-cover" />
                    ) : (
                      <Play size={20} className="text-muted-foreground/40 group-hover:scale-110 transition-transform" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <div className="w-7 h-7 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={12} className="text-white ml-0.5" />
                      </div>
                    </div>
                    {lesson.duration && (
                      <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1 py-0.5 rounded">{lesson.duration}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground">#{idx + 1}</span>
                      <h3 className="font-semibold text-foreground text-sm leading-tight">{lesson.title}</h3>
                    </div>
                    {isWatched && <span className="inline-flex items-center gap-1 text-green-600 text-xs bg-green-50 px-2 py-0.5 rounded-full mt-1"><CheckCircle size={10} /> Assistida</span>}
                    {lesson.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 hidden sm:block">{lesson.description}</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isTeacher ? (
                      <>
                        <button onClick={() => openEdit(lesson)} className="text-muted-foreground hover:text-primary transition-colors p-2 min-w-[36px] min-h-[36px] flex items-center justify-center">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => deleteMutation.mutate(lesson.id)} className="text-muted-foreground hover:text-destructive transition-colors p-2 min-w-[36px] min-h-[36px] flex items-center justify-center">
                          <Trash2 size={14} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => toggleWatched(lesson.id)}
                        title={isWatched ? 'Desmarcar' : 'Marcar como assistida'}
                        className={`p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition-colors ${isWatched ? 'text-green-600 hover:bg-green-50' : 'text-muted-foreground hover:text-green-600 hover:bg-green-50'}`}
                      >
                        {isWatched ? <CheckCircle size={18} /> : <Circle size={18} />}
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedLesson(isExpanded ? null : lesson.id)}
                      className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center hover:bg-secondary rounded-lg transition-colors text-muted-foreground"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {!isTeacher && isExpanded && (
                  <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                        <MessageSquare size={13} className="text-primary" /> Meu Comentário sobre a Aula
                      </label>
                      <Textarea
                        placeholder="Escreva seu comentário ou percepção sobre esta aula..."
                        value={commentDraft[lesson.id] ?? prog?.comment ?? ''}
                        onChange={e => setCommentDraft(prev => ({...prev, [lesson.id]: e.target.value}))}
                        rows={2}
                        className="text-sm"
                      />
                      <Button size="sm" variant="outline" className="mt-2" onClick={() => saveComment(lesson.id)}>Salvar Comentário</Button>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                        <BookOpen size={13} className="text-primary" /> Meu Resumo da Aula
                      </label>
                      <Textarea
                        placeholder="Anote os principais pontos e aprendizados desta aula..."
                        value={summaryDraft[lesson.id] ?? prog?.summary ?? ''}
                        onChange={e => setSummaryDraft(prev => ({...prev, [lesson.id]: e.target.value}))}
                        rows={3}
                        className="text-sm"
                      />
                      <Button size="sm" variant="outline" className="mt-2" onClick={() => saveSummary(lesson.id)}>Salvar Resumo</Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}