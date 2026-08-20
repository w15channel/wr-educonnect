import React, { useState } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';

const HOURLY_RATE = 45;
const WHATSAPP_NUMBER = '5541992531598';

const QUESTIONS = [
  { key: 'name', label: 'Qual é o seu nome completo?' },
  { key: 'age', label: 'Qual é a sua idade?' },
  { key: 'whatsapp', label: 'Qual o seu WhatsApp para contato?' },
  { key: 'hours', label: 'Quantas horas de atendimento você gostaria de contratar? (Valor: R$ 45,00/hora)' },
  { key: 'demand', label: 'Para finalizar, conte um pouco sobre sua demanda/necessidade.' },
];

export default function ServiceRequestChatModal({ serviceLabel, onClose }) {
  const [messages, setMessages] = useState([{ role: 'assistant', content: `Olá! Vou coletar algumas informações para sua contratação de ${serviceLabel}. ${QUESTIONS[0].label}` }]);
  const [answers, setAnswers] = useState({});
  const [input, setInput] = useState('');
  const [step, setStep] = useState(0);
  const [sent, setSent] = useState(false);

  const isDone = step >= QUESTIONS.length;
  const hours = Number(String(answers.hours || '').replace(',', '.')) || 0;
  const total = hours * HOURLY_RATE;

  const handleSend = () => {
    if (!input.trim() || isDone) return;
    const currentQuestion = QUESTIONS[step];
    const nextAnswers = { ...answers, [currentQuestion.key]: input.trim() };
    setAnswers(nextAnswers);
    const nextMessages = [...messages, { role: 'user', content: input.trim() }];
    const nextStep = step + 1;
    setInput('');
    if (nextStep < QUESTIONS.length) {
      nextMessages.push({ role: 'assistant', content: QUESTIONS[nextStep].label });
    } else {
      const hoursValue = Number(String(nextAnswers.hours || '').replace(',', '.')) || 0;
      nextMessages.push({ role: 'assistant', content: `Obrigado! Total estimado: ${hoursValue}h x R$ 45,00 = R$ ${(hoursValue * HOURLY_RATE).toFixed(2).replace('.', ',')}. Clique abaixo para enviar seus dados pelo WhatsApp.` });
    }
    setMessages(nextMessages);
    setStep(nextStep);
  };

  const sendToWhatsApp = () => {
    const summary = encodeURIComponent(
      `Olá! Quero contratar: ${serviceLabel}\n\n` +
      `Nome: ${answers.name || ''}\n` +
      `Idade: ${answers.age || ''}\n` +
      `WhatsApp: ${answers.whatsapp || ''}\n` +
      `Horas desejadas: ${answers.hours || ''} (Total estimado: R$ ${total.toFixed(2).replace('.', ',')})\n` +
      `Demanda: ${answers.demand || ''}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${summary}`, '_blank');
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" style={{ height: '80vh', maxHeight: '620px' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-[#5b5ef4]/5 to-[#1db89e]/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5b5ef4] to-[#1db89e] flex items-center justify-center shadow-md">
              <MessageCircle size={18} className="text-primary-foreground" />
            </div>
            <div>
              <p className="font-black text-sm text-foreground">{serviceLabel}</p>
              <p className="text-xs text-muted-foreground">Contratação · R$ 45,00/hora</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}>
                {m.content}
              </div>
            </div>
          ))}
          {isDone && (
            <div className="pt-2">
              {sent ? (
                <div className="rounded-2xl border border-border p-4 text-xs text-muted-foreground text-center">
                  Dados enviados! Em breve entraremos em contato pelo WhatsApp.
                </div>
              ) : (
                <button onClick={sendToWhatsApp} className="w-full py-3 rounded-2xl bg-[#25D366] text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                  <Send size={14} /> Enviar dados pelo WhatsApp
                </button>
              )}
            </div>
          )}
        </div>

        {!isDone && (
          <div className="p-4 border-t border-border flex gap-2 shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              placeholder="Digite sua resposta..."
              className="flex-1 h-11 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none"
            />
            <button onClick={handleSend} disabled={!input.trim()} className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40">
              <Send size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}