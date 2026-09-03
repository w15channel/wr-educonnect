import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { adminApi } from '@/lib/adminApi';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { BookOpen, ChevronDown, ChevronRight, Edit2, Save, X, GraduationCap, Award, FileText, CheckCircle, BookMarked, Type, AlignLeft, Play, Pause, Square, SkipBack, SkipForward, Volume2, Lock, Flame, Wand2 } from 'lucide-react';
import NextStepLink from '@/components/shared/NextStepLink';
import useApostilaModuleUnlocks from '@/hooks/useApostilaModuleUnlocks';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import ParticipationCelebration from '@/components/shared/ParticipationCelebration';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ApostilaPrintModal from '@/components/apostila/ApostilaPrintModal';
import ChapterRewriteModal from '@/components/apostila/ChapterRewriteModal';
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

const DEFAULT_CHAPTERS = [MOD1, MOD2, MOD3, MOD4, MOD5, MOD6, MOD7, MOD8, MOD9, MOD10];
const APOSTILA_BOOK_ID = 'apostila-tcc';
const APOSTILA_BOOK_TITLE = 'Apostila TCC';

const APOSTILA_READ_KEY = (email, course) => `wr_apostila_read_${course}_${email}`;
const APOSTILA_AUTHOR_EMAIL = 'apostila@wr-edu.local';
const INLINE_CONTENT_LIMIT = 6000;

function safeFilePart(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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
    return {
      content: lessonContent,
      content_url: '',
      content_storage: 'inline',
    };
  }

  return {
    content: '',
    content_url: await uploadLessonContent(chapterId, lessonId, lessonContent),
    content_storage: 'file',
  };
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
  .split(/\n{2,}/)
  .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
  .join('');

const getLessonHtml = (value = '') => (isHtmlContent(value) ? value : plainTextToHtml(value));


const extractLessonParagraphs = (html = '') => {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ').split(/\n{2,}/).map((text) => text.trim()).filter(Boolean);
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const blocks = Array.from(doc.body.querySelectorAll('p, li, h1, h2, h3, h4, blockquote'));
  const paragraphs = (blocks.length ? blocks : Array.from(doc.body.childNodes))
    .map((node) => node.textContent?.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const fallback = doc.body.textContent?.replace(/\s+/g, ' ').trim();
  return paragraphs.length ? paragraphs : (fallback ? [fallback] : []);
};

const READER_RATES = [1, 1.5, 2];

const getWordParts = (text = '') => text.match(/\S+|\s+/g) || [];

function ReadingViewport({ paragraphs, activeParagraph, activeWord, isPlaying, viewportRef }) {
  return (
    <div
      ref={viewportRef}
      className="apostila-reading-viewport apostila-content text-sm text-foreground/90 leading-relaxed font-sans"
      tabIndex={0}
      aria-label="Conteúdo da aula. Use a rolagem para continuar a leitura."
    >
      {paragraphs.map((paragraph, paragraphIndex) => {
        let wordIndex = -1;
        return (
          <p key={`${paragraphIndex}-${paragraph.slice(0, 18)}`} data-reader-paragraph={paragraphIndex}>
            {getWordParts(paragraph).map((part, partIndex) => {
              if (/^\s+$/.test(part)) return <React.Fragment key={partIndex}>{part}</React.Fragment>;
              wordIndex += 1;
              const isCurrentWord = paragraphIndex === activeParagraph && wordIndex === activeWord;
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
  const isAdmin = session?.role === 'admin';
  const queryClient = useQueryClient();
  const { moduleUnlocked, isLoading: loadingUnlocks } = useApostilaModuleUnlocks(session?.course || 'tcc', session);

  const [openChapter, setOpenChapter] = useState(null);
  const [openLesson, setOpenLesson] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [printLesson, setPrintLesson] = useState(null);
  const [rewriteOpen, setRewriteOpen] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationMsg, setCelebrationMsg] = useState('');
  const [reader, setReader] = useState({ lessonKey: null, paragraphIndex: 0, wordIndex: 0, rate: 1, isPlaying: false });
  const utteranceRef = useRef(null);
  const readerRef = useRef(reader);
  const readerSessionRef = useRef(0);
  const intentionalStopRef = useRef(false);
  const readerViewportRefs = useRef(new Map());

  useEffect(() => {
    readerRef.current = reader;
  }, [reader]);

  useEffect(() => {
    if (!reader.isPlaying || !reader.lessonKey) return;
    const viewport = readerViewportRefs.current.get(reader.lessonKey);
    const activeWord = viewport?.querySelector('[data-reader-word="active"]');
    activeWord?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  }, [reader.isPlaying, reader.lessonKey, reader.paragraphIndex, reader.wordIndex]);

  useEffect(() => () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Persisted read completions: Set of "chapterId__lessonId"
  const [readLessons, setReadLessons] = useState(() => {
    const key = APOSTILA_READ_KEY(session?.email || session?.code || 'guest', session?.course || 'tcc');
    try {
      const stored = JSON.parse(localStorage.getItem(key) || '[]');
      const moduleOneOnly = stored.filter((lessonKey) => String(lessonKey).startsWith('mod1__'));
      localStorage.setItem(key, JSON.stringify(moduleOneOnly));
      return new Set(moduleOneOnly);
    } catch {
      localStorage.removeItem(key);
      return new Set();
    }
  });

  const markRead = async (chapterId, lessonId) => {
    const key = APOSTILA_READ_KEY(session?.email || session?.code || 'guest', session?.course || 'tcc');
    const readKey = `${chapterId}__${lessonId}`;
    if (readLessons.has(readKey)) return;
    try {
      await base44.functions.invoke('saveStudentRecord', {
        action: 'lessonProgressUpsert',
        lesson_id: `apostila:${chapterId}:${lessonId}`,
        student_email: session?.email,
        student_identifiers: [session?.email, session?.code].filter(Boolean),
        patch: { watched: true },
      });
    } catch (error) {
      toast.error(error?.message || 'Não foi possível registrar esta conquista. Tente novamente.');
      return;
    }
    const next = new Set(readLessons);
    next.add(readKey);
    setReadLessons(next);
    localStorage.setItem(key, JSON.stringify([...next]));
    queryClient.invalidateQueries({ queryKey: ['apostila-unlock-progress', session?.email] });
    setCelebrationMsg('Aula concluída! Continue assim! 📖✨');
    setCelebrating(true);
  };

  const { data: savedLessons = [], isFetched: savedLessonsFetched } = useQuery({
    queryKey: ['apostila-lessons', APOSTILA_BOOK_ID],
    queryFn: async () => {
      const records = await base44.entities.BookChapter.filter({ book_id: APOSTILA_BOOK_ID }, 'order', 500);
      return Promise.all((records || []).map(resolveStoredLesson));
    },
  });

  const defaultServerLessons = useMemo(() => DEFAULT_CHAPTERS.flatMap((chapter, chapterIndex) =>
    chapter.lessons.map((lesson, lessonIndex) => ({
      book_id: APOSTILA_BOOK_ID,
      book_title: APOSTILA_BOOK_TITLE,
      author_email: session?.email || APOSTILA_AUTHOR_EMAIL,
      chapter_id: chapter.id,
      chapter_title: chapter.title,
      lesson_id: lesson.id,
      title: lesson.title || 'Aula da apostila',
      content: getLessonHtml(lesson.content || ''),
      order: (chapterIndex * 100) + lessonIndex + 1,
    }))), [session?.email]);

  useEffect(() => {
    if (!isAdmin || !savedLessonsFetched || !defaultServerLessons.length) return;

    const savedKeys = new Set((savedLessons || []).map((lesson) => `${lesson.chapter_id}__${lesson.lesson_id}`));
    const missingLessons = defaultServerLessons.filter((lesson) => !savedKeys.has(`${lesson.chapter_id}__${lesson.lesson_id}`));
    if (!missingLessons.length) return;

    Promise.all(missingLessons.map(async (lesson) => ({
      ...lesson,
      ...(await buildStoredContentPayload(lesson.chapter_id, lesson.lesson_id, lesson.content)),
    })))
      .then((preparedLessons) => adminApi.syncBookChapters(preparedLessons, { createOnly: true }))
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['apostila-lessons', APOSTILA_BOOK_ID] });
        toast.success('Aulas da apostila sincronizadas com o servidor.');
      })
      .catch((error) => {
        toast.error(`Erro ao sincronizar aulas no servidor: ${error.message || 'tente novamente.'}`);
      });
  }, [defaultServerLessons, isAdmin, queryClient, savedLessons, savedLessonsFetched]);

  const savedLessonByKey = useMemo(() => {
    return new Map((savedLessons || []).map((lesson) => [`${lesson.chapter_id}__${lesson.lesson_id}`, lesson]));
  }, [savedLessons]);

  // DEFAULT_CHAPTERS remains the local fallback, while edited lesson content is loaded from BookChapter rows on the server.
  const chapters = useMemo(() => DEFAULT_CHAPTERS.map((chapter) => ({
    ...chapter,
    lessons: chapter.lessons.map((lesson) => {
      const savedLesson = savedLessonByKey.get(`${chapter.id}__${lesson.id}`);
      return savedLesson
        ? { ...lesson, title: savedLesson.title || lesson.title, content: savedLesson.content ?? lesson.content }
        : lesson;
    }),
  })), [savedLessonByKey]);

  const paragraphsByLesson = useMemo(() => {
    const entries = [];
    chapters.forEach((chapter) => {
      chapter.lessons.forEach((lesson) => {
        entries.push([
          `${chapter.id}__${lesson.id}`,
          extractLessonParagraphs(getLessonHtml(lesson.content || 'Conteúdo ainda não adicionado.')),
        ]);
      });
    });
    return Object.fromEntries(entries);
  }, [chapters]);

  const stopReader = (lessonKey = readerRef.current.lessonKey) => {
    intentionalStopRef.current = true;
    readerSessionRef.current += 1;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    setReader((current) => ({
      ...current,
      lessonKey: lessonKey || current.lessonKey,
      paragraphIndex: 0,
      wordIndex: 0,
      isPlaying: false,
    }));
  };

  const speakParagraph = (lessonKey, paragraphIndex, rate = readerRef.current.rate, options = {}) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      toast.error('Leitor de texto não disponível neste dispositivo.');
      return;
    }

    const paragraphs = paragraphsByLesson[lessonKey] || [];
    const text = paragraphs[paragraphIndex];
    if (!text) {
      intentionalStopRef.current = true;
      window.speechSynthesis.cancel();
      setReader((current) => ({ ...current, lessonKey, paragraphIndex: 0, wordIndex: 0, isPlaying: false }));
      return;
    }

    const sessionId = options.sessionId ?? readerSessionRef.current + 1;
    readerSessionRef.current = sessionId;
    if (!options.skipCancel) {
      intentionalStopRef.current = true;
      window.speechSynthesis.cancel();
    }
    intentionalStopRef.current = false;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = rate;
    const wordStarts = [...text.matchAll(/\S+/g)].map((match) => match.index || 0);
    utterance.onboundary = (event) => {
      if (event.name && event.name !== 'word') return;
      if (readerSessionRef.current !== sessionId) return;
      const nextWordIndex = Math.max(0, wordStarts.findLastIndex((start) => start <= event.charIndex));
      setReader((state) => ({ ...state, lessonKey, paragraphIndex, wordIndex: nextWordIndex }));
    };
    utterance.onend = () => {
      const current = readerRef.current;
      if (readerSessionRef.current !== sessionId || current.lessonKey !== lessonKey || !current.isPlaying) return;
      const nextIndex = paragraphIndex + 1;
      if (nextIndex < paragraphs.length) {
        setReader((state) => ({ ...state, lessonKey, paragraphIndex: nextIndex, wordIndex: 0, isPlaying: true }));
        window.setTimeout(() => {
          const latest = readerRef.current;
          if (readerSessionRef.current === sessionId && latest.lessonKey === lessonKey && latest.isPlaying) {
            speakParagraph(lessonKey, nextIndex, latest.rate, { skipCancel: true, sessionId });
          }
        }, 80);
      } else {
        setReader((state) => ({ ...state, lessonKey, paragraphIndex: 0, wordIndex: 0, isPlaying: false }));
      }
    };
    utterance.onerror = () => {
      if (intentionalStopRef.current || readerSessionRef.current !== sessionId) return;
      setReader((state) => ({ ...state, isPlaying: false }));
      toast.error('Não foi possível continuar a leitura em voz alta.');
    };

    utteranceRef.current = utterance;
    setReader((current) => ({ ...current, lessonKey, paragraphIndex, wordIndex: 0, rate, isPlaying: true }));
    window.speechSynthesis.speak(utterance);
  };

  const toggleReaderPlayback = (lessonKey) => {
    const paragraphs = paragraphsByLesson[lessonKey] || [];
    if (!paragraphs.length) {
      toast.error('Esta aula não possui texto para leitura em voz alta.');
      return;
    }

    if (reader.lessonKey === lessonKey && reader.isPlaying) {
      window.speechSynthesis?.pause();
      setReader((current) => ({ ...current, isPlaying: false }));
      return;
    }

    if (reader.lessonKey === lessonKey && utteranceRef.current && window.speechSynthesis?.paused) {
      window.speechSynthesis.resume();
      setReader((current) => ({ ...current, isPlaying: true }));
      return;
    }

    speakParagraph(lessonKey, reader.lessonKey === lessonKey ? reader.paragraphIndex : 0, reader.rate);
  };

  const skipReaderParagraph = (lessonKey) => {
    const paragraphs = paragraphsByLesson[lessonKey] || [];
    if (!paragraphs.length) return;
    const currentIndex = reader.lessonKey === lessonKey ? reader.paragraphIndex : 0;
    const nextIndex = currentIndex + 1 >= paragraphs.length ? 0 : currentIndex + 1;
    speakParagraph(lessonKey, nextIndex, reader.rate);
  };

  const previousReaderParagraph = (lessonKey) => {
    const paragraphs = paragraphsByLesson[lessonKey] || [];
    if (!paragraphs.length) return;
    const currentIndex = reader.lessonKey === lessonKey ? reader.paragraphIndex : 0;
    const previousIndex = Math.max(0, currentIndex - 1);
    speakParagraph(lessonKey, previousIndex, reader.rate);
  };

  const changeReaderRate = (lessonKey, rate) => {
    setReader((current) => ({ ...current, lessonKey, rate }));
    if (reader.lessonKey === lessonKey && reader.isPlaying) {
      speakParagraph(lessonKey, reader.paragraphIndex, rate);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async ({ chapterId, lessonId, content }) => {
      const chapterIndex = DEFAULT_CHAPTERS.findIndex((chapter) => chapter.id === chapterId);
      const chapter = DEFAULT_CHAPTERS[chapterIndex];
      const lessonIndex = chapter?.lessons.findIndex((lesson) => lesson.id === lessonId) ?? -1;
      const defaultLesson = lessonIndex >= 0 ? chapter.lessons[lessonIndex] : null;
      const existingLesson = savedLessonByKey.get(`${chapterId}__${lessonId}`);
      const storedContent = existingLesson?.content === content && existingLesson?.content_url
        ? {
          content: existingLesson.content_storage === 'file' ? '' : content,
          content_url: existingLesson.content_url,
          content_storage: existingLesson.content_storage || 'file',
        }
        : await buildStoredContentPayload(chapterId, lessonId, content);
      const payload = {
        book_id: APOSTILA_BOOK_ID,
        book_title: APOSTILA_BOOK_TITLE,
        author_email: session?.email || APOSTILA_AUTHOR_EMAIL,
        chapter_id: chapterId,
        chapter_title: chapter?.title || chapterId,
        lesson_id: lessonId,
        title: defaultLesson?.title || 'Aula da apostila',
        ...storedContent,
        order: ((chapterIndex >= 0 ? chapterIndex : 0) * 100) + (lessonIndex >= 0 ? lessonIndex + 1 : 1),
      };

      return adminApi.upsertBookChapter(payload, existingLesson?.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apostila-lessons', APOSTILA_BOOK_ID] });
      toast.success('Apostila salva no servidor!');
      setEditingLesson(null);
    },
    onError: (error) => {
      toast.error(`Erro ao salvar apostila: ${error.message || 'tente novamente.'}`);
    },
  });

  const handleEditLesson = (chapterId, lessonId, content) => {
    setEditingLesson(`${chapterId}__${lessonId}`);
    setEditContent(getLessonHtml(content || ''));
  };

  const handleSaveLesson = (chapterId, lessonId) => {
    saveMutation.mutate({ chapterId, lessonId, content: editContent });
  };

  const handleRewriteSave = ({ chapterId, lessonId, content }) => {
    saveMutation.mutate({ chapterId, lessonId, content }, {
      onSuccess: () => setRewriteOpen(false),
    });
  };

  const totalLessons = chapters.reduce((acc, ch) => acc + ch.lessons.length, 0);
  const totalRead = readLessons.size;

  return (
    <div className="app-page max-w-4xl mx-auto space-y-6 animate-fade-in-up pb-24">
      {celebrating && <ParticipationCelebration session={session} achievement={{ kind: 'book_lesson', message: 'concluiu uma aula na apostila.' }} message={celebrationMsg} onClose={() => setCelebrating(false)} />}
      {printLesson && (
        <ApostilaPrintModal
          lesson={printLesson.lesson}
          chapterTitle={printLesson.chapterTitle}
          onClose={() => setPrintLesson(null)}
        />
      )}

      {rewriteOpen && isAdmin && (
        <ChapterRewriteModal
          chapters={chapters}
          onClose={() => setRewriteOpen(false)}
          onSave={handleRewriteSave}
          saving={saveMutation.isPending}
        />
      )}

      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-900/40 to-teal-900/30 border border-emerald-500/20 p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shrink-0">
            <BookOpen size={26} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground">Apostila — Formação em Terapia Comportamental</h1>
            <p className="text-sm text-emerald-400 font-medium mt-1">
              Prof. William Ribeiro · Psicoterapeuta, Psicanalista e Sexólogo
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Coordenador do Instituto de Desenvolvimento Humano WR-EDU®
            </p>
            <div className="flex flex-wrap gap-3 mt-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
                <BookOpen size={12} className="text-emerald-400" />
                {totalLessons} aulas
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
                <GraduationCap size={12} className="text-violet-400" />
                {chapters.length} módulos
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
                <Award size={12} className="text-amber-400" />
                Formação Profissional
              </div>
              {!isAdmin && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                  <BookMarked size={12} className="text-emerald-400" />
                  {totalRead}/{totalLessons} lidas
                </div>
              )}
            </div>
            {isAdmin && (
              <div className="mt-3">
                <Button size="sm" onClick={() => setRewriteOpen(true)} className="gap-1.5 bg-gradient-to-r from-violet-500 to-purple-700 text-white hover:opacity-90">
                  <Wand2 size={13} /> Reescrever capítulo
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Teóricos */}
        <div className="mt-5 pt-5 border-t border-emerald-500/15">
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Fundamentação teórica</p>
          <div className="flex flex-wrap gap-2">
            {['Donald Winnicott ', 'Kurt Lewin', 'Heinz Kohut', 'George Engel', 'Viktor Frankl'].map((t) => (
              <span key={t} className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Objetivo Geral */}
      <div className="rounded-xl bg-card border border-border p-4">
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Objetivo Geral</h3>
        <p className="text-sm text-foreground leading-relaxed">
          Formar terapeutas capazes de aplicar um modelo termodinâmico, vetorial e não-destrutivo da psique, aliviando dores e fornecendo ferramentas terapêuticas eficientes, integrando trade-off comportamental, algozes e modulação consciente com os principais referenciais teóricos.
        </p>
      </div>

      {/* Chapters */}
      <div className="space-y-3">
        {chapters.map((chapter, chIdx) => {
          const isChOpen = openChapter === chapter.id;
          const colorLight = chapter.colorLight || 'text-emerald-400';
          const bgLight = chapter.bgLight || 'bg-emerald-500/10';
          const isLocked = !isAdmin && !loadingUnlocks && !moduleUnlocked[chIdx];

          return (
            <div key={chapter.id} className={`rounded-2xl border border-border bg-card overflow-hidden ${isLocked ? 'opacity-60' : ''}`}>
              {/* Chapter header */}
              <button
                onClick={() => {
                  if (isLocked) { toast.error('Conclua o módulo anterior (aulas assistidas e trabalhos entregues) para desbloquear.'); return; }
                  setOpenChapter(isChOpen ? null : chapter.id);
                }}
                className={`w-full flex items-center justify-between p-5 transition-colors text-left ${isLocked ? 'cursor-not-allowed' : 'hover:bg-secondary/40'}`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-10 h-10 rounded-xl ${bgLight} flex items-center justify-center shrink-0`}>
                    {isLocked ? <Lock size={15} className="text-muted-foreground" /> : <span className="text-sm font-bold">{chIdx + 1}</span>}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-foreground leading-tight">{chapter.title}</p>
                    <p className={`text-xs mt-0.5 ${isLocked ? 'text-muted-foreground' : colorLight} font-medium`}>
                      {isLocked ? 'Bloqueado — conclua o módulo anterior' : `${chapter.subtitle} · ${chapter.lessons.length} aulas`}
                    </p>
                  </div>
                </div>
                {!isLocked && (isChOpen
                  ? <ChevronDown size={16} className="text-muted-foreground shrink-0" />
                  : <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                )}
              </button>

              {/* Lessons */}
              {isChOpen && !isLocked && (
                <div className="border-t border-border divide-y divide-border">
                  {chapter.lessons.map((lesson) => {
                    const key = `${chapter.id}__${lesson.id}`;
                    const isOpen = openLesson === key;
                    const isEditing = editingLesson === key;

                    const lessonReadKey = `${chapter.id}__${lesson.id}`;
                    const isRead = readLessons.has(lessonReadKey);
                    const lessonParagraphs = paragraphsByLesson[key] || [];
                    const isReaderActive = reader.lessonKey === key;
                    const currentParagraphNumber = isReaderActive ? reader.paragraphIndex + 1 : 1;
                    return (
                      <div key={lesson.id}>
                        <button
                          onClick={() => {
                            if (reader.lessonKey === key) stopReader();
                            setOpenLesson(isOpen ? null : key);
                          }}
                          className={`w-full flex items-center justify-between px-5 py-3.5 hover:bg-secondary/30 transition-colors text-left ${isRead ? 'bg-emerald-500/5' : ''}`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`w-6 h-6 rounded-lg ${isRead ? 'bg-emerald-500/20' : bgLight} flex items-center justify-center shrink-0`}>
                              {isRead ? <CheckCircle size={11} className="text-emerald-500" /> : <BookOpen size={11} className={colorLight} />}
                            </div>
                            <span className={`text-sm font-medium leading-tight truncate ${isRead ? 'text-emerald-600' : 'text-foreground'}`}>{lesson.title}</span>
                            {isRead && <span className="text-[10px] text-emerald-500 font-bold shrink-0">✓ Lida</span>}
                          </div>
                          {isOpen
                            ? <ChevronDown size={14} className="text-muted-foreground shrink-0 ml-2" />
                            : <ChevronRight size={14} className="text-muted-foreground shrink-0 ml-2" />
                          }
                        </button>

                        {isOpen && (
                          <div className="px-5 pb-5 bg-secondary/10">
                            {isEditing ? (
                              <div className="space-y-3">
                                <div className="rounded-2xl border border-emerald-500/20 bg-slate-950/70 p-3 shadow-inner">
                                  <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-300">
                                      <Edit2 size={12} /> Edição do conteúdo da apostila
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1">
                                      <Type size={12} /> Fonte, tamanho, cor e alinhamento disponíveis
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1">
                                      <AlignLeft size={12} /> Use a visualização para ajustar quebras e posicionamento
                                    </span>
                                  </div>
                                  <div
                                    className="apostila-rich-editor overflow-hidden rounded-xl border border-white/10 bg-white shadow-2xl"
                                  >
                                    <ReactQuill
                                      theme="snow"
                                      value={editContent}
                                      onChange={setEditContent}
                                      modules={quillModules}
                                      formats={quillFormats}
                                      placeholder="Digite e formate o conteúdo da aula aqui..."
                                    />
                                  </div>
                                </div>
                                <div className="text-xs font-medium text-right text-muted-foreground">
                                  {editContent.replace(/<[^>]*>/g, '').length} caracteres de texto
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleSaveLesson(chapter.id, lesson.id)} disabled={saveMutation.isPending}>
                                    <Save size={13} /> {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingLesson(null)}>
                                    <X size={13} /> Cancelar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                                      <Volume2 size={16} />
                                      Leitor da apostila
                                      <span className="text-xs font-normal text-muted-foreground">
                                        Parágrafo {Math.min(currentParagraphNumber, lessonParagraphs.length || 1)}/{lessonParagraphs.length || 1}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => toggleReaderPlayback(key)}
                                        disabled={!lessonParagraphs.length}
                                        className="gap-1.5"
                                      >
                                        {isReaderActive && reader.isPlaying ? <Pause size={13} /> : <Play size={13} />}
                                        {isReaderActive && reader.isPlaying ? 'Pausar' : 'Play'}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => stopReader(key)}
                                        disabled={!lessonParagraphs.length || !isReaderActive}
                                        className="gap-1.5"
                                      >
                                        <Square size={13} /> Stop
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => previousReaderParagraph(key)}
                                        disabled={!lessonParagraphs.length || !isReaderActive || reader.paragraphIndex === 0}
                                        className="gap-1.5"
                                      >
                                        <SkipBack size={13} /> Voltar parágrafo
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => skipReaderParagraph(key)}
                                        disabled={!lessonParagraphs.length}
                                        className="gap-1.5"
                                      >
                                        <SkipForward size={13} /> Avançar parágrafo
                                      </Button>
                                      <div className="flex items-center gap-1 rounded-lg border border-border bg-background/70 p-1" aria-label="Velocidade de leitura">
                                        {READER_RATES.map((rate) => (
                                          <button
                                            key={rate}
                                            type="button"
                                            onClick={() => changeReaderRate(key, rate)}
                                            className={`rounded-md px-2 py-1 text-xs font-bold transition-colors ${reader.rate === rate ? 'bg-emerald-500 text-white' : 'text-muted-foreground hover:bg-secondary'}`}
                                            aria-pressed={reader.rate === rate}
                                          >
                                            {rate.toFixed(1)}x
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className={`rounded-xl border ${bgLight} border-opacity-30 p-4`} style={{ borderColor: 'transparent', background: 'rgba(0,0,0,0.15)' }}>
                                  <ReadingViewport
                                    paragraphs={lessonParagraphs.length ? lessonParagraphs : ['Conteúdo ainda não adicionado.']}
                                    activeParagraph={isReaderActive ? reader.paragraphIndex : -1}
                                    activeWord={isReaderActive ? reader.wordIndex : -1}
                                    isPlaying={isReaderActive && reader.isPlaying}
                                    viewportRef={(node) => {
                                      if (node) readerViewportRefs.current.set(key, node);
                                      else readerViewportRefs.current.delete(key);
                                    }}
                                  />
                                </div>
                                <div className="flex gap-2 flex-wrap items-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setPrintLesson({ lesson, chapterTitle: chapter.title })}
                                    className="gap-1.5"
                                  >
                                    <FileText size={13} /> Baixar PDF
                                  </Button>
                                  {isAdmin && (
                                    <Button size="sm" variant="outline" onClick={() => handleEditLesson(chapter.id, lesson.id, lesson.content)}>
                                      <Edit2 size={13} /> Editar conteúdo
                                    </Button>
                                  )}
                                  {!isAdmin && (
                                    readLessons.has(`${chapter.id}__${lesson.id}`) ? (
                                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                                        <CheckCircle size={13} /> Leitura concluída!
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => markRead(chapter.id, lesson.id)}
                                        className="apostila-mark-read-button inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl hover:bg-primary/20 transition-all active:scale-95"
                                      >
                                        <BookMarked size={13} /> Marcar como lida
                                      </button>
                                    )
                                  )}
                                  {!isAdmin && (
                                    <NextStepLink
                                      to="/ofensivas"
                                      icon={Flame}
                                      tone="orange"
                                      size="sm"
                                      title="Usar o conhecimento na Ofensiva"
                                    />
                                  )}
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
        })}
      </div>

      {/* Rodapé */}
      <div className="rounded-xl border border-border bg-card/50 p-4 text-center">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Material didático de uso exclusivo dos alunos do Instituto de Desenvolvimento Humano WR-EDU®.<br />
          Reprodução ou distribuição não autorizada é proibida.
        </p>
        <p className="text-xs text-primary mt-2 font-medium">© WR-EDU® — Prof. William Ribeiro</p>
      </div>
    </div>
  );
}
