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
import { createBase44VoiceAudio, releaseBase44VoiceAudio, isVoiceMuted, normalizeTextForSpeech } from '@/lib/base44Voice';
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
        return (
          <p
            key={`${paragraphIndex}-${paragraph.slice(0, 18)}`}
            data-reader-paragraph={paragraphIndex}
            className={paragraphIndex === activeParagraph && !nativeFallback ? 'rounded-lg bg-emerald-500/20 px-2 py-1 ring-1 ring-emerald-500/30' : undefined}
            aria-current={paragraphIndex === activeParagraph ? 'true' : undefined}
          >
            {getWordParts(paragraph).map((part, partIndex) => {
              if (/^\s+$/.test(part)) return <React.Fragment key={partIndex}>{part}</React.Fragment>;
              wordIndex += 1;
              const isCurrentWord = nativeFallback && paragraphIndex === activeParagraph && wordIndex === activeWord;
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
    if (readerAudioRef.current) {
      readerAudioRef.current.pause();
      releaseBase44VoiceAudio(readerAudioRef.current);
      readerAudioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    utteranceRef.current = null;
    setReader((current) => ({
      ...current,
      lessonKey: lessonKey || current.lessonKey,
      paragraphIndex: 0,
      wordIndex: 0,
      isPlaying: false,
      nativeFallback: false,
    }));
  };

  const speakParagraph = async (lessonKey, paragraphIndex, rate = readerRef.current.rate, options = {}) => {
    if (typeof window === 'undefined') return;

    const paragraphs = paragraphsByLesson[lessonKey] || [];
    const text = paragraphs[paragraphIndex];
    if (!text) {
      stopReader(lessonKey);
      return;
    }

    const sessionId = options.sessionId ?? readerSessionRef.current + 1;
    readerSessionRef.current = sessionId;
    if (!options.skipCancel) {
      intentionalStopRef.current = true;
      if (readerAudioRef.current) {
        readerAudioRef.current.pause();
        releaseBase44VoiceAudio(readerAudioRef.current);
        readerAudioRef.current = null;
      }
      window.speechSynthesis?.cancel();
    }
    intentionalStopRef.current = false;

    const advance = () => {
      const current = readerRef.current;
      if (readerSessionRef.current !== sessionId || current.lessonKey !== lessonKey || !current.isPlaying) return;
      const nextIndex = paragraphIndex + 1;
      if (nextIndex < paragraphs.length) {
        setReader((state) => ({ ...state, paragraphIndex: nextIndex, wordIndex: 0, isPlaying: true }));
        window.setTimeout(() => {
          const latest = readerRef.current;
          if (readerSessionRef.current === sessionId && latest.lessonKey === lessonKey && latest.isPlaying) {
            speakParagraph(lessonKey, nextIndex, latest.rate, { skipCancel: true, sessionId });
          }
        }, 80);
      } else {
        setReader((state) => ({ ...state, paragraphIndex: 0, wordIndex: 0, isPlaying: false, nativeFallback: false }));
      }
    };

    const startNativeFallback = () => {
      if (readerSessionRef.current !== sessionId || !window.speechSynthesis) {
        setReader((state) => ({ ...state, isPlaying: false }));
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = rate;
      utterance.pitch = 1.15;
      const wordStarts = [...text.matchAll(/\S+/g)].map((match) => match.index || 0);
      utterance.onboundary = (event) => {
        if (event.name && event.name !== 'word') return;
        if (readerSessionRef.current !== sessionId) return;
        const nextWordIndex = Math.max(0, wordStarts.findLastIndex((start) => start <= event.charIndex));
        setReader((state) => ({ ...state, wordIndex: nextWordIndex }));
      };
      utterance.onend = advance;
      utterance.onerror = () => {
        if (intentionalStopRef.current || readerSessionRef.current !== sessionId) return;
        setReader((state) => ({ ...state, isPlaying: false }));
        toast.error('Não foi possível continuar a leitura em voz alta.');
      };
      utteranceRef.current = utterance;
      setReader((current) => ({ ...current, lessonKey, paragraphIndex, wordIndex: 0, rate, isPlaying: true, nativeFallback: true }));
      window.speechSynthesis.speak(utterance);
    };

    setReader((current) => ({ ...current, lessonKey, paragraphIndex, wordIndex: 0, rate, isPlaying: true, nativeFallback: false }));

    // If voice is muted, skip AI generation entirely and use native fallback only
    if (isVoiceMuted()) {
      if (readerSessionRef.current === sessionId) startNativeFallback();
      return;
    }

    try {
      const audio = await createBase44VoiceAudio(text);
      if (!audio) {
        if (readerSessionRef.current === sessionId) startNativeFallback();
        return;
      }
      const latestReader = readerRef.current;
      if (readerSessionRef.current !== sessionId || latestReader.lessonKey !== lessonKey || !latestReader.isPlaying) {
        releaseBase44VoiceAudio(audio);
        return;
      }
      audio.playbackRate = rate;
      readerAudioRef.current = audio;
      let fallbackStarted = false;
      const fallbackOnce = () => {
        if (fallbackStarted || readerSessionRef.current !== sessionId) return;
        fallbackStarted = true;
        releaseBase44VoiceAudio(audio);
        readerAudioRef.current = null;
        startNativeFallback();
      };
      audio.onended = () => {
        releaseBase44VoiceAudio(audio);
        readerAudioRef.current = null;
        advance();
      };
      audio.onerror = fallbackOnce;
      await audio.play();
    } catch {
      if (readerSessionRef.current === sessionId) startNativeFallback();
    }
  };

  const toggleReaderPlayback = (lessonKey) => {
    const paragraphs = paragraphsByLesson[lessonKey] || [];
    if (!paragraphs.length) {
      toast.error('Esta aula não possui texto para leitura em voz alta.');
      return;
    }
    if (reader.lessonKey === lessonKey && reader.isPlaying) {
      if (readerAudioRef.current) readerAudioRef.current.pause();
      else window.speechSynthesis?.pause();
      setReader((current) => ({ ...current, isPlaying: false }));
      return;
    }
    if (reader.lessonKey === lessonKey && readerAudioRef.current?.paused) {
      readerAudioRef.current.play();
      setReader((current) => ({ ...current, isPlaying: true }));
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
    speakParagraph(lessonKey, currentIndex + 1 >= paragraphs.length ? 0 : currentIndex + 1, reader.rate);
  };

  const previousReaderParagraph = (lessonKey) => {
    const paragraphs = paragraphsByLesson[lessonKey] || [];
    if (!paragraphs.length) return;
    const currentIndex = reader.lessonKey === lessonKey ? reader.paragraphIndex : 0;
    speakParagraph(lessonKey, Math.max(0, currentIndex - 1), reader.rate);
  };

  const changeReaderRate = (lessonKey, rate) => {
    setReader((current) => ({ ...current, lessonKey, rate }));
    if (reader.lessonKey === lessonKey && readerAudioRef.current) {
      readerAudioRef.current.playbackRate = rate;
    } else if (reader.lessonKey === lessonKey && reader.isPlaying) {
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
        ? { content: existingLesson.content_storage === 'file' ? '' : content, content_url: existingLesson.content_url, content_storage: existingLesson.content_storage }
        : await buildStoredContentPayload(chapterId, lessonId, content);
      const payload = {
        book_id: APOSTILA_BOOK_ID,
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

  return (
    <div className="p-4 lg:p-6 space-y-5 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow">
          <BookOpen size={22} />
        </div>
        <div>
          <h2 className="text-xl font-black text-foreground">Apostila do Curso</h2>
          <p className="text-xs text-muted-foreground">Leitura interativa com narração em voz alta da Luna</p>
        </div>
      </div>

      <div className="space-y-2">
        {chapters.map((chapter, chapterIndex) => {
          const moduleNumber = chapterIndex + 1;
          const isUnlocked = isAdmin || moduleUnlocked?.[moduleNumber] || moduleNumber === 1;
          const isOpen = openChapter === chapter.id;
          return (
            <div key={chapter.id} className={`rounded-xl border border-border bg-card shadow-sm overflow-hidden ${!isUnlocked ? 'opacity-60' : ''}`}>
              <button
                onClick={() => { if (!isUnlocked) return; setOpenChapter(isOpen ? null : chapter.id); setOpenLesson(null); stopReader(); }}
                disabled={!isUnlocked}
                className="flex w-full items-center gap-3 p-4 text-left hover:bg-secondary/50 transition-colors disabled:cursor-not-allowed"
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black ${isUnlocked ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {isUnlocked ? moduleNumber : <Lock size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{chapter.title}</p>
                  <p className="text-[11px] text-muted-foreground">{chapter.lessons.length} aula(s)</p>
                </div>
                {isOpen ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
              </button>

              {isOpen && isUnlocked && (
                <div className="border-t border-border divide-y divide-border">
                  {chapter.lessons.map((lesson, lessonIndex) => {
                    const lessonKey = `${chapter.id}__${lesson.id}`;
                    const isLessonOpen = openLesson === lesson.id;
                    const isRead = readLessons.has(lessonKey);
                    const paragraphs = paragraphsByLesson[lessonKey] || [];
                    const isEditing = editingLesson === lesson.id;
                    return (
                      <div key={lesson.id}>
                        <button
                          onClick={() => { setOpenLesson(isLessonOpen ? null : lesson.id); stopReader(); }}
                          className="flex w-full items-center gap-3 p-3 text-left hover:bg-secondary/30 transition-colors"
                        >
                          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${isRead ? 'bg-emerald-500/20 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                            {isRead ? <CheckCircle size={12} /> : lessonIndex + 1}
                          </div>
                          <p className="flex-1 text-xs font-semibold text-foreground truncate">{lesson.title || `Aula ${lessonIndex + 1}`}</p>
                          {isLessonOpen ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
                        </button>

                        {isLessonOpen && (
                          <div className="p-3 space-y-3 bg-background/50">
                            {isEditing ? (
                              <div className="space-y-2">
                                <ReactQuill
                                  value={editContent}
                                  onChange={setEditContent}
                                  modules={quillModules}
                                  formats={quillFormats}
                                  theme="snow"
                                  className="apostila-editor"
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => saveMutation.mutate({ chapterId: chapter.id, lessonId: lesson.id, content: editContent })} disabled={saveMutation.isPending}>
                                    <Save size={14} /> Salvar
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingLesson(null)}><X size={14} /> Cancelar</Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <ReadingViewport
                                  paragraphs={paragraphs}
                                  activeParagraph={reader.lessonKey === lessonKey ? reader.paragraphIndex : -1}
                                  activeWord={reader.lessonKey === lessonKey ? reader.wordIndex : -1}
                                  isPlaying={reader.lessonKey === lessonKey && reader.isPlaying}
                                  nativeFallback={reader.lessonKey === lessonKey && reader.nativeFallback}
                                  viewportRef={(el) => { if (el) readerViewportRefs.current.set(lessonKey, el); else readerViewportRefs.current.delete(lessonKey); }}
                                />

                                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2">
                                  <Button size="sm" variant="ghost" onClick={() => toggleReaderPlayback(lessonKey)} className={reader.lessonKey === lessonKey && reader.isPlaying ? 'bg-emerald-500/15 text-emerald-600' : ''}>
                                    {reader.lessonKey === lessonKey && reader.isPlaying ? <Pause size={14} /> : <Play size={14} />}
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => previousReaderParagraph(lessonKey)} disabled={!paragraphs.length}>
                                    <SkipBack size={14} />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => skipReaderParagraph(lessonKey)} disabled={!paragraphs.length}>
                                    <SkipForward size={14} />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => stopReader(lessonKey)} disabled={reader.lessonKey !== lessonKey}>
                                    <Square size={14} />
                                  </Button>
                                  <div className="flex items-center gap-1 ml-2">
                                    {READER_RATES.map((r) => (
                                      <button
                                        key={r}
                                        onClick={() => changeReaderRate(lessonKey, r)}
                                        className={`rounded px-2 py-0.5 text-[10px] font-bold transition ${reader.lessonKey === lessonKey && reader.rate === r ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-secondary'}`}
                                      >{r}x</button>
                                    ))}
                                  </div>
                                  {isVoiceMuted() && (
                                    <span className="text-[10px] text-amber-500 font-semibold ml-2">Voz da Luna desligada — usando narração do navegador</span>
                                  )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <Button size="sm" variant="outline" onClick={() => markRead(chapter.id, lesson.id)} disabled={isRead}>
                                    {isRead ? <><CheckCircle size={14} /> Lida</> : <><BookMarked size={14} /> Marcar como lida</>}
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setPrintLesson(lesson)}>
                                    <FileText size={14} /> Imprimir
                                  </Button>
                                  {isAdmin && (
                                    <>
                                      <Button size="sm" variant="outline" onClick={() => { setEditingLesson(lesson.id); setEditContent(getLessonHtml(lesson.content || '')); }}>
                                        <Edit2 size={14} /> Editar
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={() => setRewriteOpen(true)}>
                                        <Wand2 size={14} /> Reescrever com IA
                                      </Button>
                                    </>
                                  )}
                                </div>

                                <NextStepLink currentModule={`apostila:${chapter.id}:${lesson.id}`} />
                              </>
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

      {printLesson && (
        <ApostilaPrintModal
          lesson={printLesson}
          onClose={() => setPrintLesson(null)}
        />
      )}

      {rewriteOpen && (
        <ChapterRewriteModal
          onClose={() => setRewriteOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['apostila-lessons', APOSTILA_BOOK_ID] });
            setRewriteOpen(false);
            toast.success('Conteúdo reescrito com IA!');
          }}
        />
      )}

      <ParticipationCelebration
        open={celebrating}
        message={celebrationMsg}
        onClose={() => setCelebrating(false)}
      />
    </div>
  );
}
