/**
 * AIExamGenerator
 * ──────────────────────────────────────────────────────────────────
 * Gerador automático de provas baseado no conteúdo da Apostila.
 * O admin seleciona o módulo, formato (múltipla escolha / discursiva),
 * prazo, quantidade de questões e pontuação total.
 * A IA gera as questões com base no texto completo do módulo.
 */
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { adminApi } from '@/lib/adminApi';
import {
  Sparkles, Loader2, ChevronLeft, GraduationCap,
  List, AlignLeft, AlertCircle, CheckCircle, Calendar, Hash, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// Import all modules
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

const ALL_MODULES = [MOD1, MOD2, MOD3, MOD4, MOD5, MOD6, MOD7, MOD8, MOD9, MOD10];

// Build module content — limit to ~6000 chars per lesson to avoid LLM context overflow
function buildModuleContent(mod) {
  const MAX_CHARS_PER_LESSON = 4000;
  return mod.lessons.map(l => {
    const content = l.content.length > MAX_CHARS_PER_LESSON
      ? l.content.slice(0, MAX_CHARS_PER_LESSON) + '\n[...conteúdo resumido]'
      : l.content;
    return `=== ${l.title} ===\n\n${content}`;
  }).join('\n\n---\n\n');
}

// Generation steps for the stepper UI
const STEPS = ['Módulo', 'Configurações', 'Geração', 'Revisão'];

export default function AIExamGenerator({ onBack, course }) {
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [selectedMod, setSelectedMod] = useState(null);
  const [useCustomText, setUseCustomText] = useState(false);
  const [customText, setCustomText] = useState('');
  const [format, setFormat] = useState('choice'); // 'choice' | 'text' | 'mixed'
  const [questionCount, setQuestionCount] = useState(10);
  const [deadline, setDeadline] = useState('');
  const [maxGrade, setMaxGrade] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState(null);
  const [examTitle, setExamTitle] = useState('');
  const [examDescription, setExamDescription] = useState('');

  const saveMutation = useMutation({
    mutationFn: (data) => adminApi.create('Exam', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success('Prova publicada com sucesso!');
      onBack();
    },
    onError: (err) => {
      toast.error(`Erro ao publicar prova: ${err.message}`);
    },
  });

  const handleSelectModule = (mod) => {
    setSelectedMod(mod);
    setExamTitle(`Prova — ${mod.title}`);
    setExamDescription(`Prova gerada automaticamente com base no conteúdo completo do ${mod.title}. Leia com atenção cada questão antes de responder.`);
    setStep(1);
  };

  const handleUseCustomText = () => {
    setUseCustomText(true);
    setExamTitle('Prova — Conteúdo Personalizado');
    setExamDescription('Prova gerada com base no texto fornecido. Leia com atenção cada questão antes de responder.');
    setStep(1);
  };

  const handleGenerate = async () => {
    if (!selectedMod && !useCustomText) return;
    setGenerating(true);
    setStep(2);

    const moduleContent = useCustomText && customText.trim()
      ? customText.trim()
      : buildModuleContent(selectedMod);
    const formatInstruction = format === 'choice'
      ? 'Todas as questões devem ser de MÚLTIPLA ESCOLHA com 4 alternativas (A, B, C, D). Apenas uma alternativa deve ser correta. Indique o índice da correta (0=A, 1=B, 2=C, 3=D).'
      : format === 'text'
      ? 'Todas as questões devem ser DISCURSIVAS. O aluno deve responder por escrito. Não inclua alternativas.'
      : 'Metade das questões deve ser de MÚLTIPLA ESCOLHA (4 alternativas, 1 correta), e a outra metade DISCURSIVA.';

    const safeCount = Math.min(questionCount, 20);
    const sourceTitle = useCustomText ? 'Texto Personalizado' : selectedMod.title;
    const sourceContent = moduleContent;
    const prompt = `Você é professor especialista em terapia comportamental. Crie EXATAMENTE ${safeCount} questões de prova com base no conteúdo abaixo.

REGRAS OBRIGATÓRIAS:
1. Baseie-se SOMENTE no conteúdo fornecido.
2. ${formatInstruction}
3. Para múltipla escolha: gere 4 alternativas por questão, com apenas 1 correta. O campo "correct_index" deve ser 0, 1, 2 ou 3.
4. Para discursiva: "options" = [] e "correct_index" = null.
5. Retorne APENAS um JSON com a chave "questions" contendo um array de ${safeCount} objetos com os campos: question (string), answer_type ("choice" ou "text"), options (array), correct_index (number ou null).

CONTEÚDO — ${sourceTitle}:
${sourceContent}`;

    const schema = {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          description: `Array com exatamente ${Math.min(questionCount, 20)} questões`,
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              answer_type: { type: 'string', enum: ['choice', 'text'] },
              options: { type: 'array', items: { type: 'string' } },
              correct_index: { type: 'number', nullable: true },
            },
            required: ['question', 'answer_type', 'options'],
          },
        },
      },
      required: ['questions'],
    };

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: schema,
        model: 'claude_sonnet_4_6',
      });

      // Defensive extraction: LLM wraps response in {response: {questions:[...]}}
      let questions = null;
      if (Array.isArray(result)) {
        questions = result;
      } else if (result && Array.isArray(result.questions)) {
        questions = result.questions;
      } else if (result?.response && Array.isArray(result.response.questions)) {
        // This is the actual LLM return format: {response: {questions: [...]}}
        questions = result.response.questions;
      } else if (result?.response && typeof result.response === 'object') {
        const firstArray = Object.values(result.response).find(v => Array.isArray(v));
        if (firstArray) questions = firstArray;
      } else if (result && typeof result === 'object') {
        // Last resort: walk all values recursively one level deep
        for (const val of Object.values(result)) {
          if (Array.isArray(val)) { questions = val; break; }
          if (val && typeof val === 'object') {
            const nested = Object.values(val).find(v => Array.isArray(v));
            if (nested) { questions = nested; break; }
          }
        }
      }

      if (!questions || questions.length === 0) {
        toast.error(`Nenhuma questão foi gerada. Resposta recebida: ${JSON.stringify(result).slice(0, 200)}`);
        setStep(1);
        return;
      }

      // Normalize each question: ensure answer_type, options and correct_index exist
      const normalized = questions.map(q => ({
        question: q.question || q.text || q.enunciado || '',
        answer_type: q.answer_type || (q.options && q.options.length > 0 ? 'choice' : 'text'),
        options: Array.isArray(q.options) ? q.options : [],
        correct_index: q.correct_index ?? q.correctIndex ?? null,
      }));

      setGeneratedQuestions(normalized);
      setStep(3);
    } catch (e) {
      toast.error(`Erro ao gerar questões: ${e.message}`);
      setStep(1);
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = () => {
    if (!generatedQuestions?.length) return;

    // Sanitize questions: for text/discursive questions, omit correct_index entirely
    // (Base44 schema rejects null for number fields, causing silent save failures)
    const sanitizedQuestions = generatedQuestions.map(q => {
      const clean = {
        question: q.question,
        answer_type: q.answer_type || 'text',
        options: Array.isArray(q.options) ? q.options : [],
      };
      // Only include correct_index for choice questions with a valid index
      if (clean.answer_type === 'choice' && q.correct_index != null) {
        clean.correct_index = q.correct_index;
      }
      return clean;
    });

    saveMutation.mutate({
      title: examTitle,
      description: examDescription,
      deadline: deadline || undefined,
      max_grade: Number(maxGrade),
      course: course || 'tcc',
      quiz_questions: sanitizedQuestions,
      module_ref: useCustomText ? 'custom' : (selectedMod?.id || ''),
      generated_by_ai: true,
      is_published: true,
    });
  };

  const updateQuestion = (qi, field, value) => {
    setGeneratedQuestions(prev => prev.map((q, i) => i === qi ? { ...q, [field]: value } : q));
  };

  const updateOption = (qi, oi, value) => {
    setGeneratedQuestions(prev => prev.map((q, i) => {
      if (i !== qi) return q;
      const opts = [...(q.options || [])];
      opts[oi] = value;
      return { ...q, options: opts };
    }));
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
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground">Gerador de Provas com IA</h2>
            <p className="text-xs text-muted-foreground">Questões geradas automaticamente pelo conteúdo da Apostila</p>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 mb-7 overflow-x-auto">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
              i === step ? 'bg-primary text-primary-foreground shadow' :
              i < step ? 'bg-emerald-500/15 text-emerald-600' :
              'bg-secondary text-muted-foreground'
            }`}>
              {i < step ? <CheckCircle size={11} /> : <span>{i + 1}</span>}
              {s}
            </div>
            {i < STEPS.length - 1 && <div className={`h-px w-5 shrink-0 ${i < step ? 'bg-emerald-400' : 'bg-border'}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* ── Step 0: Módulo ── */}
      {step === 0 && (
        <div className="space-y-3">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Selecione a origem do conteúdo</p>
          
          <button
            onClick={handleUseCustomText}
            className="w-full text-left bg-card border-2 border-primary/30 rounded-2xl p-5 hover:border-primary/60 hover:shadow-lg transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-3">
              <FileText size={18} className="text-white" />
            </div>
            <p className="font-black text-sm text-foreground leading-tight mb-1 group-hover:text-primary transition-colors">📄 Texto Personalizado</p>
            <p className="text-xs text-muted-foreground">Cole qualquer texto para a IA gerar questões baseadas nele</p>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou escolha um módulo</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
            {ALL_MODULES.map(mod => (
              <button
                key={mod.id}
                onClick={() => handleSelectModule(mod)}
                className="text-left bg-card border border-border rounded-2xl p-4 hover:border-primary/40 hover:shadow-md transition-all group"
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${mod.color || 'from-slate-500 to-slate-700'} flex items-center justify-center mb-3`}>
                  <GraduationCap size={16} className="text-white" />
                </div>
                <p className="font-black text-sm text-foreground leading-tight mb-1 group-hover:text-primary transition-colors">{mod.title}</p>
                <p className="text-xs text-muted-foreground">{mod.lessons.length} aulas · {mod.subtitle}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 1: Configurações ── */}
      {step === 1 && selectedMod && (
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <FileText size={15} /> Detalhes da Prova
            </h3>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Título</label>
              <Input value={examTitle} onChange={e => setExamTitle(e.target.value)} placeholder="Título da prova" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Instruções para o aluno</label>
              <textarea
                value={examDescription}
                onChange={e => setExamDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>

          {/* Format */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-black text-foreground">Formato das Questões</h3>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={useCustomText}
                  onChange={e => setUseCustomText(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-muted-foreground">Usar texto personalizado</span>
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { value: 'choice', icon: <List size={18} />, label: 'Múltipla Escolha', desc: 'Todas com 4 alternativas' },
                { value: 'text', icon: <AlignLeft size={18} />, label: 'Totalmente Discursiva', desc: 'Respostas abertas por escrito' },
                { value: 'mixed', icon: <><List size={14}/><AlignLeft size={14}/></>, label: 'Mista', desc: '50% cada formato' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFormat(opt.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${format === opt.value ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-secondary/30 text-muted-foreground hover:border-primary/30'}`}
                >
                  <div className="flex gap-1">{opt.icon}</div>
                  <p className="text-xs font-black text-foreground">{opt.label}</p>
                  <p className="text-[10px] text-muted-foreground text-center">{opt.desc}</p>
                </button>
              ))}
            </div>

            {useCustomText && (
              <div className="mt-4">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
                  📄 Cole o Texto Base para a IA
                </label>
                <textarea
                  value={customText}
                  onChange={e => setCustomText(e.target.value)}
                  rows={8}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none font-mono"
                  placeholder="Cole aqui o texto completo que será usado como base para gerar as questões. A IA analisará este conteúdo para criar perguntas relevantes..."
                />
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  💡 Dica: Para melhores resultados, inclua de 500 a 5000 caracteres de conteúdo bem estruturado.
                </p>
              </div>
            )}
          </div>

          {/* Numeric settings */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-black text-foreground">Parâmetros</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-1.5"><Hash size={11} /> Nº de Questões</label>
                <Input
                  type="number" min={5} max={30}
                  value={questionCount}
                  onChange={e => setQuestionCount(Math.max(5, Math.min(30, Number(e.target.value))))}
                />
                <p className="text-[10px] text-muted-foreground mt-1">Entre 5 e 30 questões</p>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-1.5"><Calendar size={11} /> Prazo Final</label>
                <Input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-1.5">🏆 Pontuação Total</label>
                <Input type="number" min={1} value={maxGrade} onChange={e => setMaxGrade(e.target.value)} />
              </div>
            </div>
          </div>

          {useCustomText ? (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
              <FileText size={16} className="text-amber-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-black text-amber-300">Texto Personalizado</p>
                <p className="text-[11px] text-amber-300/70 mt-0.5">
                  {customText.length} caracteres serão analisados pela IA para gerar {questionCount} questões.
                </p>
                {customText.length < 100 && (
                  <p className="text-[10px] text-amber-400 mt-1">⚠️ Texto muito curto. Mínimo recomendado: 100 caracteres.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-4 flex items-start gap-3">
              <Sparkles size={16} className="text-violet-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-black text-violet-300">Módulo selecionado: {selectedMod.title}</p>
                <p className="text-[11px] text-violet-300/70 mt-0.5">
                  {selectedMod.lessons.length} aulas serão analisadas pela IA para gerar {questionCount} questões cobrindo todo o conteúdo do módulo.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {useCustomText ? (
              <Button variant="outline" onClick={() => { setUseCustomText(false); setCustomText(''); }} className="gap-2">
                <ChevronLeft size={14} /> Usar módulo
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setStep(0)} className="gap-2">
                <ChevronLeft size={14} /> Trocar módulo
              </Button>
            )}
            <Button
              onClick={handleGenerate}
              disabled={useCustomText && customText.length < 50}
              className="flex-1 gap-2 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white font-black"
            >
              <Sparkles size={15} /> Gerar Questões com IA
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Gerando ── */}
      {step === 2 && generating && (
        <div className="flex flex-col items-center justify-center py-20 gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-xl shadow-violet-500/30">
              <Sparkles size={32} className="text-white" />
            </div>
            <div className="absolute -inset-2 rounded-full border-4 border-violet-400/30 animate-ping" />
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-foreground mb-1">Gerando questões com IA...</p>
            <p className="text-sm text-muted-foreground">
              {useCustomText ? 'Analisando texto personalizado' : `Analisando o conteúdo completo do ${selectedMod?.title}`}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">Isso pode levar até 30 segundos</p>
          </div>
          <Loader2 size={24} className="text-violet-400 animate-spin" />
        </div>
      )}

      {/* ── Step 3: Revisão ── */}
      {step === 3 && generatedQuestions && (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle size={18} className="text-emerald-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-black text-emerald-300">{generatedQuestions.length} questões geradas com sucesso!</p>
              <p className="text-[11px] text-emerald-300/70">Revise, edite se necessário e publique a prova.</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground">Pontuação</p>
              <p className="text-sm font-black text-foreground">{maxGrade} pts</p>
            </div>
          </div>

          {/* Exam title/description edit */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <Input value={examTitle} onChange={e => setExamTitle(e.target.value)} className="font-bold text-base" />
            <textarea
              value={examDescription}
              onChange={e => setExamDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none text-muted-foreground"
            />
          </div>

          {/* Questions list */}
          <div className="space-y-3">
            {generatedQuestions.map((q, qi) => (
              <div key={qi} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
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

          {/* Publish actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => { setStep(1); setGeneratedQuestions(null); }} className="gap-2">
              <Sparkles size={14} /> Regenerar
            </Button>
            <Button
              onClick={handlePublish}
              disabled={saveMutation.isPending}
              className="flex-1 gap-2 h-11 font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            >
              <GraduationCap size={16} />
              {saveMutation.isPending ? 'Publicando...' : `Publicar Prova (${generatedQuestions.length} questões · ${maxGrade} pts)`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}