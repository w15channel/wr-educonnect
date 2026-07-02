/**
 * ExamEditor - Componente para edição manual de provas pelo admin
 * Permite criar/editar provas com questões de múltipla escolha ou discursivas
 */
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/adminApi';
import {
  Pencil, Plus, Trash2, Save, X, AlignLeft, List,
  ChevronLeft, FileText, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ExamEditor({ exam, onBack, course }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(exam?.title || '');
  const [description, setDescription] = useState(exam?.description || '');
  const [deadline, setDeadline] = useState(exam?.deadline ? exam.deadline.slice(0, 16) : '');
  const [maxGrade, setMaxGrade] = useState(exam?.max_grade || 60);
  const [questions, setQuestions] = useState(exam?.quiz_questions || []);
  const [isPublished, setIsPublished] = useState(exam?.is_published ?? true);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (exam?.id) return adminApi.update('Exam', exam.id, data);
      return adminApi.create('Exam', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success(exam?.id ? 'Prova atualizada!' : 'Prova criada!');
      onBack();
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const addQuestion = (type = 'choice') => {
    setQuestions(prev => [...prev, {
      question: '',
      answer_type: type,
      options: type === 'choice' ? ['', '', '', ''] : [],
      correct_index: type === 'choice' ? 0 : null,
    }]);
  };

  const updateQuestion = (qi, field, value) => {
    setQuestions(prev => prev.map((q, i) => i === qi ? { ...q, [field]: value } : q));
  };

  const updateOption = (qi, oi, value) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qi) return q;
      const opts = [...(q.options || [])];
      opts[oi] = value;
      return { ...q, options: opts };
    }));
  };

  const deleteQuestion = (qi) => {
    setQuestions(prev => prev.filter((_, i) => i !== qi));
  };

  const handleSave = () => {
    if (!title.trim()) { toast.error('Título é obrigatório'); return; }
    if (questions.length === 0) { toast.error('Adicione pelo menos uma questão'); return; }

    saveMutation.mutate({
      title,
      description,
      deadline: deadline || undefined,
      max_grade: Number(maxGrade),
      course: course || 'tcc',
      quiz_questions: questions.map(q => ({
        question: q.question,
        answer_type: q.answer_type || 'text',
        options: q.options || [],
        correct_index: q.answer_type === 'choice' ? q.correct_index : null,
      })),
      is_published: isPublished,
    });
  };

  return (
    <div className="p-4 lg:p-7 max-w-4xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={16} /> Voltar
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow">
            <Pencil size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground">{exam?.id ? 'Editar Prova' : 'Nova Prova'}</h2>
            <p className="text-xs text-muted-foreground">Crie ou edite manualmente as questões da prova</p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4 mb-5">
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Título</label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Prova - Módulo 1" />
        </div>
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Instruções para o aluno</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            placeholder="Instruções gerais da prova..."
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Prazo Final</label>
            <Input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Pontuação Total</label>
            <Input type="number" min={1} value={maxGrade} onChange={e => setMaxGrade(e.target.value)} />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={e => setIsPublished(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm font-bold text-foreground">Publicada</span>
            </label>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-3 mb-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-foreground flex items-center gap-2">
            <FileText size={15} /> Questões ({questions.length})
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => addQuestion('choice')} className="gap-1.5 h-8">
              <List size={14} /> Múltipla Escolha
            </Button>
            <Button variant="outline" size="sm" onClick={() => addQuestion('text')} className="gap-1.5 h-8">
              <AlignLeft size={14} /> Discursiva
            </Button>
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="bg-secondary/30 border border-border rounded-2xl p-8 text-center text-muted-foreground">
            <FileText size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Nenhuma questão adicionada</p>
            <p className="text-xs mt-1">Clique em "Múltipla Escolha" ou "Discursiva" para adicionar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q, qi) => (
              <div key={qi} className="bg-card border border-border rounded-2xl p-4 relative group">
                <button
                  onClick={() => deleteQuestion(qi)}
                  className="absolute top-3 right-3 p-1.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-destructive/10"
                >
                  <Trash2 size={14} />
                </button>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">Questão {qi + 1}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${q.answer_type === 'choice' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {q.answer_type === 'choice' ? 'Múltipla Escolha' : 'Discursiva'}
                  </span>
                </div>

                <textarea
                  value={q.question}
                  onChange={e => updateQuestion(qi, 'question', e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm mb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none font-medium"
                  placeholder="Digite o enunciado da questão..."
                />

                {q.answer_type === 'choice' && q.options?.length > 0 && (
                  <div className="space-y-1.5">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuestion(qi, 'correct_index', oi)}
                          className={`w-5 h-5 rounded-full border-2 shrink-0 transition-all ${q.correct_index === oi ? 'border-emerald-500 bg-emerald-500' : 'border-border hover:border-primary/50'}`}
                        />
                        <input
                          value={opt}
                          onChange={e => updateOption(qi, oi, e.target.value)}
                          className="flex-1 h-8 rounded-lg border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          placeholder={`Alternativa ${String.fromCharCode(65 + oi)}`}
                        />
                      </div>
                    ))}
                    <p className="text-[10px] text-muted-foreground mt-1">● = resposta correta</p>
                  </div>
                )}

                {q.answer_type === 'text' && (
                  <div className="bg-secondary/40 rounded-xl p-3 text-xs text-muted-foreground">
                    📝 Questão discursiva — o aluno responderá por escrito.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <X size={14} /> Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="flex-1 gap-2 h-11 font-black bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white"
        >
          <Save size={16} />
          {saveMutation.isPending ? 'Salvando...' : `Salvar Prova (${questions.length} questões)`}
        </Button>
      </div>
    </div>
  );
}