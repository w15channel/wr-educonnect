import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { BookOpen, ChevronDown, ChevronRight, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const DEFAULT_CHAPTERS = [
  {
    id: 'ch1',
    title: 'Introdução à Terapia Comportamental',
    lessons: [
      { id: 'l1', title: 'Aula 1 – Fundamentos da Terapia Comportamental', content: 'Conteúdo da aula 1...' },
      { id: 'l2', title: 'Aula 2 – História e Evolução', content: 'Conteúdo da aula 2...' },
      { id: 'l3', title: 'Aula 3 – Princípios Básicos', content: 'Conteúdo da aula 3...' },
    ],
  },
  {
    id: 'ch2',
    title: 'Donald Winnicott',
    lessons: [
      { id: 'l4', title: 'Aula 4 – Vida e Obra de Winnicott', content: 'Conteúdo da aula 4...' },
      { id: 'l5', title: 'Aula 5 – O Espaço Potencial', content: 'Conteúdo da aula 5...' },
      { id: 'l6', title: 'Aula 6 – O Falso Self', content: 'Conteúdo da aula 6...' },
      { id: 'l7', title: 'Aula 7 – Objeto Transicional', content: 'Conteúdo da aula 7...' },
      { id: 'l8', title: 'Aula 8 – Holding e Handling', content: 'Conteúdo da aula 8...' },
      { id: 'l9', title: 'Aula 9 – Aplicações Clínicas', content: 'Conteúdo da aula 9...' },
    ],
  },
  {
    id: 'ch3',
    title: 'Kurt Lewin',
    lessons: [
      { id: 'l10', title: 'Aula 10 – Teoria do Campo', content: 'Conteúdo da aula 10...' },
      { id: 'l11', title: 'Aula 11 – Dinâmica de Grupo', content: 'Conteúdo da aula 11...' },
      { id: 'l12', title: 'Aula 12 – Motivação e Comportamento', content: 'Conteúdo da aula 12...' },
      { id: 'l13', title: 'Aula 13 – Pesquisa-Ação', content: 'Conteúdo da aula 13...' },
      { id: 'l14', title: 'Aula 14 – Conflito e Resolução', content: 'Conteúdo da aula 14...' },
    ],
  },
  {
    id: 'ch4',
    title: 'Heinz Kohut',
    lessons: [
      { id: 'l15', title: 'Aula 15 – Psicologia do Self', content: 'Conteúdo da aula 15...' },
      { id: 'l16', title: 'Aula 16 – Narcisismo e Desenvolvimento', content: 'Conteúdo da aula 16...' },
      { id: 'l17', title: 'Aula 17 – Empatia na Clínica', content: 'Conteúdo da aula 17...' },
      { id: 'l18', title: 'Aula 18 – Transtornos do Self', content: 'Conteúdo da aula 18...' },
      { id: 'l19', title: 'Aula 19 – Técnicas Kohuttianas', content: 'Conteúdo da aula 19...' },
    ],
  },
  {
    id: 'ch5',
    title: 'George Engel',
    lessons: [
      { id: 'l20', title: 'Aula 20 – Modelo Biopsicossocial', content: 'Conteúdo da aula 20...' },
      { id: 'l21', title: 'Aula 21 – Integração Mente-Corpo', content: 'Conteúdo da aula 21...' },
      { id: 'l22', title: 'Aula 22 – Aplicações Práticas', content: 'Conteúdo da aula 22...' },
      { id: 'l23', title: 'Aula 23 – Diagnóstico Holístico', content: 'Conteúdo da aula 23...' },
      { id: 'l24', title: 'Aula 24 – Estudos de Caso', content: 'Conteúdo da aula 24...' },
    ],
  },
  {
    id: 'ch6',
    title: 'Viktor Frankl',
    lessons: [
      { id: 'l25', title: 'Aula 25 – Logoterapia', content: 'Conteúdo da aula 25...' },
      { id: 'l26', title: 'Aula 26 – Sentido da Vida', content: 'Conteúdo da aula 26...' },
      { id: 'l27', title: 'Aula 27 – Intenção Paradoxal', content: 'Conteúdo da aula 27...' },
      { id: 'l28', title: 'Aula 28 – Vontade de Sentido', content: 'Conteúdo da aula 28...' },
      { id: 'l29', title: 'Aula 29 – Dereflexão', content: 'Conteúdo da aula 29...' },
    ],
  },
  {
    id: 'ch7',
    title: 'Integração e Prática Clínica',
    lessons: [
      { id: 'l30', title: 'Aula 30 – Síntese dos Teóricos', content: 'Conteúdo da aula 30...' },
      { id: 'l31', title: 'Aula 31 – Técnicas Integradas', content: 'Conteúdo da aula 31...' },
      { id: 'l32', title: 'Aula 32 – Supervisão Clínica', content: 'Conteúdo da aula 32...' },
      { id: 'l33', title: 'Aula 33 – Ética Profissional', content: 'Conteúdo da aula 33...' },
      { id: 'l34', title: 'Aula 34 – Estudos de Caso Integrados', content: 'Conteúdo da aula 34...' },
      { id: 'l35', title: 'Aula 35 – TCC Avançada', content: 'Conteúdo da aula 35...' },
      { id: 'l36', title: 'Aula 36 – Avaliação e Encerramento', content: 'Conteúdo da aula 36...' },
    ],
  },
];

export default function Apostila() {
  const { session } = useCustomAuth();
  const isAdmin = session?.role === 'admin';
  const queryClient = useQueryClient();

  const [openChapter, setOpenChapter] = useState(null);
  const [openLesson, setOpenLesson] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [editContent, setEditContent] = useState('');

  const { data: savedData } = useQuery({
    queryKey: ['apostila-book'],
    queryFn: () => base44.entities.Book.filter({ title: 'Apostila TCC' }, '-created_date', 1),
  });

  const book = savedData?.[0];
  const chapters = book?.chapters_data ? JSON.parse(book.chapters_data) : DEFAULT_CHAPTERS;

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
    <div className="p-4 lg:p-7 max-w-4xl mx-auto space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg">
          <BookOpen size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Apostila TCC</h1>
          <p className="text-sm text-muted-foreground">{totalLessons} aulas · Terapia Comportamental</p>
        </div>
      </div>

      {/* Chapters */}
      <div className="space-y-2">
        {chapters.map((chapter) => (
          <div key={chapter.id} className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* Chapter header */}
            <button
              onClick={() => setOpenChapter(openChapter === chapter.id ? null : chapter.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <BookOpen size={15} className="text-emerald-500" />
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">{chapter.title}</p>
                  <p className="text-xs text-muted-foreground">{chapter.lessons.length} aulas</p>
                </div>
              </div>
              {openChapter === chapter.id
                ? <ChevronDown size={16} className="text-muted-foreground" />
                : <ChevronRight size={16} className="text-muted-foreground" />
              }
            </button>

            {/* Lessons */}
            {openChapter === chapter.id && (
              <div className="border-t border-border divide-y divide-border">
                {chapter.lessons.map((lesson) => {
                  const key = `${chapter.id}__${lesson.id}`;
                  const isOpen = openLesson === key;
                  const isEditing = editingLesson === key;

                  return (
                    <div key={lesson.id}>
                      <button
                        onClick={() => setOpenLesson(isOpen ? null : key)}
                        className="w-full flex items-center justify-between px-5 py-3 hover:bg-secondary/30 transition-colors text-left"
                      >
                        <span className="text-sm text-foreground font-medium">{lesson.title}</span>
                        {isOpen
                          ? <ChevronDown size={14} className="text-muted-foreground shrink-0" />
                          : <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                        }
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-4 bg-secondary/20">
                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                rows={8}
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
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
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                {lesson.content || 'Conteúdo ainda não adicionado.'}
                              </p>
                              {isAdmin && (
                                <Button size="sm" variant="outline" onClick={() => handleEditLesson(chapter.id, lesson.id, lesson.content)}>
                                  <Edit2 size={13} /> Editar
                                </Button>
                              )}
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
        ))}
      </div>
    </div>
  );
}