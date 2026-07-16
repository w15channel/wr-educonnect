/**
 * ModuleBlock
 * ────────────
 * Renders a single module group (5 lessons) inside Lessons.jsx
 * Shows individual lesson cards + a module completion button.
 */
import React, { useState } from 'react';
import {
  CheckCircle, Circle, ChevronDown, ChevronUp, Play, FileText, Globe,
  MessageSquare, Pencil, Trash2, BookOpen, FileDown, Link, Clock, Trophy, Eye, EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MODULE_THEMES } from './ModuleCompletionCelebration';

const LESSON_TYPE_CONFIG = {
  video_external: { label: 'Vídeo Externo', icon: Play },
  text_written:   { label: 'Aula em Texto', icon: FileText },
  content_external: { label: 'Material Externo', icon: Globe },
};

export default function ModuleBlock({
  moduleIndex,         // 0-based
  lessons,             // 5 lessons in this module
  isTeacher,
  progresses,
  studentIdentifiers,
  unlockedLessonCount,
  globalOffset,        // how many lessons come before this module
  commentDraft, setCommentDraft,
  summaryDraft, setSummaryDraft,
  uploadStatus, uploadFile, setUploadFile,
  expandedLesson, setExpandedLesson,
  selectedVideo, setSelectedVideo,
  onToggleWatched,
  onSaveComment,
  onSaveSummary,
  onFileUpload,
  onEdit,
  onDelete,
  onToggleVisibility,
  onViewProgress,
  moduleCompletions,    // Set of completed module indices
  onCompleteModule,     // (moduleIndex) => void
}) {
  const theme = MODULE_THEMES[moduleIndex % MODULE_THEMES.length];

  const normalizeId = (v = '') => String(v || '').trim().toLowerCase();
  const getProgress = (lessonId) => progresses.find(p => p.lesson_id === lessonId && studentIdentifiers.includes(normalizeId(p.student_email)));

  // Count watched lessons in this module
  const watchedInModule = lessons.filter(l => getProgress(l.id)?.watched).length;
  const allWatched = watchedInModule >= 5;
  const isModuleCompleted = moduleCompletions?.has(moduleIndex);
  const canCompleteModule = allWatched && !isModuleCompleted && !isTeacher;

  const [moduleOpen, setModuleOpen] = useState(false);

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${isModuleCompleted ? 'border-emerald-400/40 shadow-emerald-500/10 shadow-lg' : 'border-border'} bg-card`}>
      {/* Module Header */}
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors text-left"
        onClick={() => setModuleOpen(v => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${theme.color} flex items-center justify-center shrink-0 shadow-md`}>
            <span className="text-lg">{theme.emoji}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Módulo {moduleIndex + 1}</span>
              {isModuleCompleted && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <CheckCircle size={9} /> Concluído
                </span>
              )}
            </div>
            <p className={`font-bold text-sm text-foreground leading-tight`}>{theme.label}</p>
            {!isTeacher && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {watchedInModule}/5 aulas concluídas
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {/* Progress dots */}
          <div className="hidden sm:flex items-center gap-1">
            {lessons.map((l, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${getProgress(l.id)?.watched ? 'bg-emerald-400' : 'bg-border'}`}
              />
            ))}
          </div>
          {moduleOpen ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
        </div>
      </button>

      {/* Lesson list */}
      {moduleOpen && (
        <div className="border-t border-border divide-y divide-border">
          {lessons.map((lesson, lessonIdx) => {
            const globalIdx = globalOffset + lessonIdx;
            const prog = getProgress(lesson.id);
            const isExpanded = expandedLesson === lesson.id;
            const isWatched = prog?.watched;
            const isLocked = !isTeacher && (globalIdx + 1) > unlockedLessonCount;
            const materialLinks = lesson.material_links ? lesson.material_links.split(',').map(l => l.trim()).filter(Boolean) : [];

            if (isLocked) return (
              <div key={lesson.id} className="flex items-center gap-3 p-3 sm:p-4 opacity-50">
                <div className="w-12 h-9 sm:w-20 sm:h-14 bg-muted rounded-xl flex items-center justify-center shrink-0 text-xl">🔒</div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-mono text-muted-foreground">#{String(globalIdx + 1).padStart(2, '0')}</span>
                  <h3 className="font-bold text-sm text-foreground truncate">{lesson.title}</h3>
                  <p className="text-xs text-amber-600 font-semibold mt-0.5">⏳ Será liberado pelo professor</p>
                </div>
              </div>
            );

            return (
              <div key={lesson.id} className={`transition-all ${isWatched ? 'bg-emerald-500/5' : ''} ${isTeacher && lesson.is_hidden ? 'opacity-60' : ''}`}>
                {/* Lesson row */}
                <div className="flex items-center gap-3 p-3 sm:p-4">
                  {/* Thumbnail */}
                  <div
                    className={`w-12 h-9 sm:w-20 sm:h-14 bg-muted rounded-xl overflow-hidden relative flex items-center justify-center shrink-0 ${lesson.lesson_type === 'video_external' ? 'cursor-pointer group' : 'cursor-default'}`}
                    style={{ minWidth: '3rem' }}
                    onClick={() => lesson.lesson_type === 'video_external' && setSelectedVideo(lesson)}
                  >
                    {lesson.thumbnail_url
                      ? <img src={lesson.thumbnail_url} alt={lesson.title} className="absolute inset-0 w-full h-full object-cover" />
                      : <div className={`absolute inset-0 bg-gradient-to-br ${theme.color} opacity-30`} />
                    }
                    <div className="relative w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-md z-10 group-hover:scale-110 transition-transform">
                      {lesson.lesson_type === 'text_written'
                        ? <FileText size={12} className="text-blue-500" />
                        : lesson.lesson_type === 'content_external'
                          ? <Globe size={12} className="text-green-500" />
                          : <Play size={12} className="text-primary ml-0.5" />
                      }
                    </div>
                    {lesson.duration && (
                      <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1 py-0.5 rounded z-10">{lesson.duration}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground shrink-0">#{String(globalIdx + 1).padStart(2, '0')}</span>
                      <h3 className="font-bold text-foreground text-sm leading-tight truncate">{lesson.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {isWatched && (
                        <span className="inline-flex items-center gap-1 text-green-600 text-[10px] bg-green-50 border border-green-100 px-2 py-0.5 rounded-full font-semibold">
                          <CheckCircle size={9} /> Concluída
                        </span>
                      )}
                      {isTeacher && lesson.is_hidden && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                          <EyeOff size={9} /> Oculta para alunos
                        </span>
                      )}
                      {lesson.duration && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock size={9} /> {lesson.duration}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isTeacher ? (
                      <>
                        <button onClick={() => onViewProgress(lesson)} className="p-2 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-primary transition-colors">
                          <MessageSquare size={13} />
                        </button>
                        <button onClick={() => onEdit(lesson)} className="p-2 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => onDelete(lesson.id)} className="p-2 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 size={13} />
                        </button>
                        <button
                          onClick={() => onToggleVisibility(lesson)}
                          className={`p-2 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg transition-colors ${
                            lesson.is_hidden ? 'text-red-600 hover:text-red-700' : 'text-muted-foreground hover:text-foreground'
                          }`}
                          title={lesson.is_hidden ? 'Mostrar para alunos' : 'Ocultar para alunos'}
                        >
                          {lesson.is_hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </>
                    ) : (
                      <>
                        {(() => {
                          const comment = commentDraft[lesson.id] ?? prog?.comment ?? '';
                          const summary = summaryDraft[lesson.id] ?? prog?.summary ?? '';
                          const canWatch = comment.trim() && summary.trim();
                          return (
                            <button
                              onClick={() => onToggleWatched(lesson.id)}
                              disabled={!isWatched && !canWatch}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${isWatched ? 'text-green-600 bg-green-50 border border-green-200' : canWatch ? 'text-muted-foreground bg-secondary hover:text-green-600 hover:bg-green-50 hover:border-green-200 border border-transparent' : 'text-muted-foreground/40 bg-secondary/50 border border-transparent cursor-not-allowed'}`}
                            >
                              {isWatched ? <CheckCircle size={13} /> : <Circle size={13} />}
                              <span className="hidden sm:inline">{isWatched ? 'Concluída' : canWatch ? 'Concluir' : '🔒'}</span>
                            </button>
                          );
                        })()}
                      </>
                    )}
                    <button
                      onClick={() => setExpandedLesson(isExpanded ? null : lesson.id)}
                      className="p-2 min-w-[32px] min-h-[32px] flex items-center justify-center hover:bg-secondary rounded-xl transition-colors text-muted-foreground"
                    >
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-border bg-secondary/10">
                    {lesson.description && (
                      <div className="px-4 py-3 bg-secondary/20">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Resumo da Aula</p>
                        <p className="text-sm text-foreground/80">{lesson.description}</p>
                      </div>
                    )}
                    {lesson.lesson_type === 'text_written' && lesson.text_content && (
                      <div className="px-4 py-3 border-t border-border">
                        <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5"><FileText size={13} className="text-blue-500" /> Conteúdo da Aula</p>
                        <div className="bg-secondary/30 rounded-xl p-4 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{lesson.text_content}</div>
                      </div>
                    )}
                    {lesson.lesson_type === 'content_external' && lesson.external_url && (
                      <div className="px-4 py-3 border-t border-border">
                        <a href={lesson.external_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary bg-primary/8 border border-primary/15 px-4 py-3 rounded-xl hover:bg-primary/15 transition-colors font-semibold w-full">
                          <Globe size={15} /> Acessar Material Externo
                        </a>
                      </div>
                    )}
                    {lesson.research_links && (
                      <div className="px-4 py-3 border-t border-border">
                        <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5"><Globe size={13} className="text-green-500" /> Links de Pesquisa</p>
                        <div className="flex flex-wrap gap-2">
                          {lesson.research_links.split(',').map((item, li) => {
                            const parts = item.trim().split('|');
                            const label = parts.length > 1 ? parts[0].trim() : `Pesquisa ${li + 1}`;
                            const url = parts.length > 1 ? parts[1].trim() : parts[0].trim();
                            return (
                              <a key={li} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors font-medium">
                                <Globe size={10} /> {label}
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {materialLinks.length > 0 && (
                      <div className="px-4 py-3 border-t border-border">
                        <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5"><FileDown size={13} className="text-primary" /> Materiais de Suporte</p>
                        <div className="flex flex-wrap gap-2">
                          {materialLinks.map((link, li) => (
                            <a key={li} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary bg-primary/8 border border-primary/15 px-3 py-1.5 rounded-lg hover:bg-primary/15 transition-colors font-medium">
                              <Link size={11} /> Material {li + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {isTeacher ? (
                      <div className="px-4 pb-4 pt-3 border-t border-border">
                        {(() => {
                          const entries = progresses.filter(p => p.lesson_id === lesson.id && (p.comment || p.summary || p.watched));
                          if (entries.length === 0) return <p className="text-xs text-muted-foreground italic">Nenhum aluno interagiu com esta aula ainda.</p>;
                          return (
                            <div>
                              <p className="text-xs font-bold text-muted-foreground mb-2">{entries.length} interação(ões) de alunos</p>
                              <button onClick={() => onViewProgress(lesson)} className="text-xs text-primary hover:underline font-semibold flex items-center gap-1">
                                <MessageSquare size={11} /> Ver todos os comentários →
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="px-4 pb-4 space-y-4 pt-3">
                        <div>
                          <label className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5"><BookOpen size={12} className="text-primary" /> Meu Resumo</label>
                          <Textarea placeholder="Anote os principais pontos e aprendizados..." value={summaryDraft[lesson.id] ?? prog?.summary ?? ''} onChange={e => setSummaryDraft(prev => ({ ...prev, [lesson.id]: e.target.value }))} rows={3} className="text-sm" />
                          <Button size="sm" variant="outline" className="mt-2 h-8 text-xs" onClick={() => onSaveSummary(lesson.id)}>Salvar Resumo</Button>
                          {prog?.summary && <div className="mt-2 bg-secondary/50 rounded-xl p-3"><p className="text-[10px] text-muted-foreground font-semibold mb-1">Resumo salvo:</p><p className="text-xs text-foreground/80">{prog.summary}</p></div>}
                        </div>
                        <div>
                          <label className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5"><MessageSquare size={12} className="text-accent" /> Meu Comentário</label>
                          <Textarea placeholder="Compartilhe sua percepção sobre esta aula..." value={commentDraft[lesson.id] ?? prog?.comment ?? ''} onChange={e => setCommentDraft(prev => ({ ...prev, [lesson.id]: e.target.value }))} rows={2} className="text-sm" />
                          <Button size="sm" variant="outline" className="mt-2 h-8 text-xs" onClick={() => onSaveComment(lesson.id)}>Salvar Comentário</Button>
                        </div>
                        {(() => {
                          const comment = commentDraft[lesson.id] ?? prog?.comment ?? '';
                          const summary = summaryDraft[lesson.id] ?? prog?.summary ?? '';
                          const canWatch = comment.trim() && summary.trim();
                          if (isWatched) return null;
                          return (
                            <div className={`rounded-xl p-3 border text-xs flex items-center gap-2 ${canWatch ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                              {canWatch
                                ? <p className="text-green-700 font-semibold flex-1">✅ Pronto! Você pode concluir esta aula.</p>
                                : <p className="text-amber-700 font-semibold flex-1">🔒 Preencha o <strong>Resumo</strong> e o <strong>Comentário</strong> para liberar a conclusão.</p>
                              }
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Module completion button */}
          {!isTeacher && (
            <div className={`p-4 border-t ${isModuleCompleted ? 'bg-emerald-500/5 border-emerald-400/20' : 'border-border'}`}>
              {isModuleCompleted ? (
                <div className="flex items-center gap-3 justify-center py-2">
                  <Trophy size={20} className="text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-500">Módulo {moduleIndex + 1} concluído! Excelente trabalho! 🎉</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  {!allWatched && (
                    <p className="text-xs text-muted-foreground text-center">
                      Conclua todas as {5 - watchedInModule} aulas restantes para desbloquear a conclusão do módulo.
                    </p>
                  )}
                  <div className="flex items-center gap-2 w-full justify-between">
                    {/* Progress bar */}
                    <div className="flex-1 bg-border rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${theme.color} transition-all duration-500`}
                        style={{ width: `${(watchedInModule / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground shrink-0 ml-2">{watchedInModule}/5</span>
                  </div>
                  <button
                    onClick={() => canCompleteModule && onCompleteModule(moduleIndex)}
                    disabled={!canCompleteModule}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                      canCompleteModule
                        ? `bg-gradient-to-r ${theme.color} text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]`
                        : 'bg-secondary text-muted-foreground cursor-not-allowed opacity-60'
                    }`}
                  >
                    <Trophy size={16} />
                    {canCompleteModule ? `✨ Concluir Módulo ${moduleIndex + 1}` : `🔒 Conclua todas as aulas para liberar`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}