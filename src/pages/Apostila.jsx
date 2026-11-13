import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { adminApi } from '@/lib/adminApi';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { useLocation } from 'react-router-dom';
import { BookOpen, ChevronDown, ChevronRight, Edit2, Save, X, GraduationCap, Award, FileText, CheckCircle, BookMarked, Type, AlignLeft, Play, Pause, Square, SkipBack, SkipForward, Volume2, Lock, Flame, Wand2 } from 'lucide-react';
import NextStepLink from '@/components/shared/NextStepLink';
import useApostilaModuleUnlocks from '@/hooks/useApostilaModuleUnlocks';
import useStudentRecords from '@/hooks/useStudentRecords';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import ParticipationCelebration from '@/components/shared/ParticipationCelebration';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ApostilaPrintModal from '@/components/apostila/ApostilaPrintModal';
import ChapterRewriteModal from '@/components/apostila/ChapterRewriteModal';
import { createBase44VoiceAudio, releaseBase44VoiceAudio } from '@/lib/base44Voice';
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

import courseWorkbookChapters from '@/components/courses/courseWorkbookChapters';
import { PORTAL_COURSES } from '@/components/courses/portalCourses';

const TCC_CHAPTERS = [MOD1, MOD2, MOD3, MOD4, MOD5, MOD6, MOD7, MOD8, MOD9, MOD10];
const APOSTILA_BOOK_TITLE = 'Apostila';

const APOSTILA_AUTHOR_EMAIL = 'apostila@wr-edu.local';
const INLINE_CONTENT_LIMIT = 6000;

const APOSTILA_HEADER_TITLE =
  'INTRODUÇÃO À TERAPIA COMPORTAMENTAL: O OLHAR QUE TRANSFORMA VIDAS';
const APOSTILA_HEADER_AUTHOR =
  'Prof. William Ribeiro | WR-EDU® | Instituto de Desenvolvimento Humano';

function normalizeApostilaHeader(content) {
  if (!content) return content;
  const idx = content.indexOf(APOSTILA_HEADER_AUTHOR);
  if (idx <= 0) return content;
  return APOSTILA_HEADER_TITLE + '\\n' + content.slice(idx);
}

function safeFilePart(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

async function uploadLessonContent(chapterId, lessonId, content) {
  const name = `apostila-${safeFilePart(chapterId)}-${safeFilePart(lessonId)}.txt`;
  const file = new File([content || ''], name, { type: 'text/plain;charset=utf-8' });
  const { file_url } = await base44.integrations.Core.UploadFile({ file });
  return file_url;
}

async function resolveStoredLesson(record) {
  if (!record?.content_url) return record;
  try {
    const response = await fetch(record.content_url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { ...record, content: await response.text() };
  } catch {
    return { ...record, content: record.content || '' };
  }
}

async function buildStoredContentPayload(chapterId, lessonId, content) {
  const lessonContent = content || '';
  if (lessonContent.length <= INLINE_CONTENT_LIMIT) {
    return { content: lessonContent, content_url: '', content_storage: 'inline' };
  }
  return { content: '', content_url: await uploadLessonContent(chapterId, lessonId, lessonContent), content_storage: 'file' };
}

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    [{ font: [] }, { size: ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'link'],
    ['clean'],
  ],
};

const quillFormats = [
  'header', 'font', 'size', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'align', 'list', 'bullet', 'blockquote', 'link',
];

const isHtmlContent = (value = '') => /<[^>]+>/.test(value);

const plainTextToHtml = (value = '') => value
  .split(/\\n{2,}/)
  .map((paragraph) => `<p>${paragraph.replace(/\\n/g, '<br>')}</p>`)
  .join('');

const getLessonHtml = (value = '') => (isHtmlContent(value) ? value : plainTextToHtml(value));

const extractLessonParagraphs = (html = '') => {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ').split(/\\n{2,}/).map((text) => text.trim()).filter(Boolean);
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const blocks = Array.from(doc.body.querySelectorAll('p, li, h1, h2, h3, h4, blockquote'));
  const paragraphs = (blocks.length ? blocks : Array.from(doc.body.childNodes))
    .map((node) => node.textContent?.replace(/\\s+/g, ' ').trim())
    .filter(Boolean);
  const fallback = doc.body.textContent?.replace(/\\s+/g, ' ').trim();
  return paragraphs.length ? paragraphs : (fallback ? [fallback] : []);
};

const READER_RATES = [1, 1.5, 2];
const READER_BLOCK_SIZE = 5;

const getWordParts = (text = '') => text.match(/\\S+|\\s+/g) || [];

function ReadingViewport({ paragraphs, activeParagraph, activeWord, isPlaying, nativeFallback, viewportRef }) {
  return (
    <div
      ref={viewportRef}
      className="apostila-reading-viewport apostila-content text-sm text-foreground/90 leading-relaxed font-sans"
      tabIndex={0}
      aria-label="Conteúdo da aula. Use a rolagem para continuar a leitura."
    >
      {paragraphs.map((paragraph, paragraphIndex) => {
        let wordIndex = -1;
        const isParaActive = paragraphIndex === activeParagraph;
        return (
          <p
            key={`${paragraphIndex}-${paragraph.slice(0, 18)}`}
            data-reader-paragraph={paragraphIndex}
            className={isParaActive ? 'rounded-lg bg-emerald-500/20 px-2 py-1 ring-1 ring-emerald-500/30 transition-all duration-300' : undefined}
            aria-current={isParaActive ? 'true' : undefined}
          >
            {getWordParts(paragraph).map((part, partIndex) => {
              if (/^\\s+$/.test(part)) return <React.Fragment key={partIndex}>{part}</React.Fragment>;
              wordIndex += 1;
              const isCurrentWord = nativeFallback && isParaActive && wordIndex === activeWord;
              return (
                <span
                  key={partIndex}
                  data-reader-word={isCurrentWord ? 'active' : undefined}
                  className={isCurrentWord ? `apostila-karaoke-word${isPlaying ? ' is-speaking' : ''}` : undefined}
                  aria-current={isCurrentWord ? 'true' : undefined}
                >
                  {part}
                </span>
              );
            })}
          </p>
        );
      })}
    </div>
  );
}

export default function Apostila() {
  const { session } = useCustomAuth();
  const course = session?.course || 'tcc';
  const courseInfo = PORTAL_COURSES.find(item => item.id === course);
  const APOSTILA_BOOK_ID = `apostila-${course}`;
  const DEFAULT_CHAPTERS = useMemo(() => course === 'tcc' ? TCC_CHAPTERS : courseWorkbookChapters(course), [course]);
  const isAdmin = session?.role === 'admin';
  const isDiplomaMode = useLocation().pathname.startsWith('/degree/student');
  const queryClient = useQueryClient();
  const { moduleUnlocked, isLoading: loadingUnlocks } = useApostilaModuleUnlocks(session?.course || 'tcc', session);

  const targetModuleNumber = Number(new URLSearchParams(window.location.search).get('module')) || null;
  const [openChapter, setOpenChapter] = useState(() => (targetModuleNumber ? DEFAULT_CHAPTERS[targetModuleNumber - 1]?.id ?? null : null));
  const [openLesson, setOpenLesson] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [printLesson, setPrintLesson] = useState(null);
  const [rewriteOpen, setRewriteOpen] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationMsg, setCelebrationMsg] = useState('');
  const [reader, setReader] = useState({ lessonKey: null, paragraphIndex: 0, wordIndex: 0, rate: 1, isPlaying: false, nativeFallback: false });
  const utteranceRef = useRef(null);
  const readerAudioRef = useRef(null);
  const readerRef = useRef(reader);
  const readerSessionRef = useRef(0);
  const intentionalStopRef = useRef(false);
  const readerViewportRefs = useRef(new Map());

  useEffect(() => { readerRef.current = reader; }, [reader]);

  useEffect(() => {
    if (!reader.isPlaying || !reader.lessonKey) return;
    const viewport = readerViewportRefs.current.get(reader.lessonKey);
    const activePart = viewport?.querySelector('[data-reader-word="active"]')
      || viewport?.querySelector(`[data-reader-paragraph="${reader.paragraphIndex}"]`);
    activePart?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  }, [reader.isPlaying, reader.lessonKey, reader.paragraphIndex, reader.wordIndex]);

  useEffect(() => () => {
    if (readerAudioRef.current) {
      readerAudioRef.current.pause();
      releaseBase44VoiceAudio(readerAudioRef.current);
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const { data: savedProgress = [], isLoading: loadingReadProgress, error: readProgressError, refetch: reloadReadProgress } = useQuery({
    queryKey: ['lesson-progress', session?.email],
    queryFn: async () => {
      if (!session?.email) return [];
      return base44.entities.LessonProgress.filter({ student_email: session.email }, '-created_date', 500);
    },
    enabled: !!session?.email,
  });

  const { data: savedLessons = [] } = useQuery({
    queryKey: ['apostila-lessons', APOSTILA_BOOK_ID],
    queryFn: async () => {
      const records = await adminApi.listBookChapters({ book_id: APOSTILA_BOOK_ID });
      return Promise.all(records.map(resolveStoredLesson));
    },
  });

  const savedLessonByKey = useMemo(() => {
    const map = new Map();
    savedLessons.forEach((item) => map.set(`${item.chapter_id}__${item.lesson_id}`, item));
    return map;
  }, [savedLessons]);

  const chapters = useMemo(() => DEFAULT_CHAPTERS.map((chapter) => ({
    ...chapter,
    lessons: chapter.lessons.map((lesson) => {
      const saved = savedLessonByKey.get(`${chapter.id}__${lesson.id}`);
      return saved ? { ...lesson, content: saved.content || lesson.content, savedRecord: saved } : lesson;
    }),
  })), [DEFAULT_CHAPTERS, savedLessonByKey]);

  const readLessons = useMemo(() => new Set(savedProgress.filter((item) => item.watched).map((item) => item.lesson_id)), [savedProgress]);
  const progressByLesson = useMemo(() => new Map(savedProgress.map((item) => [item.lesson_id, item])), [savedProgress]);
  const paragraphsByLesson = useMemo(() => {
    const map = {};
    chapters.forEach((chapter) => chapter.lessons.forEach((lesson) => {
      map[`${chapter.id}__${lesson.id}`] = extractLessonParagraphs(getLessonHtml(lesson.content || ''));
    }));
    return map;
  }, [chapters]);

  const saveProgressMutation = useMutation({
    mutationFn: async ({ lessonId, watched, comment, summary }) => {
      const existing = progressByLesson.get(lessonId);
      const payload = { lesson_id: lessonId, student_email: session.email, watched, comment, summary };
      if (existing) return base44.entities.LessonProgress.update(existing.id, payload);
      return base44.entities.LessonProgress.create(payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lesson-progress', session?.email] }),
  });

  const saveMutation = useMutation({
    mutationFn: async ({ chapterId, lessonId, content }) => {
      const chapterIndex = DEFAULT_CHAPTERS.findIndex((chapter) => chapter.id === chapterId);
      const chapter = DEFAULT_CHAPTERS[chapterIndex];
      const lessonIndex = chapter?.lessons.findIndex((lesson) => lesson.id === lessonId) ?? -1;
      const defaultLesson = lessonIndex >= 0 ? chapter.lessons[lessonIndex] : null;
      const existingLesson = savedLessonByKey.get(`${chapterId}__${lessonId}`);
      const storedContent = existingLesson?.content === content && existingLesson?.content_url
        ? { content: existingLesson.content_storage === 'file' ? '' : content, content_url: existingLesson.content_url, content_storage: existingLesson.content_storage }
        : await buildStoredContentPayload(chapterId, lessonId, content);
      const payload = {
        book_id: APOSTILA_BOOK_ID,
        course,
        book_title: APOSTILA_BOOK_TITLE,
        author_email: session?.email || APOSTILA_AUTHOR_EMAIL,
        chapter_id: chapterId,
        chapter_title: chapter?.title || '',
        lesson_id: lessonId,
        title: defaultLesson?.title || 'Aula da apostila',
        ...storedContent,
        order: (chapterIndex * 100) + (lessonIndex + 1),
      };
      if (existingLesson) return adminApi.updateBookChapter(existingLesson.id, payload);
      return adminApi.createBookChapter(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apostila-lessons', APOSTILA_BOOK_ID] });
      setEditingLesson(null);
      toast.success('Conteúdo salvo com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao salvar: ${error.message || 'tente novamente.'}`);
    },
  });

  const handleEditLesson = (chapterId, lessonId, content) => {
    setEditingLesson(`${chapterId}__${lessonId}`);
    setEditContent(getLessonHtml(content || ''));
  };

  const handleSaveLesson = (chapterId, lessonId) => {
    saveMutation.mutate({ chapterId, lessonId, content: editContent });
  };

  const handleRewriteSave = async ({ chapterId, lessonId, content, keepOpen = false }) => {
    await saveMutation.mutateAsync({ chapterId, lessonId, content });
    if (!keepOpen) setRewriteOpen(false);
  };

  const totalLessons = chapters.reduce((total, chapter) => total + chapter.lessons.length, 0);
  const totalRead = readLessons.size;

  return (
    <div className="app-page max-w-4xl mx-auto space-y-6 animate-fade-in-up pb-24">
      {celebrating && <ParticipationCelebration session={session} achievement={{ kind: 'book_lesson', message: 'concluiu uma aula na apostila.' }} message={celebrationMsg} onClose={() => setCelebrating(false)} />}
      {printLesson && <ApostilaPrintModal lesson={printLesson.lesson} chapterTitle={printLesson.chapterTitle} onClose={() => setPrintLesson(null)} />}
      {rewriteOpen && isAdmin && <ChapterRewriteModal chapters={chapters} courseTitle={course === 'tcc' ? null : courseInfo?.qualification} onClose={() => setRewriteOpen(false)} onSave={handleRewriteSave} saving={saveMutation.isPending} />}

      <div className="rounded-2xl bg-gradient-to-br from-emerald-900/40 to-teal-900/30 border border-emerald-500/20 p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shrink-0">
            <BookOpen size={26} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground">Apostila — {course === 'tcc' ? 'Formação em Terapia Comportamental' : courseInfo?.qualification}</h1>
            <p className="text-sm text-emerald-400 font-medium mt-1">Prof. William Ribeiro · Psicoterapeuta, Psicanalista e Sexólogo</p>
            <p className="text-xs text-muted-foreground mt-1">Coordenador do Instituto de Desenvolvimento Humano WR-EDU®</p>
            <div className="flex flex-wrap gap-3 mt-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full"><BookOpen size={12} className="text-emerald-400" />{totalLessons} aulas</div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full"><GraduationCap size={12} className="text-violet-400" />{chapters.length} módulos</div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full"><Award size={12} className="text-amber-400" />Formação Profissional</div>
              {!isAdmin && <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full"><BookMarked size={12} className="text-emerald-400" />{totalRead}/{totalLessons} lidas</div>}
            </div>
            {isAdmin && <div className="mt-3"><Button size="sm" onClick={() => setRewriteOpen(true)} className="gap-1.5 bg-gradient-to-r from-violet-500 to-purple-700 text-white hover:opacity-90"><Wand2 size={13} /> Reescrever capítulo</Button></div>}
          </div>
        </div>
        {course === 'tcc' && <div className="mt-5 pt-5 border-t border-emerald-500/15">
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Fundamentação teórica</p>
          <div className="flex flex-wrap gap-2">
            {['Donald Winnicott', 'Kurt Lewin', 'Heinz Kohut', 'George Engel', 'Viktor Frankl'].map((name) => <span key={name} className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">{name}</span>)}
          </div>
        </div>}
      </div>

      <div className="rounded-xl bg-card border border-border p-4">
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Objetivo Geral</h3>
        <p className="text-sm text-foreground leading-relaxed">{course === 'tcc' ? 'Formar terapeutas capazes de aplicar um modelo termodinâmico, vetorial e não-destrutivo da psique, aliviando dores e fornecendo ferramentas terapêuticas eficientes, integrando trade-off comportamental, algozes e modulação consciente com os principais referenciais teóricos.' : courseInfo?.description}</p>
      </div>

      {readProgressError && <div role="alert" className="rounded-xl border border-destructive p-3 text-sm text-destructive">Não foi possível carregar suas leituras. Isso não significa que foram perdidas. <button onClick={() => reloadReadProgress()} className="underline">Tentar novamente</button></div>}
      {loadingReadProgress && <p role="status" className="text-sm text-muted-foreground">Recuperando suas leituras salvas...</p>}

      <div className="space-y-3">
        {chapters.map((chapter, chapterIndex) => {
          const isChapterOpen = openChapter === chapter.id;
          const color = chapter.colorLight || 'text-emerald-400';
          const background = chapter.bgLight || 'bg-emerald-500/10';
          const isLocked = !isAdmin && (loadingUnlocks || !moduleUnlocked[chapterIndex]);
          return (
            <div key={chapter.id} className={`rounded-2xl border border-border bg-card overflow-hidden ${isLocked ? 'opacity-60' : ''}`}>
              <button
                onClick={() => {
                  if (isLocked) { toast.info(loadingUnlocks ? 'Carregando liberações...' : 'Este módulo será liberado automaticamente na data prevista no calendário.'); return; }
                  if (reader.lessonKey) stopReader();
                  setOpenChapter(isChapterOpen ? null : chapter.id);
                }}
                className={`w-full flex items-center justify-between p-5 transition-colors text-left ${isLocked ? 'cursor-not-allowed' : 'hover:bg-secondary/50'}`}
              >
                <span className="font-semibold text-foreground">{chapter.title}</span>
                {isChapterOpen ? <ChevronDown size={18} className="text-muted-foreground" /> : <ChevronRight size={18} className="text-muted-foreground" />}
              </button>
              {isChapterOpen && (
                <div className="border-t border-border divide-y divide-border/60">
                  {chapter.lessons.map((lesson) => {
                    const lessonKey = `${chapter.id}__${lesson.id}`;
                    const isOpen = openLesson === lessonKey;
                    const isRead = readLessons.has(lesson.id);
                    const progress = progressByLesson.get(lesson.id);
                    return (
                      <div key={lesson.id} className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <button onClick={() => setOpenLesson(isOpen ? null : lessonKey)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                            <span className={`text-sm font-semibold ${isRead ? 'text-emerald-400' : 'text-foreground'}`}>{lesson.title}</span>
                            {isRead && <CheckCircle size={14} className="shrink-0 text-emerald-400" />}
                          </button>
                          {isAdmin && <div className="flex gap-2">
                            <Button size="icon" variant="ghost" onClick={() => handleEditLesson(chapter.id, lesson.id, lesson.content)} aria-label="Editar aula"><Edit2 size={14} /></Button>
                            <Button size="icon" variant="ghost" onClick={() => setPrintLesson({ lesson, chapterTitle: chapter.title })} aria-label="Imprimir aula"><FileText size={14} /></Button>
                          </div>}
                        </div>
                        {isOpen && (
                          <div className="mt-4 space-y-3">
                            <div className="apostila-content prose prose-invert max-w-none text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: getLessonHtml(lesson.content || '') }} />
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" variant="outline" onClick={() => toggleReader(lessonKey)} className="gap-1.5">{reader.lessonKey === lessonKey && reader.isPlaying ? <Pause size={13} /> : <Play size={13} />} Ouvir aula</Button>
                              <Button size="sm" variant="outline" onClick={() => setPrintLesson({ lesson, chapterTitle: chapter.title })} className="gap-1.5"><FileText size={13} /> Imprimir</Button>
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
        })}
      </div>

      {editingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Editar aula</h2>
              <Button size="sm" variant="ghost" onClick={() => setEditingLesson(null)}><X size={16} /></Button>
            </div>
            <ReactQuill theme="snow" value={editContent} onChange={setEditContent} modules={quillModules} formats={quillFormats} />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingLesson(null)}>Cancelar</Button>
              <Button onClick={() => {
                const [chapterId, lessonId] = editingLesson.split('__');
                saveMutation.mutate({ chapterId, lessonId, content: editContent });
              }} disabled={saveMutation.isPending} className="gap-2"><Save size={14} />{saveMutation.isPending ? 'Salvando...' : 'Salvar alterações'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
