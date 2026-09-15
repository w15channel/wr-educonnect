import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';
import { adminApi } from '@/lib/adminApi';
import { sortBySequence } from '@/lib/sequenceUtils';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';
import { Play, Plus, BookOpen, Video, FileText, Globe, GripVertical } from 'lucide-react';
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
import VideoPlayer from '@/components/video/VideoPlayer';
import { isTextLongEnough, insufficientTextMessage } from '@/lib/minTextLength';
import useApostilaModuleUnlocks from '@/hooks/useApostilaModuleUnlocks';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbycd1dcbc1UTonX4c_-z9Xa4tpJpR7UE6h_uZjWBMXnOlxdKz89PZwaIfUUNwSxkPB3/exec';
const EMPTY_FORM = { title: '', description: '', lesson_type: 'video_external', video_url: '', external_url: '', text_content: '', thumbnail_url: '', duration: '', material_links: '', research_links: '', module_type: 'apostila', module_number: '', apostila_chapter_id: '', apostila_lesson_id: '' };
const LESSONS_PER_MODULE = 5;
const MODULE_COUNT = 10;
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

const clampModuleNumber = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(1, Math.min(MODULE_COUNT, parsed));
};

const getLessonModuleNumber = (lesson, fallbackIndex = 0) => {
  const explicitModule = clampModuleNumber(lesson?.module_number);
  if (explicitModule) return explicitModule;
  return Math.min(MODULE_COUNT, Math.floor(fallbackIndex / LESSONS_PER_MODULE) + 1);
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
  const navigate = useNavigate();
  // Vindo do checklist com ?module=N, abre direto o módulo indicado.
  const targetModuleNumber = Number(new URLSearchParams(window.location.search).get('module')) || null;

  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [expandedLesson, setExpandedLesson] = useState(null);
  const [summaryDraft, setSummaryDraft] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const [uploadFile, setUploadFile] = useState({});
  const [showModuleEditor, setShowModuleEditor] = useState(false);
  const [moduleEditorState, setModuleEditorState] = useState([]);

  // A tela cheia (botão "Girar tela") e todos os demais controles agora ficam
  // dentro do <VideoPlayer>, que é o player integrado da plataforma.
  const handleVideoDialogChange = useCallback((open) => {
    if (!open) setSelectedVideo(null);
  }, []);

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
  // Liberação progressiva: um módulo só abre após todas as atividades do anterior
  // serem cumpridas e a prova daquele módulo ser finalizada.
  const { moduleUnlocked } = useApostilaModuleUnlocks(userCourse, session);

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['lessons', userCourse],
    queryFn: () => base44.entities.RecordedLesson.filter({ course: userCourse }, 'order', 200),
  });
  const { data: unlockRules = [] } = useQuery({
    queryKey: ['unlock-rules-lessons', userCourse],
    queryFn: () => base44.entities.Announcement.filter({ course: userCourse, type: 'unlock_rule' }, '-updated_date', 20),
  });

  const orderedLessons = sortBySequence(lessons).map((l, idx) => ({ ...l, displayOrder: idx + 1 }));
  const visibleLessons = isTeacher ? orderedLessons : orderedLessons.filter((lesson) => !lesson.is_hidden);
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
  const { data: lessonScores = [] } = useQuery({
    queryKey: ['lesson-score-feedback', studentIdentifiers.join('|')],
    queryFn: () => base44.entities.ScoreItem.filter({ student_email: session?.email || session?.code || '' }, '-updated_date', 500),
    enabled: !isTeacher && studentIdentifiers.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: (data) => adminApi.create('RecordedLesson', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lessons'] }); setShowForm(false); setForm(EMPTY_FORM); toast.success('Aula criada!'); },
    onError: (error) => toast.error(`Erro ao criar aula: ${error.message || 'tente novamente.'}`),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.update('RecordedLesson', id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lessons'] }); setShowForm(false); setEditingLesson(null); setForm(EMPTY_FORM); toast.success('Aula atualizada!'); },
    onError: (error) => toast.error(`Erro ao atualizar aula: ${error.message || 'tente novamente.'}`),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.delete('RecordedLesson', id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lessons'] }),
  });
  const toggleVisibilityMutation = useMutation({
    mutationFn: ({ id, isHidden }) => adminApi.update('RecordedLesson', id, { is_hidden: isHidden }),
    onMutate: async ({ id, isHidden }) => {
      await queryClient.cancelQueries({ queryKey: ['lessons'] });
      const snapshots = queryClient.getQueriesData({ queryKey: ['lessons'] });
      queryClient.setQueriesData({ queryKey: ['lessons'] }, (current = []) => current.map((lesson) => lesson.id === id ? { ...lesson, is_hidden: isHidden } : lesson));
      return { snapshots };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      toast.success('Visibilidade da aula atualizada.');
    },
    onError: (error, _variables, context) => {
      context?.snapshots?.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error(`Erro ao atualizar visibilidade: ${error.message || 'tente novamente.'}`);
    },
  });
  const updateUnlockMutation = useMutation({
    mutationFn: async (unlockUntil) => {
      const payload = { course: userCourse, type: 'unlock_rule', scope: 'lessons', title: `Unlock lessons ${userCourse}`, unlock_until: Number(unlockUntil) };
      if (lessonUnlockRule?.id) return adminApi.update('Announcement', lessonUnlockRule.id, payload);
      return adminApi.create('Announcement', payload);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['unlock-rules-lessons', userCourse] }); toast.success('Desbloqueio de aulas atualizado!'); },
  });
  const organizeModulesMutation = useMutation({
    mutationFn: async (draftModules) => {
      // `order` é uma sequência global porque o desbloqueio usa contagem linear de aulas.
      let nextOrder = 1;
      const updates = [];
      for (const module of draftModules) {
        for (const lesson of module.lessons) {
          const desiredModule = module.moduleNumber;
          const desiredOrder = nextOrder;
          nextOrder += 1;

          const currentModule = clampModuleNumber(lesson.module_number);
          const currentOrder = Number(lesson.order);
          if (currentModule === desiredModule && Number.isFinite(currentOrder) && currentOrder === desiredOrder) continue;

          updates.push(adminApi.update('RecordedLesson', lesson.id, { module_number: desiredModule, order: desiredOrder }));
        }
      }
      if (updates.length === 0) return 0;
      await Promise.all(updates);
      return updates.length;
    },
    onSuccess: (updatedCount) => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      setShowModuleEditor(false);
      setModuleEditorState([]);
      toast.success(updatedCount > 0 ? 'Módulos reorganizados com sucesso!' : 'Nenhuma alteração para salvar.');
    },
    onError: (error) => toast.error(`Erro ao reorganizar módulos: ${error.message || 'tente novamente.'}`),
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
      const summary = summaryDraft[lessonId] ?? existing?.summary ?? '';
      if (!isTextLongEnough(summary)) {
        toast.error(insufficientTextMessage(summary));
        return;
      }
      await upsertProgress(lessonId, { summary, watched: true });
      setCelebrating(true);
    } else {
      await upsertProgress(lessonId, { watched: false });
    }
    toast.success(!existing?.watched ? '✅ Aula concluída!' : 'Marcação removida.');
  };

  const saveSummary = async (lessonId) => {
    const value = summaryDraft[lessonId] || '';
    if (!isTextLongEnough(value)) { toast.error(insufficientTextMessage(value)); return; }
    await upsertProgress(lessonId, { summary: value });
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

  const buildLessonPayload = () => {
    // module_number é numérico no schema — nunca enviar string vazia (quebra a criação
    // para os tipos de módulo Tutorial, Tira-Dúvidas e Outros, que não usam módulo da apostila).
    const { module_number, apostila_chapter_id, apostila_lesson_id, ...rest } = form;
    const payload = { ...rest, course: userCourse };
    if (form.module_type === 'apostila' && module_number) {
      payload.module_number = Number(module_number);
      payload.apostila_chapter_id = apostila_chapter_id || '';
      payload.apostila_lesson_id = apostila_lesson_id || '';
    }
    return payload;
  };

  const handleSave = () => {
    if (editingLesson) updateMutation.mutate({ id: editingLesson.id, data: buildLessonPayload() });
    else createMutation.mutate({ ...buildLessonPayload(), order: lessons.length + 1 });
  };

  const handleCompleteModule = useCallback((moduleIndex) => {
    const key = moduleCompKey(session?.email || session?.code || 'guest', userCourse);
    const next = new Set(moduleCompletions);
    next.add(moduleIndex);
    setModuleCompletions(next);
    localStorage.setItem(key, JSON.stringify([...next]));
    setCelebrationModule({ index: moduleIndex });
  }, [moduleCompletions, session, userCourse]);

  const buildModuleDraftFromLessons = useCallback((sourceLessons) => {
    const grouped = Array.from({ length: MODULE_COUNT }, (_, index) => ({ moduleNumber: index + 1, lessons: [] }));
    sourceLessons.forEach((lesson, lessonIndex) => {
      const moduleNumber = getLessonModuleNumber(lesson, lessonIndex);
      grouped[moduleNumber - 1].lessons.push(lesson);
    });
    return grouped;
  }, []);

  const openModuleEditor = () => {
    setModuleEditorState(buildModuleDraftFromLessons(orderedLessons));
    setShowModuleEditor(true);
  };

  const handleModuleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceModuleNumber = Number(source.droppableId.replace('module-', ''));
    const destinationModuleNumber = Number(destination.droppableId.replace('module-', ''));
    if (!Number.isFinite(sourceModuleNumber) || !Number.isFinite(destinationModuleNumber)) return;

    setModuleEditorState((prev) => {
      const next = prev.map((module) => ({ ...module, lessons: [...module.lessons] }));
      const sourceBucket = next[sourceModuleNumber - 1];
      const destinationBucket = next[destinationModuleNumber - 1];
      if (!sourceBucket || !destinationBucket) return prev;

      const [movedLesson] = sourceBucket.lessons.splice(source.index, 1);
      if (!movedLesson) return prev;

      destinationBucket.lessons.splice(destination.index, 0, movedLesson);
      return next;
    });
  };

  const moduleGroups = useMemo(
    () => buildModuleDraftFromLessons(visibleLessons).filter((module) => module.lessons.length > 0),
    [buildModuleDraftFromLessons, visibleLessons]
  );
  const moduleEntries = useMemo(() => {
    const entries = [];
    let runningOffset = 0;
    moduleGroups.forEach((module) => {
      entries.push({
        moduleIndex: module.moduleNumber - 1,
        moduleNumber: module.moduleNumber,
        lessons: module.lessons,
        globalOffset: runningOffset,
      });
      runningOffset += module.lessons.length;
    });
    return entries;
  }, [moduleGroups]);

  const visibleLessonIds = new Set(visibleLessons.map((lesson) => lesson.id));
  const watchedCount = progresses.filter((p) => p.watched && visibleLessonIds.has(p.lesson_id) && (!isTeacher || studentIdentifiers.includes(normalizeStudentId(p.student_email)))).length;
  const progressPct = visibleLessons.length > 0 ? Math.round((watchedCount / visibleLessons.length) * 100) : 0;
  const isSaveButtonDisabled = !form.title || createMutation.isPending || updateMutation.isPending;

  return (
    <div className="app-page app-page--wide animate-fade-in-up">
      {/* Celebration overlay */}
      {celebrationModule !== null && (
        <ModuleCompletionCelebration
          module={celebrationModule}
          session={session}
          onClose={() => setCelebrationModule(null)}
        />
      )}
      {celebrating && <ParticipationCelebration session={session} achievement={{ kind: 'lesson', message: 'concluiu uma nova aula.' }} message="Aula concluída! Continue assim! 🎉" onClose={() => setCelebrating(false)} />}

      {/* Video modal — player integrado da plataforma */}
      <Dialog open={!!selectedVideo} onOpenChange={handleVideoDialogChange}>
        <DialogContent className="video-dialog max-w-4xl p-0 overflow-hidden">
          <div className="p-4 border-b border-border bg-card">
            <h3 className="font-bold text-foreground">{selectedVideo?.title}</h3>
          </div>
          {selectedVideo && (
            <VideoPlayer
              url={selectedVideo.video_url}
              title={selectedVideo.title}
              poster={selectedVideo.thumbnail_url || ''}
            />
          )}
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

            <Button variant="outline" className="h-9 text-sm" onClick={openModuleEditor}>
              Organizar módulos
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
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Capa da Aula (URL da imagem)</label>
                    {form.thumbnail_url && <img src={form.thumbnail_url} alt="Capa" className="w-full h-28 object-cover rounded-xl mb-2 border border-border" />}
                    <Input
                      placeholder="Cole aqui o link da imagem de capa (https://...)"
                      value={form.thumbnail_url}
                      onChange={e => setForm({ ...form, thumbnail_url: e.target.value })}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Não é mais necessário enviar arquivo: copie o endereço da imagem e cole aqui.</p>
                  </div>
                  <Input placeholder="Duração (ex: 45 min)" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} />
                  <Input placeholder="Links de materiais (separados por vírgula)" value={form.material_links} onChange={e => setForm({ ...form, material_links: e.target.value })} />
                  <Input placeholder='Links de pesquisa (Título|URL, separados por vírgula)' value={form.research_links} onChange={e => setForm({ ...form, research_links: e.target.value })} />
                  <Button onClick={handleSave} disabled={isSaveButtonDisabled} className="w-full">{editingLesson ? 'Salvar Alterações' : 'Salvar Aula'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {isTeacher && <p className="text-xs text-muted-foreground mb-3">Liberação automática por módulo, conforme as datas do calendário, preservando os acessos já concedidos.</p>}

      {/* Progress bar (student only) */}
      {!isTeacher && visibleLessons.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                <BookOpen size={16} className="text-purple-600" />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">Progresso Geral</p>
                <p className="text-xs text-muted-foreground">
                  {watchedCount}/{visibleLessons.length} aulas · {moduleCompletions.size}/10 módulos concluídos
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
      ) : visibleLessons.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Play size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold">{isTeacher ? 'Nenhuma aula gravada ainda' : 'Nenhuma aula disponível no momento'}</p>
          {isTeacher && <p className="text-sm mt-1">Clique em "Nova Aula" para adicionar</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {moduleEntries.map((moduleEntry) => (
            <ModuleBlock
              key={moduleEntry.moduleNumber}
              moduleIndex={moduleEntry.moduleIndex}
              lessons={moduleEntry.lessons}
              isTeacher={isTeacher}
              progresses={progresses}
              studentIdentifiers={studentIdentifiers}
              unlockedLessonCount={unlockedLessonCount}
              globalOffset={moduleEntry.globalOffset}
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
              onSaveSummary={saveSummary}
              onFileUpload={handleFileUploadToGDrive}
              onEdit={openEdit}
              onDelete={deleteMutation.mutate}
              onToggleVisibility={(lesson) => toggleVisibilityMutation.mutate({ id: lesson.id, isHidden: !lesson.is_hidden })}
              onViewProgress={(lesson) => navigate(`/adm/lessons/answer?lesson=${encodeURIComponent(lesson.id)}`)}
              lessonScores={lessonScores}
              moduleCompletions={moduleCompletions}
              onCompleteModule={handleCompleteModule}
              moduleLocked={!isTeacher && moduleUnlocked[moduleEntry.moduleIndex] === false}
              defaultOpen={targetModuleNumber === moduleEntry.moduleNumber}
            />
          ))}
        </div>
      )}

      <Dialog
        open={showModuleEditor}
        onOpenChange={(open) => {
          if (organizeModulesMutation.isPending) return;
          setShowModuleEditor(open);
          if (!open) setModuleEditorState([]);
        }}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Organizar módulos e ordem das aulas</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Arraste usando o botão com ícone para mover a aula entre módulos e ajustar a posição.
          </p>
          <DragDropContext onDragEnd={handleModuleDragEnd}>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 mt-2">
              {moduleEditorState.map((module) => (
                <div key={module.moduleNumber} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm">Módulo {module.moduleNumber}</p>
                    <span className="text-xs text-muted-foreground">{module.lessons.length} aula(s)</span>
                  </div>
                  <Droppable droppableId={`module-${module.moduleNumber}`}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-2 min-h-[84px] rounded-lg border border-dashed p-2 transition-colors ${snapshot.isDraggingOver ? 'border-primary bg-primary/5' : 'border-border/70'}`}
                      >
                        {module.lessons.map((lesson, lessonIndex) => (
                          <Draggable key={lesson.id} draggableId={String(lesson.id)} index={lessonIndex}>
                            {(draggableProvided, draggableSnapshot) => (
                              <div
                                ref={draggableProvided.innerRef}
                                {...draggableProvided.draggableProps}
                                className={`rounded-lg border bg-background p-2 text-xs ${draggableSnapshot.isDragging ? 'border-primary shadow-md' : 'border-border'}`}
                              >
                                <div className="flex items-start gap-2">
                                  <button
                                    type="button"
                                    className="mt-0.5 rounded p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                                    aria-label={`Arrastar aula ${lesson.title}`}
                                    {...draggableProvided.dragHandleProps}
                                  >
                                    <GripVertical size={14} />
                                  </button>
                                  <div className="min-w-0">
                                    <p className="font-medium text-foreground leading-tight">{lesson.title}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                      {lesson.module_type === 'apostila' ? 'Apostila' : 'Módulo customizado'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setShowModuleEditor(false);
                setModuleEditorState([]);
              }}
              disabled={organizeModulesMutation.isPending}
            >
              Cancelar
            </Button>
            <Button onClick={() => organizeModulesMutation.mutate(moduleEditorState)} disabled={organizeModulesMutation.isPending}>
              {organizeModulesMutation.isPending ? 'Salvando...' : 'Salvar organização'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}