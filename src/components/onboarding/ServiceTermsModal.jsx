import React, { useState } from 'react';
import { Shield, GraduationCap, Award, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ServiceTermsModal({ studentName, onAccept }) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [checked, setChecked] = useState(false);

  const handleScroll = (e) => {
    const el = e.target;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setScrolledToBottom(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      {/* Modal container */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden" style={{ height: 'calc(100dvh - 80px)', maxHeight: '90vh' }}>
        {/* Header */}
        <div className="bg-gradient-to-br from-[#1e3a8a] to-[#5b5ef4] p-6 text-white shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 bg-white/15 rounded-2xl flex items-center justify-center">
              <Shield size={22} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Termo de Prestação de Serviços</h2>
              <p className="text-white/60 text-xs">WR — Instituto de Desenvolvimento Humano</p>
            </div>
          </div>
          <p className="text-white/80 text-sm">Olá, <strong>{studentName}</strong>! Antes de continuar, leia e aceite nossos termos.</p>
        </div>

        {/* Scrollable content — with extra bottom padding so content isn't hidden behind floating footer */}
        <div
          className="flex-1 overflow-y-auto p-6 space-y-5 text-sm text-gray-700"
          style={{ paddingBottom: '7rem' }}
          onScroll={handleScroll}
        >
          {/* LGPD */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Shield size={16} className="text-[#5b5ef4]" />
              <h3 className="font-bold text-gray-800">Proteção de Dados — LGPD</h3>
            </div>
            <p className="leading-relaxed text-gray-600">
              Em conformidade com a <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</strong>, o WR — Instituto de Desenvolvimento Humano coleta e trata seus dados pessoais exclusivamente para fins educacionais, incluindo nome, e-mail, WhatsApp, data de nascimento e foto de perfil.
            </p>
            <ul className="mt-2 space-y-1 list-none">
              {[
                'Seus dados são armazenados com segurança e não serão vendidos a terceiros.',
                'Você pode solicitar exclusão ou alteração de seus dados a qualquer momento.',
                'Os dados são utilizados apenas para gestão do curso e comunicação interna.',
                'Ao aceitar estes termos, você consente com o tratamento de seus dados.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <CheckCircle size={12} className="text-green-500 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Certificação */}
          <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap size={16} className="text-amber-600" />
              <h3 className="font-bold text-amber-800">Certificação</h3>
            </div>
            <p className="text-amber-700 text-xs leading-relaxed">
              <strong>Nossa certificadora é externa.</strong> O certificado de conclusão é emitido pela <strong>Escola Venes</strong>, que é a instituição responsável pela emissão dos certificados de formação. O credenciamento e reconhecimento são realizados pela <strong>AHDE — Associação de Homeopatia e Desenvolvimento Educacional</strong>.
            </p>
            <div className="flex items-start gap-2 mt-3 bg-amber-100 rounded-xl p-3">
              <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">
                <strong>Importante:</strong> A certificação estará disponível ao aluno apenas a partir de <strong>90% de conclusão do curso</strong>, conforme os critérios de aproveitamento da plataforma WR-EDU.
              </p>
            </div>
          </section>

          {/* Entidades parceiras */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Award size={16} className="text-[#1db89e]" />
              <h3 className="font-bold text-gray-800">Entidades Parceiras</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                <p className="font-black text-blue-700 text-sm">Escola Venes</p>
                <p className="text-[10px] text-blue-500 mt-0.5">Emissora dos Certificados</p>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                <p className="font-black text-green-700 text-sm">AHDE</p>
                <p className="text-[10px] text-green-500 mt-0.5">Credenciamento e Reconhecimento</p>
              </div>
            </div>
          </section>

          {/* Prestação de serviços */}
          <section>
            <h3 className="font-bold text-gray-800 mb-2">Prestação de Serviços Educacionais</h3>
            <p className="text-gray-600 text-xs leading-relaxed">
              O WR — Instituto de Desenvolvimento Humano oferece formação em terapia e desenvolvimento pessoal através de videoaulas, sessões ao vivo, tarefas, quizzes e práticas terapêuticas. A participação ativa do aluno é fundamental para o aproveitamento e certificação. O acesso à plataforma é pessoal e intransferível, vinculado ao código de acesso fornecido.
            </p>
          </section>

          {!scrolledToBottom && (
            <p className="text-center text-xs text-gray-400 animate-pulse">↓ Role até o final para aceitar os termos</p>
          )}
        </div>
      </div>

      {/* Floating footer — always visible at bottom, centered */}
      <div className="fixed bottom-0 left-0 right-0 z-[101] flex justify-center px-4 pb-4 pt-3 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-lg">
        <div className="w-full max-w-xl space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
              disabled={!scrolledToBottom}
              className="mt-0.5 w-4 h-4 accent-[#5b5ef4] shrink-0"
            />
            <span className={`text-xs leading-relaxed ${!scrolledToBottom ? 'text-gray-300' : 'text-gray-700'}`}>
              Li e aceito os <strong>Termos de Prestação de Serviços</strong>, estou ciente sobre a <strong>LGPD</strong>, sobre a certificação pela <strong>Escola Venes</strong> e credenciamento pela <strong>AHDE</strong>, e sobre o requisito de <strong>90% de conclusão</strong> para obtenção do certificado.
            </span>
          </label>
          <Button
            onClick={onAccept}
            disabled={!checked || !scrolledToBottom}
            className="w-full h-11 bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] text-white font-bold"
          >
            <CheckCircle size={16} className="mr-2" />
            Aceitar e Continuar
          </Button>
        </div>
      </div>
    </div>
  );
}