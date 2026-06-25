import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { BookOpen, ChevronDown, ChevronRight, Edit2, Save, X, GraduationCap, Award, Printer, CheckCircle, BookMarked, Type, AlignLeft, Palette } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import ParticipationCelebration from '@/components/shared/ParticipationCelebration';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { adminApi } from '@/lib/adminApi';
import ApostilaPrintModal from '@/components/apostila/ApostilaPrintModal';
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

const APOSTILA_READ_KEY = (email, course) => `wr_apostila_read_${course}_${email}`;

const APOSTILA_BG = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/b553e29d9_Fundo_Apostila.png';
const EDITOR_PREVIEW_WIDTH = 900;
const EDITOR_PREVIEW_HEIGHT = 636;

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


export default function Apostila() {
  const { session } = useCustomAuth();
  const isAdmin = session?.role === 'admin';
  const queryClient = useQueryClient();

  const [openChapter, setOpenChapter] = useState(null);
  const [openLesson, setOpenLesson] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [printLesson, setPrintLesson] = useState(null);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationMsg, setCelebrationMsg] = useState('');

  // Persisted read completions: Set of "chapterId__lessonId"
  const [readLessons, setReadLessons] = useState(() => {
    const key = APOSTILA_READ_KEY(session?.email || session?.code || 'guest', session?.course || 'tcc');
    try { const r = localStorage.getItem(key); return r ? new Set(JSON.parse(r)) : new Set(); } catch { return new Set(); }
  });

  const markRead = (chapterId, lessonId) => {
    const key = APOSTILA_READ_KEY(session?.email || session?.code || 'guest', session?.course || 'tcc');
    const readKey = `${chapterId}__${lessonId}`;
    if (readLessons.has(readKey)) return;
    const next = new Set(readLessons);
    next.add(readKey);
    setReadLessons(next);
    localStorage.setItem(key, JSON.stringify([...next]));
    setCelebrationMsg('Aula concluída! Continue assim! 📖✨');
    setCelebrating(true);
  };

  const { data: savedData } = useQuery({
    queryKey: ['apostila-book'],
    queryFn: () => base44.entities.Book.filter({ title: 'Apostila TCC' }, '-created_date', 1),
  });

  const book = savedData?.[0];
  // Always use DEFAULT_CHAPTERS from code (source of truth); DB is only used to persist admin edits
  const savedChapters = book?.chapters_data ? (() => { try { return JSON.parse(book.chapters_data); } catch { return null; } })() : null;
  const chapters = savedChapters && savedChapters.length >= DEFAULT_CHAPTERS.length ? savedChapters : DEFAULT_CHAPTERS;

  const saveMutation = useMutation({
    mutationFn: async (newChapters) => {
      const payload = { title: 'Apostila TCC', chapters_data: JSON.stringify(newChapters) };
      if (book) return adminApi.update('Book', book.id, payload);
      return adminApi.create('Book', { ...payload, author_email: session?.email || 'admin@wr-educonnect.local' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apostila-book'] });
      toast.success('Apostila salva!');
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
    const updated = chapters.map((ch) =>
      ch.id === chapterId
        ? { ...ch, lessons: ch.lessons.map((l) => l.id === lessonId ? { ...l, content: editContent } : l) }
        : ch
    );
    saveMutation.mutate(updated);
  };

  const totalLessons = chapters.reduce((acc, ch) => acc + ch.lessons.length, 0);
  const totalRead = readLessons.size;

  return (
    <div className="p-4 lg:p-7 max-w-4xl mx-auto space-y-6 animate-fade-in-up pb-24">
      {celebrating && <ParticipationCelebration message={celebrationMsg} onClose={() => setCelebrating(false)} />}
      {printLesson && (
        <ApostilaPrintModal
          lesson={printLesson.lesson}
          chapterTitle={printLesson.chapterTitle}
          onClose={() => setPrintLesson(null)}
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
          </div>
        </div>

        {/* Teóricos */}
        <div className="mt-5 pt-5 border-t border-emerald-500/15">
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Fundamentação teórica</p>
          <div className="flex flex-wrap gap-2">
            {['Winnicott', 'Kurt Lewin', 'Heinz Kohut', 'George Engel', 'Viktor Frankl'].map((t) => (
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

          return (
            <div key={chapter.id} className="rounded-2xl border border-border bg-card overflow-hidden">
              {/* Chapter header */}
              <button
                onClick={() => setOpenChapter(isChOpen ? null : chapter.id)}
                className="w-full flex items-center justify-between p-5 hover:bg-secondary/40 transition-colors text-left"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-10 h-10 rounded-xl ${bgLight} flex items-center justify-center shrink-0`}>
                    <span className="text-sm font-bold">{chIdx + 1}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-foreground leading-tight">{chapter.title}</p>
                    <p className={`text-xs mt-0.5 ${colorLight} font-medium`}>
                      {chapter.subtitle} · {chapter.lessons.length} aulas
                    </p>
                  </div>
                </div>
                {isChOpen
                  ? <ChevronDown size={16} className="text-muted-foreground shrink-0" />
                  : <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                }
              </button>

              {/* Lessons */}
              {isChOpen && (
                <div className="border-t border-border divide-y divide-border">
                  {chapter.lessons.map((lesson) => {
                    const key = `${chapter.id}__${lesson.id}`;
                    const isOpen = openLesson === key;
                    const isEditing = editingLesson === key;

                    const lessonReadKey = `${chapter.id}__${lesson.id}`;
                    const isRead = readLessons.has(lessonReadKey);
                    return (
                      <div key={lesson.id}>
                        <button
                          onClick={() => setOpenLesson(isOpen ? null : key)}
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
                                      <Palette size={12} /> Edição sobre o fundo da apostila
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
                                    style={{
                                      width: '100%',
                                      maxWidth: EDITOR_PREVIEW_WIDTH,
                                      minHeight: EDITOR_PREVIEW_HEIGHT,
                                      margin: '0 auto',
                                      backgroundImage: `url(${APOSTILA_BG})`,
                                      backgroundSize: '100% 100%',
                                      backgroundRepeat: 'no-repeat',
                                    }}
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
                                <div className={`rounded-xl border ${bgLight} border-opacity-30 p-4`} style={{ borderColor: 'transparent', background: 'rgba(0,0,0,0.15)' }}>
                                  <div
                                    className="apostila-content text-sm text-foreground/90 leading-relaxed font-sans"
                                    dangerouslySetInnerHTML={{ __html: lesson.content ? getLessonHtml(lesson.content) : 'Conteúdo ainda não adicionado.' }}
                                  />
                                </div>
                                <div className="flex gap-2 flex-wrap items-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setPrintLesson({ lesson, chapterTitle: chapter.title })}
                                    className="gap-1.5"
                                  >
                                    <Printer size={13} /> Imprimir / PDF
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
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl hover:bg-primary/20 transition-all active:scale-95"
                                      >
                                        <BookMarked size={13} /> Marcar como lida
                                      </button>
                                    )
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