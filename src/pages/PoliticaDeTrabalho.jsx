import React from 'react';
import { Shield, CheckCircle, AlertTriangle, ExternalLink, ArrowLeft, Scale, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

const LOGO_URL = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/077216e46_textodoseupargrafoWR_20251219_192959_0000.png';
const ABED_WHITE = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/fb3aaf448_LogotipoSOMOSASSOCIADOSABED-Branco.png';

export default function PoliticaDeTrabalho() {
  return (
    <div className="min-h-screen bg-[#080b14] text-white">
      {/* Header */}
      <div className="bg-[#0d1120] border-b border-white/8 px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <a href="/" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
            <ArrowLeft size={15} /> Voltar ao site
          </a>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="WR-EDU" className="w-6 h-6 object-contain" />
            <span className="text-white/60 text-sm font-semibold">WR-EDU</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Título */}
        <div className="mb-14 text-center">
          <div className="inline-flex items-center gap-2 bg-[#5b5ef4]/10 border border-[#5b5ef4]/20 rounded-full px-4 py-1.5 mb-4">
            <Shield size={13} className="text-[#5b5ef4]" />
            <span className="text-xs font-bold text-[#5b5ef4] uppercase tracking-widest">Transparência e Ética</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-3">Política de Trabalho</h1>
          <p className="text-white/50 max-w-xl mx-auto text-sm leading-relaxed">
            Nossa política reflete o compromisso com a legalidade, transparência e respeito aos nossos alunos e à sociedade.
          </p>
        </div>

        {/* Selos de Associação */}
        <div className="bg-gradient-to-r from-[#5b5ef4]/10 via-white/4 to-[#1db89e]/10 border border-white/10 rounded-3xl p-8 mb-10">
          <p className="text-xs font-black text-white/30 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Award size={13} className="text-yellow-400" /> Associações e Reconhecimentos Institucionais
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ABED */}
            <div className="bg-white/6 border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center gap-4">
              <img
                src={ABED_WHITE}
                alt="Somos Associados ABED"
                className="h-28 object-contain"
              />
              <div>
                <p className="text-white font-bold text-sm mb-1">Associação Brasileira de Educação a Distância</p>
                <p className="text-white/50 text-xs leading-relaxed">
                  A WR-EDU é associada à ABED, habilitada a operar em conformidade com a <strong className="text-white/70">Lei nº 9.394/96</strong> (LDB) e o <strong className="text-white/70">Decreto Presidencial nº 5.154/04</strong>.
                </p>
              </div>
              <a href="https://www.abed.org.br/site/associados/consulta-associados-ativos/" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#5b5ef4] text-xs font-semibold hover:opacity-80 transition-opacity">
                <ExternalLink size={11} /> Consultar Associados Ativos
              </a>
            </div>

            {/* AHDE */}
            <div className="bg-white/6 border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center gap-4">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#1db89e]/20 to-[#5b5ef4]/20 border border-[#1db89e]/30 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-black text-[#1db89e]">AHDE</p>
                  <p className="text-[9px] text-white/40 leading-tight mt-0.5">GLOBAL</p>
                </div>
              </div>
              <div>
                <p className="text-white font-bold text-sm mb-1">Association for Human Development and Evolution</p>
                <p className="text-white/50 text-xs leading-relaxed">
                  Órgão internacional que registra e fiscaliza a atuação de profissionais inseridos em métodos terapêuticos comportamentais. Prof. William Ribeiro registrado sob o <strong className="text-white/70">ID: 00403THE</strong>.
                </p>
              </div>
              <a href="https://ahde-global.org/?lang=pt-br" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#1db89e] text-xs font-semibold hover:opacity-80 transition-opacity">
                <ExternalLink size={11} /> Verificar Registro AHDE
              </a>
            </div>
          </div>

          {/* MP-PR */}
          <div className="mt-5 bg-white/4 border border-white/8 rounded-2xl px-6 py-4 flex items-start gap-3">
            <CheckCircle size={15} className="text-[#1db89e] mt-0.5 shrink-0" />
            <p className="text-white/60 text-sm">
              Nossos cursos estão em <strong className="text-white">conformidade com os critérios do Ministério Público do Estado do Paraná</strong>, garantindo segurança jurídica para alunos e instituição.
            </p>
          </div>
        </div>

        {/* Sobre os Cursos */}
        <div className="space-y-4 mb-10">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <CheckCircle size={16} className="text-[#1db89e]" /> Sobre os Cursos
          </h2>
          <div className="bg-[#0d1120] border border-white/8 rounded-2xl p-6 space-y-4 text-sm text-white/60 leading-relaxed">
            <p>
              Todos os cursos são <strong className="text-white">totalmente on-line</strong>, com atividades práticas de técnicas terapêuticas voltadas ao acolhimento, cuidado, mediação e preservação da vida, destinados à capacitação profissional.
            </p>
            <div className="h-px bg-white/5" />
            <p>
              Os cursos são voltados para pessoas que buscam aprender, de forma prática, o uso das ferramentas terapêuticas para levar <strong className="text-white">cuidado, dignidade e empatia</strong> a quem necessitar.
            </p>
          </div>
        </div>

        {/* Aviso Legal */}
        <div className="space-y-4 mb-10">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <AlertTriangle size={16} className="text-yellow-400" /> Aviso Legal Importante
          </h2>
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6 space-y-4 text-sm leading-relaxed">
            <p className="text-yellow-200/80">
              Os cursos <strong className="text-yellow-200">não são considerados de nível superior</strong> (graduação, extensão ou pós-graduação).
            </p>
            <div className="h-px bg-yellow-500/10" />
            <p className="text-yellow-200/80">
              Os cursos <strong className="text-yellow-200">não possuem reconhecimento ou autorização</strong> de órgãos como:
              MEC, CONTRAN, DENATRAN, CIRETRAN, DETRAN, CETRAN, CONTRANDIFE, COFFITO, CRO, CRM, CFP, CREA, entre outros.
            </p>
          </div>
        </div>

        {/* Certificação */}
        <div className="space-y-4 mb-10">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Award size={16} className="text-[#5b5ef4]" /> Política de Certificação
          </h2>
          <div className="bg-[#0d1120] border border-white/8 rounded-2xl p-6 space-y-5 text-sm text-white/60 leading-relaxed">
            <p>
              Para obter o certificado é necessário estar <strong className="text-white">aprovado na avaliação</strong> e cumprir todos os requisitos dos Termos de Serviço deste site, bem como o tempo de estudo exigido.
            </p>
            <div className="flex items-start gap-3 bg-[#1db89e]/8 border border-[#1db89e]/20 rounded-xl p-4">
              <CheckCircle size={15} className="text-[#1db89e] mt-0.5 shrink-0" />
              <p className="text-white/70 text-sm">
                <strong className="text-white">Temos orgulho de afirmar</strong> que nesta Instituição não antecipamos o certificado nem retroagimos datas, pois temos profundo respeito pelos alunos que genuinamente dedicam seu tempo aos estudos e conquistam seus certificados de maneira honrosa.
              </p>
            </div>
            <p>
              É com base nesse princípio que reiteramos nosso compromisso em garantir que nossos certificados tenham <strong className="text-white">valor real e sejam considerados documentos legítimos</strong>.
            </p>
          </div>
        </div>

        {/* Aviso Penal */}
        <div className="space-y-4 mb-14">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Scale size={16} className="text-red-400" /> Responsabilidade Legal
          </h2>
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 text-sm leading-relaxed">
            <p className="text-red-200/80">
              A utilização e/ou emissão de certificados <strong className="text-red-200">sem o devido cumprimento da carga horária</strong> não apenas decepciona os alunos comprometidos, mas também pode configurar <strong className="text-red-200">crime de falsidade ideológica</strong>, conforme previsto no{' '}
              <strong className="text-red-100">Art. 299 do Código Penal Brasileiro</strong>, sujeito a pena de reclusão de um a cinco anos.
            </p>
          </div>
        </div>

        {/* Footer da página */}
        <div className="border-t border-white/8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="WR-EDU" className="w-8 h-8 object-contain" />
            <div>
              <p className="text-white font-bold text-sm">WR-EDU</p>
              <p className="text-white/30 text-xs">Escola de Formação de Terapeutas</p>
            </div>
          </div>
          {/* Assinatura */}
          <div className="text-center">
            <span style={{
              fontFamily: '"Dancing Script", "Brush Script MT", cursive',
              fontSize: 28,
              color: '#7b8fcc',
              letterSpacing: 2,
              display: 'block',
              lineHeight: 1.2,
            }}>William Ribeiro S.</span>
            <div className="w-48 border-t border-white/15 pt-2 mx-auto">
              <p className="text-white/30 text-[10px] uppercase tracking-widest">Direção Geral · WR-EDU</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1db89e]" />
            <span className="text-white/30 text-[10px] font-mono font-semibold tracking-widest">V-003-00</span>
          </div>
        </div>
      </div>
    </div>
  );
}