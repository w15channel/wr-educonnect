import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { BookOpen, ChevronDown, ChevronRight, Edit2, Save, X, GraduationCap, Award, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ApostilaPrintModal from '@/components/apostila/ApostilaPrintModal';
import { MOD1 } from '@/lib/apostila/mod1';
import { MOD2 } from '@/lib/apostila/mod2';
import { MOD3 } from '@/lib/apostila/mod3';
import { MOD4 } from '@/lib/apostila/mod4';
import { MOD5 } from '@/lib/apostila/mod5';

const DEFAULT_CHAPTERS = [MOD1, MOD2, MOD3, MOD4, MOD5];

export default function Apostila() {
  const { session } = useCustomAuth();
  const isAdmin = session?.role === 'admin';
  const queryClient = useQueryClient();

  const [openChapter, setOpenChapter] = useState(null);
  const [openLesson, setOpenLesson] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [printLesson, setPrintLesson] = useState(null); // { lesson, chapterTitle }

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
      if (book) return base44.entities.Book.update(book.id, payload);
      return base44.entities.Book.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apostila-book'] });
      toast.success('Apostila salva!');
      setEditingLesson(null);
    },
  });

  const handleEditLesson = (chapterId, lessonId, content) => {
    setEditingLesson(`${chapterId}__${lessonId}`);
    setEditContent(content || '');
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

  return (
    <div className="p-4 lg:p-7 max-w-4xl mx-auto space-y-6 animate-fade-in-up pb-24">
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
                5 módulos
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
                <Award size={12} className="text-amber-400" />
                Formação Profissional
              </div>
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

                    return (
                      <div key={lesson.id}>
                        <button
                          onClick={() => setOpenLesson(isOpen ? null : key)}
                          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-secondary/30 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`w-6 h-6 rounded-lg ${bgLight} flex items-center justify-center shrink-0`}>
                              <BookOpen size={11} className={colorLight} />
                            </div>
                            <span className="text-sm text-foreground font-medium leading-tight truncate">{lesson.title}</span>
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
                                <textarea
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  rows={16}
                                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                                />
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
                                  <pre className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed font-sans">
                                    {lesson.content || 'Conteúdo ainda não adicionado.'}
                                  </pre>
                                </div>
                                <div className="flex gap-2 flex-wrap">
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