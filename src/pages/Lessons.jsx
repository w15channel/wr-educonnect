import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Play, Plus, Trash2, ExternalLink, CheckCircle, Circle, MessageSquare, BookOpen, ChevronDown, ChevronUp, Pencil, Upload, Link, Clock, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbycd1dcbc1UTonX4c_-z9Xa4tpJpR7UE6h_uZjWBMXnOlxdKz89PZwaIfUUNwSxkPB3/exec';
const EMPTY_FORM = { title: '', description: '', video_url: '', duration: '', material_links: '' };

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
  const [uploadStatus, setUploadStatus] = useState({});
  const [uploadFile, setUploadFile] = useState({});

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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lessons'] }); setShowForm(false); setForm(EMPTY_FORM); toast.success('Aula criada!'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RecordedLesson.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lessons'] }); setShowForm(false); setEditingLesson(null); setForm(EMPTY_FORM); toast.success('Aula atualizada!'); },
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
    toast.success(!existing?.watched ? '✅ Aula marcada como assistida!' : 'Marcação removida.');
  };

  const saveComment = async (lessonId) => {
    await upsertProgress(lessonId, { comment: commentDraft[lessonId] || '' });
    toast.success('Comentário salvo!');
  };

  const saveSummary = async (lessonId) => {
    await upsertProgress(lessonId, { summary: summaryDraft[lessonId] || '' });
    toast.success('Resumo salvo!');
  };

  const handleFileUploadToGDrive = async (lessonId) => {
    const file = uploadFile[lessonId];
    if (!file) { toast.error('Selecione um arquivo primeiro'); return; }

    setUploadStatus(prev => ({ ...prev, [lessonId]: 'sending' }));
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target.result.split(',')[1];
      const params = new URLSearchParams();
      params.append('fileName', file.name);
      params.append('mimeType', file.type);
      params.append('fileData', base64Data);
      try {
        await fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: params, mode: 'no-cors' });
        setUploadStatus(prev => ({ ...prev, [lessonId]: 'success' }));
        setUploadFile(prev => ({ ...prev, [lessonId]: null }));
        toast.success('Trabalho enviado com sucesso!');
        setTimeout(() => setUploadStatus(prev => ({ ...prev, [lessonId]: null })), 5000);
      } catch (err) {
        setUploadStatus(prev => ({ ...prev, [lessonId]: 'error' }));
      }
    };
    reader.readAsDataURL(file);
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
    setForm({ title: lesson.title, description: lesson.description || '', video_url: lesson.video_url || '', duration: lesson.duration || '', material_links: lesson.material_links || '' });
    setShowForm(true);
  };

  const handleSave = () => {
    if (editingLesson) updateMutation.mutate({ id: editingLesson.id, data: form });
    else createMutation.mutate({ ...form, order: lessons.length + 1 });
  };

  return (
    <div className="p-4 lg:p-7 max-w-7xl mx-auto animate-fade-in-up">
      <div className="flex items-center justify-between mb-5 gap-3">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground">Videoaulas</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Assista às aulas no seu ritmo</p>
        </div>
        {isTeacher && (
          <Dialog open={showForm} onOpenChange={(v) => { setShowForm(v); if (!v) { setEditingLesson(null); setForm(EMPTY_FORM); } }}>
            <DialogTrigger asChild>
              <Button className="gap-2 h-9 text-sm"><Plus size={15} /> Nova Aula</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingLesson ? 'Editar Aula' : 'Adicionar Aula'}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <Input placeholder="Título da aula" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                <Textarea placeholder="Resumo da aula (visível para os alunos)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} />
                <Input placeholder="URL do vídeo (YouTube, Vimeo...)" value={form.video_url} onChange={e => setForm({...form, video_url: e.target.value})} />
                <Input placeholder="Duração (ex: 45 min)" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} />
                <Input placeholder="Links de materiais (separados por vírgula)" value={form.material_links} onChange={e => setForm({...form, material_links: e.target.value})} />
                <Button onClick={handleSave} disabled={!form.title} className="w-full">
                  {editingLesson ? 'Salvar Alterações' : 'Salvar Aula'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Progress bar */}
      {!isTeacher && lessons.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                <BookOpen size={16} className="text-purple-600" />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">Progresso no Curso</p>
                <p className="text-xs text-muted-foreground">{watchedCount} de {lessons.length} aulas assistidas</p>
              </div>
            </div>
            <span className="text-2xl font-black text-primary">{progressPct}%</span>
          </div>
          <div className="relative w-full bg-secondary rounded-full h-3 overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      {/* Video modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <div className="p-4 border-b border-border bg-card">
            <h3 className="font-bold text-foreground">{selectedVideo?.title}</h3>
          </div>
          {selectedVideo && (
            <div>
              {getEmbedUrl(selectedVideo.video_url) ? (
                <div className="aspect-video bg-black">
                  <iframe src={getEmbedUrl(selectedVideo.video_url)} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                </div>
              ) : (
                <div className="aspect-video bg-muted flex items-center justify-center flex-col gap-3">
                  <p className="text-muted-foreground text-sm">Vídeo não disponível para embed</p>
                  {selectedVideo.video_url && (
                    <a href={selectedVideo.video_url} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center gap-1 text-sm hover:underline">
                      <ExternalLink size={14} /> Abrir externamente
                    </a>
                  )}
                </div>
              )}
              {selectedVideo.description && (
                <div className="p-4 bg-card">
                  <p className="text-sm text-muted-foreground">{selectedVideo.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-card rounded-2xl border border-border animate-pulse h-20" />)}</div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Play size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold">Nenhuma aula gravada ainda</p>
          {isTeacher && <p className="text-sm mt-1">Clique em "Nova Aula" para adicionar</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson, idx) => {
            const prog = getProgress(lesson.id);
            const isExpanded = expandedLesson === lesson.id;
            const isWatched = prog?.watched;
            const status = uploadStatus[lesson.id];
            const materialLinks = lesson.material_links ? lesson.material_links.split(',').map(l => l.trim()).filter(Boolean) : [];

            return (
              <div key={lesson.id} className={`bg-card rounded-2xl border shadow-sm transition-all ${isWatched ? 'border-green-200' : 'border-border'}`}>
                {/* Header row */}
                <div className="flex items-center gap-3 p-3 sm:p-4">
                  {/* Thumbnail */}
                  <div
                    className="w-18 h-12 sm:w-24 sm:h-16 bg-muted rounded-xl overflow-hidden relative flex items-center justify-center shrink-0 cursor-pointer group"
                    style={{ minWidth: '4.5rem' }}
                    onClick={() => setSelectedVideo(lesson)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
                    <div className="relative w-8 h-8 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                      <Play size={14} className="text-primary ml-0.5" />
                    </div>
                    {lesson.duration && (
                      <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1 py-0.5 rounded">{lesson.duration}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground shrink-0">#{String(idx + 1).padStart(2, '0')}</span>
                      <h3 className="font-bold text-foreground text-sm leading-tight truncate">{lesson.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {isWatched && (
                        <span className="inline-flex items-center gap-1 text-green-600 text-[10px] bg-green-50 border border-green-100 px-2 py-0.5 rounded-full font-semibold">
                          <CheckCircle size={9} /> Assistida
                        </span>
                      )}
                      {lesson.duration && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock size={9} /> {lesson.duration}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isTeacher ? (
                      <>
                        <button onClick={() => openEdit(lesson)} className="text-muted-foreground hover:text-primary p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => deleteMutation.mutate(lesson.id)} className="text-muted-foreground hover:text-destructive p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => toggleWatched(lesson.id)}
                        title={isWatched ? 'Desmarcar' : 'Marcar como assistida'}
                        className={`p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl transition-colors ${isWatched ? 'text-green-600 bg-green-50' : 'text-muted-foreground hover:text-green-600 hover:bg-green-50'}`}
                      >
                        {isWatched ? <CheckCircle size={18} /> : <Circle size={18} />}
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedLesson(isExpanded ? null : lesson.id)}
                      className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center hover:bg-secondary rounded-xl transition-colors text-muted-foreground"
                    >
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </div>
                </div>

                {/* Description preview (always shown) */}
                {lesson.description && !isExpanded && (
                  <div className="px-4 pb-3">
                    <p className="text-xs text-muted-foreground line-clamp-2">{lesson.description}</p>
                  </div>
                )}

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {/* Description */}
                    {lesson.description && (
                      <div className="px-4 py-3 bg-secondary/20">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Resumo da Aula</p>
                        <p className="text-sm text-foreground/80">{lesson.description}</p>
                      </div>
                    )}

                    {/* Material links */}
                    {materialLinks.length > 0 && (
                      <div className="px-4 py-3 border-t border-border">
                        <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                          <FileDown size={13} className="text-primary" /> Materiais de Suporte
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {materialLinks.map((link, li) => (
                            <a key={li} href={link} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-primary bg-primary/8 border border-primary/15 px-3 py-1.5 rounded-lg hover:bg-primary/15 transition-colors font-medium">
                              <Link size={11} /> Material {li + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Student sections */}
                    {!isTeacher && (
                      <div className="px-4 pb-4 space-y-4 pt-3">
                        {/* Summary */}
                        <div>
                          <label className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                            <BookOpen size={12} className="text-primary" /> Meu Resumo
                          </label>
                          <Textarea
                            placeholder="Anote os principais pontos e aprendizados desta aula..."
                            value={summaryDraft[lesson.id] ?? prog?.summary ?? ''}
                            onChange={e => setSummaryDraft(prev => ({...prev, [lesson.id]: e.target.value}))}
                            rows={3}
                            className="text-sm"
                          />
                          <Button size="sm" variant="outline" className="mt-2 h-8 text-xs" onClick={() => saveSummary(lesson.id)}>
                            Salvar Resumo
                          </Button>
                          {prog?.summary && (
                            <div className="mt-2 bg-secondary/50 rounded-xl p-3">
                              <p className="text-[10px] text-muted-foreground font-semibold mb-1">Resumo salvo:</p>
                              <p className="text-xs text-foreground/80">{prog.summary}</p>
                            </div>
                          )}
                        </div>

                        {/* Comment */}
                        <div>
                          <label className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                            <MessageSquare size={12} className="text-accent" /> Meu Comentário
                          </label>
                          <Textarea
                            placeholder="Compartilhe sua percepção sobre esta aula..."
                            value={commentDraft[lesson.id] ?? prog?.comment ?? ''}
                            onChange={e => setCommentDraft(prev => ({...prev, [lesson.id]: e.target.value}))}
                            rows={2}
                            className="text-sm"
                          />
                          <Button size="sm" variant="outline" className="mt-2 h-8 text-xs" onClick={() => saveComment(lesson.id)}>
                            Salvar Comentário
                          </Button>
                          {prog?.comment && (
                            <div className="mt-2 bg-secondary/50 rounded-xl p-3">
                              <p className="text-[10px] text-muted-foreground font-semibold mb-1">Comentário salvo:</p>
                              <p className="text-xs text-foreground/80">{prog.comment}</p>
                            </div>
                          )}
                        </div>

                        {/* Upload activity */}
                        <div className="bg-secondary/30 rounded-xl p-4 border border-border">
                          <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                            <Upload size={12} className="text-orange-500" /> Enviar Atividade da Aula
                          </p>
                          <input
                            type="file"
                            onChange={e => setUploadFile(prev => ({ ...prev, [lesson.id]: e.target.files[0] }))}
                            className="w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90 cursor-pointer mb-3"
                          />
                          <Button
                            size="sm"
                            className="w-full h-9 text-xs gap-1.5"
                            disabled={!uploadFile[lesson.id] || status === 'sending'}
                            onClick={() => handleFileUploadToGDrive(lesson.id)}
                          >
                            <Upload size={13} />
                            {status === 'sending' ? 'Enviando, aguarde...' : 'Enviar Arquivo'}
                          </Button>
                          {status === 'sending' && <p className="text-xs text-muted-foreground text-center mt-2">Preparando o envio...</p>}
                          {status === 'success' && <p className="text-xs text-green-600 text-center mt-2 font-semibold">✅ Trabalho enviado com sucesso!</p>}
                          {status === 'error' && <p className="text-xs text-red-500 text-center mt-2">❌ Erro ao enviar. Tente novamente.</p>}
                        </div>
                      </div>
                    )}
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