import React, { useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { adminApi } from '@/lib/adminApi';
import { sortBySequence } from '@/lib/sequenceUtils';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';
import { Play, Plus, Trash2, ExternalLink, BookOpen, Video, FileText, Globe } from 'lucide-react';
import LessonProgressPanel from '@/components/lessons/LessonProgressPanel';
import ModuleBlock from '@/components/lessons/ModuleBlock';
import ModuleCompletionCelebration from '@/components/lessons/ModuleCompletionCelebration';
import ParticipationCelebration from '@/components/shared/ParticipationCelebration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';
import { MOD1 } from '@/lib/apostila/mod1';
import { MOD2 } from '@/lib/apostila/mod2';
import { MOD3 } from '@/lib/apostila/mod3';
import { MOD4 } from '@/lib/apostila/mod4';
import { MOD5 } from '@/lib/apostila/mod5';
import { MOD6 } from '@/lib/apostila/mod6';
import { MOD7 } from '@/lib/apostila/mod7';
import { MOD8 } from '@/lib/apostila/mod8';
import { MOD9 } from '@/lib/apostila/mod9';
import { MOD10 } from '@/lib/apostila/mod10';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbycd1dcbc1UTonX4c_-z9Xa4tpJpR7UE6h_uZjWBMXnOlxdKz89PZwaIfUUNwSxkPB3/exec';
const EMPTY_FORM = { title: '', description: '', lesson_type: 'video_external', video_url: '', external_url: '', text_content: '', thumbnail_url: '', duration: '', material_links: '', research_links: '', module_type: 'apostila', module_number: '', apostila_chapter_id: '', apostila_lesson_id: '' };
const LESSONS_PER_MODULE = 5;
// localStorage key for completed modules per student+course
const moduleCompKey = (email, course) => `wr_mod_completions_${course}_${email}`;

const APOSTILA_CHAPTERS = [MOD1, MOD2, MOD3, MOD4, MOD5, MOD6, MOD7, MOD8, MOD9, MOD10];

const MODULE_TYPE_CONFIG = {
  apostila:     { label: 'Módulo da Apostila', desc: 'Vinculado a um dos 10 módulos da apostila' },
  tutorial:     { label: 'Tutorial', desc: 'Como usar a plataforma' },
  tira_duvidas: { label: 'Tira-Dúvidas', desc: 'Perguntas e respostas frequentes' },
  outros:       { label: 'Outros', desc: 'Demais conteúdos avulsos' },
};

const stripHtml = (html = '') => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const summarizeContent = (content = '', maxLen = 280) => {
  const plain = stripHtml(content);
  return plain.length > maxLen ? `${plain.slice(0, maxLen).trim()}…` : plain;
};

const LESSON_TYPE_CONFIG = {
  video_external:   { label: 'Vídeo Externo', icon: Video, color: 'text-purple-500', desc: 'YouTube, Vimeo, Instagram...' },
  text_written:     { label: 'Aula em Texto', icon: FileText, color: 'text-blue-500', desc: 'Escrita diretamente na plataforma' },
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
  const [viewProgressLesson, setViewProgressLesson] = useState(null);
  const [commentDraft, setCommentDraft] = useState({});
  const [summaryDraft, setSummaryDraft] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const [uploadFile, setUploadFile] = useState({});

  // Module completion state (persisted to localStorage)
  const [celebrationModule, setCelebrationModule] = useState(null); // { index, name }
  const [celebrating, setCelebrating] = useState(false);
  const [moduleCompletions, setModuleCompletions] = useState(() => {
    const key = moduleCompKey(session?.email || session?.code || 'guest', session?.course || 'tcc');
    try {
      const raw = localStorage.getItem(key);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  });

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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['unlock-rules-lessons', userCourse] }); toast.success('Desbloqueio de aulas atualizado!'); },
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
      const comment = commentDraft[lessonId] ?? existing?.comment ?? '';
      const summary = summaryDraft[lessonId] ?? existing?.summary ?? '';
      if (!comment.trim() || !summary.trim()) {
        toast.error('Preencha o Resumo e o Comentário da aula antes de confirmar presença.');
        return;
      }
      await upsertProgress(lessonId, { summary: summaryDraft[lessonId] ?? existing?.summary ?? '', comment: commentDraft[lessonId] ?? existing?.comment ?? '', watched: true });
      setCelebrating(true);
    } else {
      await upsertProgress(lessonId, { watched: false });
    }
    toast.success(!existing?.watched ? '✅ Aula concluída!' : 'Marcação removida.');
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
      params.append('fileName', file.name); params.append('mimeType', file.type); params.append('fileData', base64Data);
      try {
        await fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: params, mode: 'no-cors' });
        setUploadStatus(prev => ({ ...prev, [lessonId]: 'success' }));
        setUploadFile(prev => ({ ...prev, [lessonId]: null }));
        toast.success('Trabalho enviado!');
        setTimeout(() => setUploadStatus(prev => ({ ...prev, [lessonId]: null })), 5000);
      } catch { setUploadStatus(prev => ({ ...prev, [lessonId]: 'error' })); }
    };
    reader.readAsDataURL(file);
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
    setForm({ title: lesson.title, description: lesson.description || '', lesson_type: lesson.lesson_type || 'video_external', video_url: lesson.video_url || '', external_url: lesson.external_url || '', text_content: lesson.text_content || '', thumbnail_url: lesson.thumbnail_url || '', duration: lesson.duration || '', material_links: lesson.material_links || '', research_links: lesson.research_links || '', module_type: lesson.module_type || 'apostila', module_number: lesson.module_number || '', apostila_chapter_id: lesson.apostila_chapter_id || '', apostila_lesson_id: lesson.apostila_lesson_id || '' });
    setShowForm(true);
  };

  const handlePickApostilaLesson = (chapterId, lessonId) => {
    const chapter = APOSTILA_CHAPTERS.find((c) => c.id === chapterId);
    const apostilaLesson = chapter?.lessons.find((l) => l.id === lessonId);
    if (!chapter || !apostilaLesson) return;
    const chapterIndex = APOSTILA_CHAPTERS.findIndex((c) => c.id === chapterId);
    setForm((prev) => ({
      ...prev,
      title: apostilaLesson.title,
      description: summarizeContent(apostilaLesson.content),
      module_number: chapterIndex + 1,
      apostila_chapter_id: chapterId,
      apostila_lesson_id: lessonId,
    }));
  };

  const handleSave = () => {
    if (editingLesson) updateMutation.mutate({ id: editingLesson.id, data: { ...form, course: userCourse } });
    else createMutation.mutate({ ...form, course: userCourse, order: lessons.length + 1 });
  };

  const handleCompleteModule = useCallback((moduleIndex) => {
    const key = moduleCompKey(session?.email || session?.code || 'guest', userCourse);
    const next = new Set(moduleCompletions);
    next.add(moduleIndex);
    setModuleCompletions(next);
    localStorage.setItem(key, JSON.stringify([...next]));
    setCelebrationModule({ index: moduleIndex });
  }, [moduleCompletions, session, userCourse]);

  // Build modules: groups of LESSONS_PER_MODULE
  const modules = [];
  for (let i = 0; i < orderedLessons.length; i += LESSONS_PER_MODULE) {
    modules.push(orderedLessons.slice(i, i + LESSONS_PER_MODULE));
  }

  const watchedCount = progresses.filter(p => p.watched && (!isTeacher || studentIdentifiers.includes(normalizeStudentId(p.student_email)))).length;
  const progressPct = orderedLessons.length > 0 ? Math.round((watchedCount / orderedLessons.length) * 100) : 0;

  if (viewProgressLesson) {
    return <LessonProgressPanel lesson={viewProgressLesson} onBack={() => setViewProgressLesson(null)} />;
  }

  return (
    <div className="app-page app-page--wide animate-fade-in-up">
      {/* Celebration overlay */}
      {celebrationModule !== null && (
        <ModuleCompletionCelebration
          module={celebrationModule}
          onClose={() => setCelebrationModule(null)}
        />
      )}
      {celebrating && <ParticipationCelebration message="Aula concluída! Continue assim! 🎉" onClose={() => setCelebrating(false)} />}

      {/* Video modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <div className="p-4 border-b border-border bg-card">
            <h3 className="font-bold text-foreground">{selectedVideo?.title}</h3>
          </div>
          {selectedVideo && (() => {
            const embedUrl = (() => {
              const url = selectedVideo.video_url;
              if (!url) return null;
              try {
                const p = new URL(url.startsWith('http') ? url : `https://${url}`);
                const host = p.hostname.replace('www.', '').toLowerCase();
                if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be') {
                  let vid = '';
                  if (host === 'youtu.be') vid = p.pathname.split('/').filter(Boolean)[0] || '';
                  else if (p.pathname.startsWith('/watch')) vid = p.searchParams.get('v') || '';
                  else if (p.pathname.startsWith('/embed/')) vid = p.pathname.split('/embed/')[1]?.split('/')[0] || '';
                  else if (p.pathname.startsWith('/shorts/') || p.pathname.startsWith('/live/')) vid = p.pathname.split('/')[2] || '';
                  if (vid) return `https://www.youtube-nocookie.com/embed/${vid}?rel=0&modestbranding=1`;
                }
                if (host === 'vimeo.com' || host === 'player.vimeo.com') {
                  const id = p.pathname.split('/').find(x => /^\d+$/.test(x));
                  if (id) return `https://player.vimeo.com/video/${id}`;
                }
                return null;
              } catch { return null; }
            })();
            return (
              <div>
                {embedUrl ? (
                  <div className="aspect-video bg-black">
                    <iframe src={embedUrl} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" />
                  </div>
                ) : (
                  <div className="aspect-video bg-muted flex items-center justify-center flex-col gap-3">
                    <p className="text-muted-foreground text-sm">Vídeo não disponível para embed</p>
                    {selectedVideo.video_url && <a href={selectedVideo.video_url} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center gap-1 text-sm hover:underline"><ExternalLink size={14} /> Abrir externamente</a>}
                  </div>
                )}
                {selectedVideo.description && <div className="p-4 bg-card"><p className="text-sm text-muted-foreground">{selectedVideo.description}</p></div>}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-3">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground">Aulas de Terapia Comportamental</h2>
          <p className="text-muted-foreground text-sm mt-0.5">10 módulos · 50 aulas · Estude no seu ritmo</p>
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
                  <Input placeholder="Título da aula" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-2">Tipo de Aula</label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(LESSON_TYPE_CONFIG).map(([key, cfg]) => {
                        const Icon = cfg.icon;
                        return (
                          <button key={key} type="button" onClick={() => setForm({ ...form, lesson_type: key })}
                            className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-semibold transition-all ${form.lesson_type === key ? 'border-primary bg-primary/8 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'}`}>
                            <Icon size={16} className={cfg.color} /><span>{cfg.label}</span>
                            <span className="text-[9px] font-normal text-muted-foreground">{cfg.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <Textarea placeholder="Descrição/resumo da aula" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />

                  <div className="rounded-xl border border-border p-3 space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-2">Tipo de Módulo</label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(MODULE_TYPE_CONFIG).map(([key, cfg]) => (
                          <button key={key} type="button"
                            onClick={() => setForm(prev => ({ ...prev, module_type: key, ...(key !== 'apostila' ? { apostila_chapter_id: '', apostila_lesson_id: '' } : {}) }))}
                            className={`flex flex-col items-start p-2.5 rounded-xl border text-xs font-semibold transition-all ${form.module_type === key ? 'border-primary bg-primary/8 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'}`}>
                            <span>{cfg.label}</span>
                            <span className="text-[9px] font-normal text-muted-foreground">{cfg.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {form.module_type === 'apostila' && (
                      <>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Módulo da Apostila</label>
                          <Select value={form.module_number ? String(form.module_number) : ''} onValueChange={v => setForm(prev => ({ ...prev, module_number: Number(v) }))}>
                            <SelectTrigger><SelectValue placeholder="Selecione o módulo" /></SelectTrigger>
                            <SelectContent>
                              {APOSTILA_CHAPTERS.map((c, i) => (
                                <SelectItem key={c.id} value={String(i + 1)}>Módulo {i + 1} — {c.title.replace(/^Módulo \d+\s*—\s*/, '')}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Preencher a partir de uma aula da apostila (opcional)</label>
                          <Select
                            value={form.apostila_lesson_id ? `${form.apostila_chapter_id}::${form.apostila_lesson_id}` : ''}
                            onValueChange={(v) => { const [chId, lsId] = v.split('::'); handlePickApostilaLesson(chId, lsId); }}
                          >
                            <SelectTrigger><SelectValue placeholder="Selecione uma aula da apostila" /></SelectTrigger>
                            <SelectContent>
                              {APOSTILA_CHAPTERS.map((c) => (
                                c.lessons.map((l) => (
                                  <SelectItem key={l.id} value={`${c.id}::${l.id}`}>{l.title}</SelectItem>
                                ))
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-[10px] text-muted-foreground mt-1">Preenche automaticamente título e resumo com o conteúdo da apostila.</p>
                        </div>
                      </>
                    )}
                  </div>

                  {form.lesson_type === 'video_external' && <Input placeholder="URL do vídeo (YouTube, Vimeo...)" value={form.video_url} onChange={e => setForm({ ...form, video_url: e.target.value })} />}
                  {form.lesson_type === 'content_external' && <Input placeholder="URL do material externo" value={form.external_url} onChange={e => setForm({ ...form, external_url: e.target.value })} />}
                  {form.lesson_type === 'text_written' && <Textarea placeholder="Conteúdo da aula em texto..." value={form.text_content} onChange={e => setForm({ ...form, text_content: e.target.value })} rows={8} />}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Capa da Aula</label>
                    {form.thumbnail_url && <img src={form.thumbnail_url} alt="Capa" className="w-full h-28 object-cover rounded-xl mb-2 border border-border" />}
                    <input type="file" accept="image/*" onChange={e => handleCoverUpload(e.target.files[0])} className="w-full text-xs text-muted-foreground file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary file:text-primary-foreground hover:file:opacity-90 cursor-pointer" />
                    {coverUploading && <p className="text-xs text-muted-foreground mt-1">Enviando...</p>}
                  </div>
                  <Input placeholder="Duração (ex: 45 min)" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} />
                  <Input placeholder="Links de materiais (separados por vírgula)" value={form.material_links} onChange={e => setForm({ ...form, material_links: e.target.value })} />
                  <Input placeholder='Links de pesquisa (Título|URL, separados por vírgula)' value={form.research_links} onChange={e => setForm({ ...form, research_links: e.target.value })} />
                  <Button onClick={handleSave} disabled={!form.title} className="w-full">{editingLesson ? 'Salvar Alterações' : 'Salvar Aula'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {isTeacher && <p className="text-xs text-muted-foreground mb-3">Aulas liberadas para a turma: <strong>{unlockedLessonCount}</strong>.</p>}

      {/* Progress bar (student only) */}
      {!isTeacher && lessons.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                <BookOpen size={16} className="text-purple-600" />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">Progresso Geral</p>
                <p className="text-xs text-muted-foreground">
                  {watchedCount}/{orderedLessons.length} aulas · {moduleCompletions.size}/10 módulos concluídos
                </p>
              </div>
            </div>
            <span className="text-2xl font-black text-primary">{progressPct}%</span>
          </div>
          <div className="relative w-full bg-secondary rounded-full h-3 overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      {/* Module list */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="bg-card rounded-2xl border border-border animate-pulse h-20" />)}</div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Play size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold">Nenhuma aula gravada ainda</p>
          {isTeacher && <p className="text-sm mt-1">Clique em "Nova Aula" para adicionar</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map((moduleLessons, moduleIndex) => (
            <ModuleBlock
              key={moduleIndex}
              moduleIndex={moduleIndex}
              lessons={moduleLessons}
              isTeacher={isTeacher}
              progresses={progresses}
              studentIdentifiers={studentIdentifiers}
              unlockedLessonCount={unlockedLessonCount}
              globalOffset={moduleIndex * LESSONS_PER_MODULE}
              commentDraft={commentDraft}
              setCommentDraft={setCommentDraft}
              summaryDraft={summaryDraft}
              setSummaryDraft={setSummaryDraft}
              uploadStatus={uploadStatus}
              uploadFile={uploadFile}
              setUploadFile={setUploadFile}
              expandedLesson={expandedLesson}
              setExpandedLesson={setExpandedLesson}
              selectedVideo={selectedVideo}
              setSelectedVideo={setSelectedVideo}
              onToggleWatched={toggleWatched}
              onSaveComment={saveComment}
              onSaveSummary={saveSummary}
              onFileUpload={handleFileUploadToGDrive}
              onEdit={openEdit}
              onDelete={deleteMutation.mutate}
              onViewProgress={setViewProgressLesson}
              moduleCompletions={moduleCompletions}
              onCompleteModule={handleCompleteModule}
            />
          ))}
        </div>
      )}
    </div>
  );
}