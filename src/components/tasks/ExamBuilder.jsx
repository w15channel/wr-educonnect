import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, GraduationCap, AlignLeft, List, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const EMPTY_QUESTION = { question: '', answer_type: 'choice', options: ['', '', '', ''], correct_index: 0 };

export default function ExamBuilder({ onBack, editingExam }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(editingExam?.title || '');
  const [description, setDescription] = useState(editingExam?.description || '');
  const [deadline, setDeadline] = useState(editingExam?.deadline || '');
  const [maxGrade, setMaxGrade] = useState(editingExam?.max_grade || 60);
  const [questions, setQuestions] = useState(
    editingExam?.quiz_questions?.length > 0 ? editingExam.quiz_questions : [{ ...EMPTY_QUESTION }]
  );

  const saveMutation = useMutation({
    mutationFn: (data) => editingExam
      ? base44.entities.Task.update(editingExam.id, data)
      : base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(editingExam ? 'Prova atualizada!' : 'Prova criada!');
      onBack();
    },
  });

  const addQuestion = () => setQuestions(prev => [...prev, { ...EMPTY_QUESTION, options: ['', '', '', ''] }]);

  const updateQuestion = (qi, field, value) => {
    setQuestions(prev => prev.map((q, i) => i === qi ? { ...q, [field]: value } : q));
  };

  const updateOption = (qi, oi, value) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qi) return q;
      const opts = [...q.options];
      opts[oi] = value;
      return { ...q, options: opts };
    }));
  };

  const addOption = (qi) => {
    setQuestions(prev => prev.map((q, i) => i === qi ? { ...q, options: [...q.options, ''] } : q));
  };

  const removeOption = (qi, oi) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qi) return q;
      const opts = q.options.filter((_, idx) => idx !== oi);
      return { ...q, options: opts, correct_index: Math.min(q.correct_index, opts.length - 1) };
    }));
  };

  const removeQuestion = (qi) => setQuestions(prev => prev.filter((_, i) => i !== qi));

  const handleSave = () => {
    if (!title.trim()) { toast.error('Informe o título da prova'); return; }
    if (questions.some(q => !q.question.trim())) { toast.error('Preencha o enunciado de todas as questões'); return; }
    if (questions.some(q => q.answer_type === 'choice' && q.options.filter(o => o.trim()).length < 2)) {
      toast.error('Questões de seleção precisam de pelo menos 2 alternativas'); return;
    }
    saveMutation.mutate({
      title, description, deadline, max_grade: Number(maxGrade),
      type: 'quiz',
      quiz_questions: questions,
    });
  };

  return (
    <div className="p-4 lg:p-7 max-w-3xl mx-auto animate-fade-in-up">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={16} /> Voltar
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
            <GraduationCap size={16} className="text-purple-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{editingExam ? 'Editar Prova' : 'Criar Nova Prova'}</h2>
        </div>
      </div>

      {/* Exam settings */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-5 space-y-4">
        <h3 className="font-bold text-sm text-foreground">Configurações da Prova</h3>
        <Input placeholder="Título da prova" value={title} onChange={e => setTitle(e.target.value)} />
        <Textarea placeholder="Instruções para o aluno (opcional)" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Prazo de entrega</label>
            <Input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Valor total (pts)</label>
            <Input type="number" value={maxGrade} onChange={e => setMaxGrade(e.target.value)} min={1} />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4 mb-5">
        {questions.map((q, qi) => (
          <div key={qi} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Questão {qi + 1}</span>
              <div className="flex items-center gap-2">
                {/* Type toggle */}
                <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
                  <button
                    onClick={() => updateQuestion(qi, 'answer_type', 'choice')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-all ${q.answer_type === 'choice' ? 'bg-card shadow text-foreground' : 'text-muted-foreground'}`}
                  >
                    <List size={11} /> Seleção
                  </button>
                  <button
                    onClick={() => updateQuestion(qi, 'answer_type', 'text')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-all ${q.answer_type === 'text' ? 'bg-card shadow text-foreground' : 'text-muted-foreground'}`}
                  >
                    <AlignLeft size={11} /> Escrita
                  </button>
                </div>
                {questions.length > 1 && (
                  <button onClick={() => removeQuestion(qi)} className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg transition-colors">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>

            <Textarea
              placeholder={`Enunciado da questão ${qi + 1}`}
              value={q.question}
              onChange={e => updateQuestion(qi, 'question', e.target.value)}
              rows={2}
              className="mb-3"
            />

            {q.answer_type === 'choice' ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Alternativas (marque a correta)</p>
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuestion(qi, 'correct_index', oi)}
                      className={`w-5 h-5 rounded-full border-2 shrink-0 transition-all ${q.correct_index === oi ? 'border-green-500 bg-green-500' : 'border-border'}`}
                    />
                    <Input
                      placeholder={`Alternativa ${String.fromCharCode(65 + oi)}`}
                      value={opt}
                      onChange={e => updateOption(qi, oi, e.target.value)}
                      className="flex-1 h-8 text-xs"
                    />
                    {q.options.length > 2 && (
                      <button onClick={() => removeOption(qi, oi)} className="text-muted-foreground hover:text-destructive shrink-0">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
                {q.options.length < 6 && (
                  <button onClick={() => addOption(qi)} className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                    <Plus size={11} /> Adicionar alternativa
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-secondary/50 rounded-xl p-3 text-xs text-muted-foreground">
                📝 O aluno deverá responder esta questão por escrito (campo de texto).
              </div>
            )}
          </div>
        ))}

        <button
          onClick={addQuestion}
          className="w-full border-2 border-dashed border-border rounded-2xl p-4 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Adicionar Questão
        </button>
      </div>

      <Button onClick={handleSave} disabled={saveMutation.isPending} className="w-full h-11 text-sm font-bold gap-2">
        <GraduationCap size={16} />
        {saveMutation.isPending ? 'Salvando...' : editingExam ? 'Salvar Alterações' : `Publicar Prova (${questions.length} questão${questions.length > 1 ? 'ões' : ''})`}
      </Button>
    </div>
  );
}