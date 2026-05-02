import React, { useState, useEffect } from 'react';
import { Award, ExternalLink, BookOpen, Info, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOutletContext } from 'react-router-dom';

const CERT_URL = 'https://www.venes.com.br/cursos/informacoes/434?_c_=434';
const REMINDER_KEY = 'cert_last_reminder';

export default function Certificadora() {
  const { user: session } = useOutletContext();
  const [showGuide, setShowGuide] = useState(false);
  const [reminderDismissed, setReminderDismissed] = useState(false);

  // Check if should show daily reminder
  const shouldShowReminder = () => {
    const last = localStorage.getItem(`${REMINDER_KEY}_${session?.email}`);
    if (!last) return true;
    const lastDate = new Date(last).toDateString();
    const today = new Date().toDateString();
    return lastDate !== today;
  };

  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    if (shouldShowReminder()) {
      setShowReminder(true);
    }
  }, []);

  const dismissReminder = () => {
    localStorage.setItem(`${REMINDER_KEY}_${session?.email}`, new Date().toISOString());
    setShowReminder(false);
    setReminderDismissed(true);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card flex items-center gap-3 shrink-0 flex-wrap gap-y-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md">
          <Award size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-sm text-foreground">Unidade Certificadora</h2>
          <p className="text-xs text-muted-foreground">Portal VENES — Certificação oficial</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-1.5 text-xs text-primary border border-primary/30 bg-primary/5 px-3 py-1.5 rounded-xl hover:bg-primary/10 transition-colors font-semibold"
          >
            <Info size={13} /> Como usar
          </button>
          <a
            href={CERT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border px-3 py-1.5 rounded-xl hover:bg-secondary transition-colors"
          >
            <ExternalLink size={13} /> Abrir em nova aba
          </a>
        </div>
      </div>

      {/* Daily reminder */}
      {showReminder && (
        <div className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 shrink-0">
          <Bell size={16} className="text-amber-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-800">Lembrete diário! 📚</p>
            <p className="text-xs text-amber-700 mt-0.5">Não esqueça de estudar sua apostila na Unidade Certificadora hoje.</p>
          </div>
          <button
            onClick={dismissReminder}
            className="text-xs text-amber-600 hover:text-amber-800 font-semibold shrink-0 border border-amber-300 px-2.5 py-1 rounded-lg"
          >
            Ok!
          </button>
        </div>
      )}

      {/* How-to guide */}
      {showGuide && (
        <div className="mx-4 mt-3 bg-card border border-border rounded-2xl p-4 shrink-0 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={15} className="text-primary" />
            <h3 className="font-bold text-sm text-foreground">Como estudar na plataforma certificadora</h3>
          </div>
          <ol className="space-y-2">
            {[
              { step: '1', text: 'Faça o login na plataforma VENES com seu e-mail e senha. Você pode salvar sua senha no navegador para acesso rápido.' },
              { step: '2', text: 'No menu superior esquerdo, clique em "Meus Cursos".' },
              { step: '3', text: 'Abra o curso: Psicoterapia E Terapia Cognitivo Comportamental.' },
              { step: '4', text: 'Clique em "Acessar Sala de Aula" → "Materiais de Estudo" para acessar a apostila e estudar livremente.' },
              { step: '5', text: 'Quando se sentir preparado(a), solicite a avaliação clicando em "Avaliação Diagnóstica" no portal.' },
              { step: '6', text: 'Após fazer a avaliação, comunique ao professor — ele te auxiliará pessoalmente nos próximos passos para obter o diploma.' },
            ].map(item => (
              <li key={item.step} className="flex gap-3 text-xs text-foreground">
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">{item.step}</span>
                <span className="leading-relaxed text-muted-foreground">{item.text}</span>
              </li>
            ))}
          </ol>
          <button onClick={() => setShowGuide(false)} className="mt-3 text-xs text-muted-foreground hover:text-foreground">Fechar guia</button>
        </div>
      )}

      {/* Iframe */}
      <div className="flex-1 min-h-0 mt-3 mx-0 sm:mx-0">
        <iframe
          src={CERT_URL}
          className="w-full h-full border-0"
          title="Unidade Certificadora VENES"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}