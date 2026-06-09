import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { adminApi } from '@/lib/adminApi';
import { sortBySequence } from '@/lib/sequenceUtils';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';
import { Play, Plus, Trash2, ExternalLink, CheckCircle, Circle, MessageSquare, BookOpen, ChevronDown, ChevronUp, Pencil, Link, Clock, FileDown, FileText, Globe, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbycd1dcbc1UTonX4c_-z9Xa4tpJpR7UE6h_uZjWBMXnOlxdKz89PZwaIfUUNwSxkPB3/exec';
const EMPTY_FORM = { title: '', description: '', lesson_type: 'video_external', video_url: '', external_url: '', text_content: '', thumbnail_url: '', duration: '', material_links: '', research_links: '' };

const LESSON_TYPE_CONFIG = {
  video_external: { label: 'Vídeo Externo', icon: Video, color: 'text-purple-500', desc: 'YouTube, Vimeo, Instagram...' },
  text_written: { label: 'Aula em Texto', icon: FileText, color: 'text-blue-500', desc: 'Escrita diretamente na plataforma' },
  content_external: { label: 'Material Externo', icon: Globe, color: 'text-green-500', desc: 'Link para artigo, site ou PDF externo' },
};

export default function Lessons() {
  const { user: session } = useOutletContext();
  const isTeacher = session?.role === 'admin';
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [coverUploading, setCoverUploading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [expandedLesson, setExpandedLesson] = useState(null);
  const [commentDraft, setCommentDraft] = useState({});
  const [summaryDraft, setSummaryDraft] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const [uploadFile, setUploadFile] = useState({});

  const { course: routeCourse } = useCourseFilteredEmails();
  const userCourse = routeCourse || session?.course || 'tcc';

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['lessons', userCourse],
    queryFn: () => base44.entities.RecordedLesson.filter({ course: userCourse }, 'order', 200),
  });
  const { data: unlockRules = [] } = useQuery({
    queryKey: ['unlock-rules-lessons', userCourse],
    queryFn: () => base44.entities.Announcement.filter({ course: userCourse, type: 'unlock_rule' }, '-updated_date', 20),
  });


  const orderedLessons = sortBySequence(lessons).map((l, idx) => ({ ...l, displayOrder: idx + 1 }));
  const lessonUnlockRule = unlockRules.find(r => r.scope === 'lessons');
  const unlockedLessonCount = Math.max(10, Number(lessonUnlockRule?.unlock_until || 10));

  const normalizeStudentId = (value = '') => String(value || '').trim().toLowerCase();
  const studentIdentifiers = [session?.email, session?.code].filter(Boolean).map(normalizeStudentId);

  const { data: progresses = [] } = useQuery({
    queryKey: ['lesson-progress', isTeacher ? 'all' : studentIdentifiers.join('|')],
    queryFn: async () => {
      const records = isTeacher
        ? await base44.entities.LessonProgress.list('-created_date', 3000)
        : await base44.entities.LessonProgress.list('-created_date', 1000);
      return isTeacher ? records : records.filter(p => studentIdentifiers.includes(normalizeStudentId(p.student_email)));
    },
    enabled: isTeacher || studentIdentifiers.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: (data) => adminApi.create('RecordedLesson', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lessons'] }); setShowForm(false); setForm(EMPTY_FORM); toast.success('Aula criada!'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.update('RecordedLesson', id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lessons'] }); setShowForm(false); setEditingLesson(null); setForm(EMPTY_FORM); toast.success('Aula atualizada!'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.delete('RecordedLesson', id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lessons'] }),
  });
  const updateUnlockMutation = useMutation({
    mutationFn: async (unlockUntil) => {
      const payload = { course: userCourse, type: 'unlock_rule', scope: 'lessons', title: `Unlock lessons ${userCourse}`, unlock_until: Number(unlockUntil) };
      if (lessonUnlockRule?.id) return adminApi.update('Announcement', lessonUnlockRule.id, payload);
      return adminApi.create('Announcement', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unlock-rules-lessons', userCourse] });
      toast.success('Desbloqueio de aulas atualizado!');
    },
  });

  const upsertProgress = async (lessonId, patch) => {
    await base44.functions.invoke('saveStudentRecord', {
      action: 'lessonProgressUpsert',
      lesson_id: lessonId,
      student_email: session?.email || session?.code || '',
      patch,
      student_identifiers: [session?.email, session?.code],
    });
    queryClient.invalidateQueries({ queryKey: ['lesson-progress'] });
  };

  const toggleWatched = async (lessonId) => {
    const existing = progresses.find(p => p.lesson_id === lessonId && studentIdentifiers.includes(normalizeStudentId(p.student_email)));
    if (!existing?.watched) {
      // Validação: precisa ter comentário e resumo para marcar como assistida
      const comment = commentDraft[lessonId] ?? existing?.comment ?? '';
      const summary = summaryDraft[lessonId] ?? existing?.summary ?? '';
      if (!comment.trim() || !summary.trim()) {
        toast.error('Preencha o Resumo e o Comentário da aula antes de confirmar presença.');
        return;
      }
    }
    if (!existing?.watched) {
      await upsertProgress(lessonId, {
        summary: summaryDraft[lessonId] ?? existing?.summary ?? '',
        comment: commentDraft[lessonId] ?? existing?.comment ?? '',
        watched: true,
      });
    } else {
      await upsertProgress(lessonId, { watched: false });
    }
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

  const getProgress = (lessonId) => progresses.find(p => p.lesson_id === lessonId && studentIdentifiers.includes(normalizeStudentId(p.student_email)));
  const getLessonProgressEntries = (lessonId) => progresses.filter(p => p.lesson_id === lessonId && (p.comment || p.summary || p.watched));

  const watchedCount = progresses.filter(p => p.watched && (!isTeacher || studentIdentifiers.includes(normalizeStudentId(p.student_email)))).length;
  const progressPct = orderedLessons.length > 0 ? Math.round((watchedCount / orderedLessons.length) * 100) : 0;

  // Abre link em nova aba do navegador (funciona em modo quiosque também)
  const openExternal = (url) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getEmbedUrl = (url) => {
    if (!url || typeof url !== 'string') return null;

    try {
      const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
      const host = parsedUrl.hostname.replace('www.', '').toLowerCase();

      if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be') {
        let videoId = '';

        if (host === 'youtu.be') {
          videoId = parsedUrl.pathname.split('/').filter(Boolean)[0] || '';
        } else if (parsedUrl.pathname.startsWith('/watch')) {
          videoId = parsedUrl.searchParams.get('v') || '';
        } else if (parsedUrl.pathname.startsWith('/embed/')) {
          videoId = parsedUrl.pathname.split('/embed/')[1]?.split('/')[0] || '';
        } else if (parsedUrl.pathname.startsWith('/shorts/') || parsedUrl.pathname.startsWith('/live/')) {
          videoId = parsedUrl.pathname.split('/')[2] || '';
        }

        if (videoId) {
          return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
        }
      }

      if (host === 'vimeo.com' || host === 'player.vimeo.com') {
        const vimeoId = parsedUrl.pathname.split('/').find(part => /^\d+$/.test(part));
        if (vimeoId) return `https://player.vimeo.com/video/${vimeoId}`;
      }

      if (parsedUrl.pathname.includes('/embed/')) return parsedUrl.toString();
      return null;
    } catch {
      return null;
    }
  };

  const handleCoverUpload = async (file) => {
    if (!file) return;
    setCoverUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, thumbnail_url: file_url }));
    setCoverUploading(false);
    toast.success('Capa carregada!');
  };

  const openEdit = (lesson) => {
    setEditingLesson(lesson);
    setForm({ title: lesson.title, description: lesson.description || '', lesson_type: lesson.lesson_type || 'video_external', video_url: lesson.video_url || '', external_url: lesson.external_url || '', text_content: lesson.text_content || '', thumbnail_url: lesson.thumbnail_url || '', duration: lesson.duration || '', material_links: lesson.material_links || '', research_links: lesson.research_links || '' });
    setShowForm(true);
  };

  const handleSave = () => {
    if (editingLesson) updateMutation.mutate({ id: editingLesson.id, data: { ...form, course: userCourse } });
    else createMutation.mutate({ ...form, course: userCourse, order: lessons.length + 1 });
  };

  return (
    <div className="app-page app-page--wide animate-fade-in-up">
      <div className="flex items-center justify-between mb-5 gap-3">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground">Aulas de Terapia Comportamental</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Assista, leia e estude Terapia Comportamental no seu ritmo</p>
        </div>
        {isTeacher && (
          <div className="flex gap-2">
            <Button variant="outline" className="h-9 text-sm" onClick={() => updateUnlockMutation.mutate(unlockedLessonCount + 1)} disabled={updateUnlockMutation.isPending}>
              Liberar próxima aula
            </Button>
            <Dialog open={showForm} onOpenChange={(v) => { setShowForm(v); if (!v) { setEditingLesson(null); setForm(EMPTY_FORM); } }}>
            <DialogTrigger asChild>
              <Button className="gap-2 h-9 text-sm"><Plus size={15} /> Nova Aula</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingLesson ? 'Editar Aula' : 'Nova Aula'}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <Input placeholder="Título da aula" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-2">Tipo de Aula</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(LESSON_TYPE_CONFIG).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm({...form, lesson_type: key})}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-semibold transition-all ${form.lesson_type === key ? 'border-primary bg-primary/8 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'}`}
                      >
                        <Icon size={16} className={cfg.color} />
                        <span>{cfg.label}</span>
                        <span className="text-[9px] font-normal text-muted-foreground">{cfg.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <Textarea placeholder="Descrição/resumo da aula" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} />
              {form.lesson_type === 'video_external' && (
                <Input placeholder="URL do vídeo (YouTube, Vimeo, Instagram...)" value={form.video_url} onChange={e => setForm({...form, video_url: e.target.value})} />
              )}
              {form.lesson_type === 'content_external' && (
                <Input placeholder="URL do material externo (artigo, PDF, site...)" value={form.external_url} onChange={e => setForm({...form, external_url: e.target.value})} />
              )}
              {form.lesson_type === 'text_written' && (
                <Textarea placeholder="Conteúdo da aula em texto (escreva aqui)..." value={form.text_content} onChange={e => setForm({...form, text_content: e.target.value})} rows={8} />
              )}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Capa da Aula (imagem)</label>
                {form.thumbnail_url && (
                  <img src={form.thumbnail_url} alt="Capa" className="w-full h-28 object-cover rounded-xl mb-2 border border-border" />
                )}
                <input type="file" accept="image/*" onChange={e => handleCoverUpload(e.target.files[0])} className="w-full text-xs text-muted-foreground file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary file:text-primary-foreground hover:file:opacity-90 cursor-pointer" />
                {coverUploading && <p className="text-xs text-muted-foreground mt-1">Enviando capa...</p>}
              </div>
              <Input placeholder="Duração (ex: 45 min)" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} />
              <Input placeholder="Links de materiais de apoio (separados por vírgula)" value={form.material_links} onChange={e => setForm({...form, material_links: e.target.value})} />
              <Input placeholder='Links de pesquisa (formato: Título|URL, separados por vírgula)' value={form.research_links} onChange={e => setForm({...form, research_links: e.target.value})} />
              <Button onClick={handleSave} disabled={!form.title} className="w-full">
                {editingLesson ? 'Salvar Alterações' : 'Salvar Aula'}
              </Button>
            </div>
            </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
      {isTeacher && <p className="text-xs text-muted-foreground mb-3">Aulas liberadas para a turma: <strong>{unlockedLessonCount}</strong>.</p>}

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
                <p className="text-xs text-muted-foreground">{watchedCount} de {orderedLessons.length} aulas assistidas</p>
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
                  <iframe
                    src={getEmbedUrl(selectedVideo.video_url)}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
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
          {orderedLessons.map((lesson, idx) => {
            const prog = getProgress(lesson.id);
            const isExpanded = expandedLesson === lesson.id;
            const isWatched = prog?.watched;
            const status = uploadStatus[lesson.id];
            const materialLinks = lesson.material_links ? lesson.material_links.split(',').map(l => l.trim()).filter(Boolean) : [];
            const isLocked = !isTeacher && (idx + 1) > unlockedLessonCount;

            if (isLocked) return (
              <div key={lesson.id} className="bg-card rounded-2xl border border-border shadow-sm opacity-60 select-none">
                <div className="flex items-center gap-3 p-3 sm:p-4">
                  <div className="w-12 h-9 sm:w-24 sm:h-16 bg-muted rounded-xl flex items-center justify-center shrink-0" style={{ minWidth: '3rem' }}>
                    <span className="text-xl">🔒</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground shrink-0">#{String(idx + 1).padStart(2, '0')}</span>
                      <h3 className="font-bold text-foreground text-sm leading-tight truncate">{lesson.title}</h3>
                    </div>
                    <p className="text-xs text-amber-600 font-semibold mt-1 flex items-center gap-1">⏳ Em breve — será liberado pelo professor</p>
                  </div>
                </div>
              </div>
            );

            return (
              <div key={lesson.id} className={`bg-card rounded-2xl border shadow-sm transition-all ${isWatched ? 'border-green-200' : 'border-border'}`}>
                {/* Header row */}
                <div className="flex items-center gap-3 p-3 sm:p-4">
                  {/* Thumbnail — only clickable/play for video type */}
                  <div
                    className={`w-12 h-9 sm:w-24 sm:h-16 bg-muted rounded-xl overflow-hidden relative flex items-center justify-center shrink-0 ${lesson.lesson_type === 'video_external' ? 'cursor-pointer group' : 'cursor-default'}`}
                    style={{ minWidth: '3rem' }}
                    onClick={() => lesson.lesson_type === 'video_external' && setSelectedVideo(lesson)}
                  >
                    {lesson.thumbnail_url ? (
                      <img src={lesson.thumbnail_url} alt={lesson.title} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
                    )}
                    {lesson.lesson_type === 'video_external' ? (
                      <div className="relative w-8 h-8 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md z-10">
                        <Play size={14} className="text-primary ml-0.5" />
                      </div>
                    ) : lesson.lesson_type === 'text_written' ? (
                      <div className="relative w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-md z-10">
                        <FileText size={14} className="text-blue-500" />
                      </div>
                    ) : (
                      <div className="relative w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-md z-10">
                        <Globe size={14} className="text-green-500" />
                      </div>
                    )}
                    {lesson.duration && (
                      <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1 py-0.5 rounded z-10">{lesson.duration}</span>
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
                       {lesson.lesson_type && lesson.lesson_type !== 'video_external' && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-secondary px-1.5 py-0.5 rounded-full">
                          {lesson.lesson_type === 'text_written' ? <FileText size={9} /> : <Globe size={9} />}
                          {LESSON_TYPE_CONFIG[lesson.lesson_type]?.label}
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
                      <>
                        {(() => {
                          const comment = commentDraft[lesson.id] ?? prog?.comment ?? '';
                          const summary = summaryDraft[lesson.id] ?? prog?.summary ?? '';
                          const canWatch = comment.trim() && summary.trim();
                          return (
                            <button
                              onClick={() => toggleWatched(lesson.id)}
                              title={isWatched ? 'Desmarcar presença' : canWatch ? 'Confirmar Presença' : 'Preencha resumo e comentário primeiro'}
                              disabled={!isWatched && !canWatch}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${isWatched ? 'text-green-600 bg-green-50 border border-green-200' : canWatch ? 'text-muted-foreground bg-secondary hover:text-green-600 hover:bg-green-50 hover:border-green-200 border border-transparent' : 'text-muted-foreground/40 bg-secondary/50 border border-transparent cursor-not-allowed'}`}
                            >
                              {isWatched ? <CheckCircle size={13} /> : <Circle size={13} />}
                              <span className="hidden sm:inline">{isWatched ? 'Presente' : canWatch ? 'Confirmar Presença' : '🔒 Presença'}</span>
                            </button>
                          );
                        })()}
                      </>
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

                    {/* Text content */}
                    {lesson.lesson_type === 'text_written' && lesson.text_content && (
                      <div className="px-4 py-3 border-t border-border">
                        <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                          <FileText size={13} className="text-blue-500" /> Conteúdo da Aula
                        </p>
                        <div className="bg-secondary/30 rounded-xl p-4 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                          {lesson.text_content}
                        </div>
                      </div>
                    )}

                    {/* External content link */}
                    {lesson.lesson_type === 'content_external' && lesson.external_url && (
                      <div className="px-4 py-3 border-t border-border">
                        <a href={lesson.external_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary bg-primary/8 border border-primary/15 px-4 py-3 rounded-xl hover:bg-primary/15 transition-colors font-semibold w-full">
                          <Globe size={15} /> Acessar Material Externo
                          <ExternalLink size={12} className="ml-auto" />
                        </a>
                      </div>
                    )}

                    {/* Research links */}
                    {lesson.research_links && (
                      <div className="px-4 py-3 border-t border-border">
                        <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                          <Globe size={13} className="text-green-500" /> Links de Pesquisa
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {lesson.research_links.split(',').map((item, li) => {
                            const parts = item.trim().split('|');
                            const label = parts.length > 1 ? parts[0].trim() : `Pesquisa ${li + 1}`;
                            const url = parts.length > 1 ? parts[1].trim() : parts[0].trim();
                            return (
                              <a key={li} href={url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors font-medium">
                                <Globe size={10} /> {label}
                              </a>
                            );
                          })}
                        </div>
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

                        {/* Watched button with lock indicator */}
                        {(() => {
                          const comment = commentDraft[lesson.id] ?? prog?.comment ?? '';
                          const summary = summaryDraft[lesson.id] ?? prog?.summary ?? '';
                          const canWatch = comment.trim() && summary.trim();
                          const isWatched = prog?.watched;
                          if (isWatched) return null;
                          return (
                            <div className={`rounded-xl p-3 border text-xs flex items-center gap-2 ${canWatch ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                              {canWatch ? (
                                <p className="text-green-700 font-semibold flex-1">✅ Resumo e comentário preenchidos! Você já pode confirmar presença.</p>
                              ) : (
                                <p className="text-amber-700 font-semibold flex-1">🔒 Preencha o <strong>Resumo</strong> e o <strong>Comentário</strong> acima para liberar a confirmação de presença.</p>
                              )}
                            </div>
                          );
                        })()}
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