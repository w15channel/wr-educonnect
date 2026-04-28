import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function QuizView({ task, user, onBack }) {
  const [answers, setAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  const questions = task.quiz_questions || [];

  const handleSelect = (qIndex, optIndex) => {
    const newAnswers = [...answers];
    newAnswers[qIndex] = optIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (questions.length === 0) {
      toast.info('Esta prova ainda não possui perguntas.');
      return;
    }
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correct_index) correct++;
    });
    const grade = questions.length > 0 
      ? ((correct / questions.length) * (task.max_grade || 10)).toFixed(1) 
      : 0;

    await base44.entities.TaskSubmission.create({
      task_id: task.id,
      student_email: user.email || user.code || '',
      student_name: user.name || user.full_name || '',
      quiz_answers: answers,
      grade: Number(grade),
      status: 'graded',
    });

    setScore(grade);
    setSubmitted(true);
    toast.success(`Prova enviada! Nota: ${grade}`);
  };

  if (questions.length === 0) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <Button variant="ghost" className="gap-2 mb-4" onClick={onBack}>
          <ArrowLeft size={16} /> Voltar
        </Button>
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">Esta prova ainda não possui perguntas</p>
          <p className="text-sm mt-1">O professor precisa adicionar perguntas a esta avaliação</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <Button variant="ghost" className="gap-2 mb-4" onClick={onBack}>
        <ArrowLeft size={16} /> Voltar
      </Button>
      <h2 className="text-2xl font-bold text-foreground mb-6">{task.title}</h2>

      {submitted ? (
        <div className="bg-card p-8 rounded-2xl border border-border text-center">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground">Prova Finalizada!</h3>
          <p className="text-3xl font-bold text-primary mt-4">{score} / {task.max_grade || 10}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="bg-card p-5 rounded-2xl border border-border">
              <p className="font-semibold text-foreground mb-3">
                {qIndex + 1}. {q.question}
              </p>
              <div className="space-y-2">
                {(q.options || []).map((opt, optIndex) => (
                  <button
                    key={optIndex}
                    onClick={() => handleSelect(qIndex, optIndex)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all text-sm ${
                      answers[qIndex] === optIndex
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : 'border-border hover:border-primary/30 text-foreground'
                    }`}
                  >
                    {String.fromCharCode(65 + optIndex)}) {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <Button className="w-full" size="lg" onClick={handleSubmit}>
            Finalizar Prova
          </Button>
        </div>
      )}
    </div>
  );
}