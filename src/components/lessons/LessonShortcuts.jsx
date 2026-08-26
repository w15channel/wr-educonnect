import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ClipboardList, MessagesSquare } from 'lucide-react';

/**
 * Atalhos de integração da aula: leva o aluno da aula recém-assistida
 * direto para a Tarefa do módulo (conteúdo fresco = melhor aproveitado)
 * e para a Sala de Debates. Aulas fora da sequência da apostila
 * (boas-vindas, fundamentos etc.) mostram apenas o atalho de debates.
 */
export default function LessonShortcuts({ lesson }) {
  const location = useLocation();
  const base = location.pathname.split('/').filter(Boolean)[0];
  const prefix = base === 'adm' || base === 'student' ? `/${base}` : '';

  const hasTask = lesson.module_type === 'apostila' && Number(lesson.module_number) > 0;

  return (
    <div className="space-y-2">
      {hasTask && (
        <Link
          to={`${prefix}/tasks`}
          className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/8 px-4 py-3 transition-colors hover:bg-primary/15"
        >
          <ClipboardList size={16} className="mt-0.5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-bold text-primary">Fazer a Tarefa desta aula</p>
            <p className="text-xs text-muted-foreground">
              A tarefa do Módulo {lesson.module_number} foi elaborada a partir deste conteúdo. Faça agora,
              com a aula fresca na memória — é assim que o aprendizado realmente se fixa.
            </p>
          </div>
        </Link>
      )}
      <Link
        to={`${prefix}/debates`}
        className="flex items-start gap-3 rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 transition-colors hover:bg-purple-500/20"
      >
        <MessagesSquare size={16} className="mt-0.5 shrink-0 text-purple-500" />
        <div>
          <p className="text-sm font-bold text-purple-600 dark:text-purple-300">Gostou do Tema e quer Falar Sobre ele?</p>
          <p className="text-xs text-muted-foreground">
            Que tal abrir um debate sobre esse tema ou responder os debates abertos por seus colegas.
            Discutir sobre o assunto amadurece o tema que você acabou de estudar.
          </p>
        </div>
      </Link>
    </div>
  );
}