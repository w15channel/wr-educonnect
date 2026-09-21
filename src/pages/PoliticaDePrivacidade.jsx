import React from 'react';
import { Shield, CheckCircle, ArrowLeft, Lock, Eye, Database, Share2, Cookie, AlertTriangle, FileText, Server, Users, RefreshCw, DollarSign } from 'lucide-react';
import { BRAND_CNPJ, BRAND_LEGAL_NAME, WR_PRIMARY_LOGO } from '@/lib/brand';

const ARTICLES = [
  { num: '1', icon: Shield, color: '#5b5ef4', title: 'Controladora e Abrangência', text: `A ${BRAND_LEGAL_NAME}, inscrita no CNPJ sob o nº ${BRAND_CNPJ}, atua como controladora dos dados pessoais tratados no contexto da plataforma. Esta Política descreve as práticas aplicáveis ao tratamento de dados pessoais, em conformidade com a Lei nº 13.709/2018 (LGPD), o Marco Civil da Internet e demais normas aplicáveis.` },
  { num: '2', icon: Database, color: '#1db89e', title: 'Dados Tratados e Finalidades', text: 'Poderão ser tratados dados cadastrais, de contato, identificação, matrícula, progresso acadêmico, registros de acesso, comunicações e informações necessárias à emissão de documentos. O tratamento ocorre para viabilizar cadastro, prestação dos serviços educacionais, suporte, gestão acadêmica, segurança, comunicação institucional e cumprimento de obrigações legais ou regulatórias.' },
  { num: '3', icon: Lock, color: '#a855f7', title: 'Pagamentos', text: `As informações necessárias à cobrança e à confirmação de pagamentos poderão ser tratadas por prestadores especializados. A ${BRAND_LEGAL_NAME} não mantém dados completos de cartões quando o processamento é realizado diretamente pelo ambiente do respectivo intermediador. As medidas de segurança aplicáveis dependem dos sistemas e serviços efetivamente utilizados em cada operação.` },
  { num: '4', icon: Eye, color: '#5b5ef4', title: 'Direitos do Titular', text: 'O titular poderá solicitar confirmação da existência de tratamento, acesso, correção, anonimização, bloqueio, eliminação, portabilidade, informação sobre compartilhamentos e revogação de consentimento, quando aplicável, nos termos da LGPD. O exercício dos direitos será avaliado conforme a base legal, a finalidade do tratamento e as hipóteses legais de retenção.' },
  { num: '5', icon: Share2, color: '#ef4444', title: 'Compartilhamento de Dados', text: `Os dados pessoais não são comercializados. O compartilhamento poderá ocorrer quando necessário à operação da plataforma, à prestação dos serviços, ao processamento de pagamentos, à emissão de documentos, ao suporte técnico, ao cumprimento de obrigação legal ou à proteção de direitos, sempre limitado à finalidade pertinente e sujeito às salvaguardas aplicáveis.` },
  { num: '6', icon: Cookie, color: '#f4a23d', title: 'Cookies e Registros de Navegação', text: 'A plataforma poderá utilizar cookies, identificadores e registros de navegação para autenticação, segurança, funcionamento, preferências e aperfeiçoamento do serviço. O usuário pode gerenciar cookies pelo navegador, ciente de que a desativação de determinados recursos poderá afetar a experiência e o funcionamento da plataforma.' },
  { num: '7', icon: Server, color: '#1db89e', title: 'Segurança e Retenção', text: 'São adotadas medidas técnicas e administrativas razoáveis para prevenir acessos não autorizados, perda, alteração, divulgação ou tratamento indevido de dados. Os dados serão conservados pelo período necessário às finalidades informadas, ao cumprimento de obrigações legais, regulatórias ou contratuais e ao exercício regular de direitos.' },
  { num: '8', icon: Users, color: '#5b5ef4', title: 'Interações entre Usuários', text: 'Informações compartilhadas em aulas, grupos ou outros ambientes colaborativos devem ser utilizadas exclusivamente para as finalidades do respectivo ambiente. É vedada a reprodução, gravação, divulgação ou compartilhamento de dados pessoais e conteúdos de terceiros sem autorização ou fundamento legal aplicável.' },
  { num: '9', icon: AlertTriangle, color: '#f4a23d', title: 'Incidentes de Segurança', text: `Na ocorrência de incidente de segurança que possa acarretar risco ou dano relevante aos titulares, a ${BRAND_LEGAL_NAME} adotará as medidas de contenção e apuração cabíveis e realizará as comunicações à Autoridade Nacional de Proteção de Dados e aos titulares, quando exigidas pela legislação aplicável.` },
  { num: '10', icon: CheckCircle, color: '#1db89e', title: 'Bases Legais', text: `O tratamento de dados poderá fundamentar-se, conforme o caso, na execução de contrato ou de procedimentos preliminares, no cumprimento de obrigação legal ou regulatória, no exercício regular de direitos, no legítimo interesse, observado o equilíbrio com os direitos do titular, e no consentimento, quando necessário.` },
  { num: '11', icon: RefreshCw, color: '#5b5ef4', title: 'Atualização da Política', text: 'Esta Política poderá ser atualizada para refletir alterações legais, operacionais ou tecnológicas. A versão vigente estará disponível na plataforma, com indicação da data de atualização. Quando aplicável, alterações relevantes serão comunicadas pelos canais adequados.' },
  { num: '12', icon: DollarSign, color: '#1db89e', title: 'Dados Relacionados a Bolsas e Cobranças', text: 'Os dados necessários à análise, formalização e gestão de bolsas, descontos, contribuições voluntárias e cobranças poderão ser tratados para a execução da relação educacional, controles administrativos, atendimento e cumprimento de obrigações legais. Os critérios e condições financeiros aplicáveis são apresentados nos instrumentos e comunicações pertinentes.' },
];

export default function PoliticaDePrivacidade() {
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
            <img src={WR_PRIMARY_LOGO} alt={BRAND_LEGAL_NAME} className="w-6 h-6 object-contain" />
            <span className="text-white/60 text-sm font-semibold">{BRAND_LEGAL_NAME}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Título */}
        <div className="mb-14 text-center">
          <div className="inline-flex items-center gap-2 bg-[#1db89e]/10 border border-[#1db89e]/20 rounded-full px-4 py-1.5 mb-4">
            <Shield size={13} className="text-[#1db89e]" />
            <span className="text-xs font-bold text-[#1db89e] uppercase tracking-widest">LGPD · Lei nº 13.709/2018</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-3">Política de Privacidade</h1>
          <p className="text-white/50 max-w-xl mx-auto text-sm leading-relaxed">
            Informações sobre o tratamento de dados pessoais no contexto dos serviços educacionais e da utilização da plataforma.
          </p>
          <p className="text-white/30 text-xs mt-3">Última atualização: Setembro de 2026</p>
        </div>

        {/* Destaque LGPD */}
        <div className="bg-gradient-to-r from-[#1db89e]/10 via-white/4 to-[#5b5ef4]/10 border border-white/10 rounded-3xl p-8 mb-10">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#1db89e]/20 border border-[#1db89e]/30 flex items-center justify-center shrink-0">
              <Shield size={18} className="text-[#1db89e]" />
            </div>
            <div>
              <p className="text-white font-bold text-sm mb-2">Tratamento de dados pessoais</p>
              <p className="text-white/60 text-sm leading-relaxed">
                A {BRAND_LEGAL_NAME} atua como <strong className="text-white">Controladora de Dados</strong> no contexto desta plataforma e define as finalidades e os meios do tratamento de dados pessoais, observadas as disposições legais aplicáveis.
              </p>
            </div>
          </div>
        </div>

        {/* Artigos */}
        <div className="space-y-5 mb-14">
          {ARTICLES.map((a) => {
            const Icon = a.icon;
            return (
              <div key={a.num} className="bg-[#0d1120] border border-white/8 rounded-2xl p-6 hover:border-white/15 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: a.color + '20', border: `1px solid ${a.color}30` }}>
                    <Icon size={15} style={{ color: a.color }} />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm mb-2">
                      <span className="text-white/30 mr-2">§ {a.num}.</span>{a.title}
                    </p>
                    <p className="text-white/55 text-sm leading-relaxed">{a.text}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Canal de contato DPO */}
        <div className="bg-[#0d1120] border border-[#5b5ef4]/20 rounded-3xl p-8 mb-10">
          <p className="text-xs font-black text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
            <FileText size={13} className="text-[#5b5ef4]" /> Encarregado de Proteção de Dados (DPO)
          </p>
          <p className="text-white/60 text-sm leading-relaxed mb-4">
            Para exercer direitos como titular, solicitar informações ou encaminhar questões relacionadas à privacidade, utilize o canal oficial de suporte da plataforma. As solicitações serão tratadas nos <strong className="text-white">prazos e condições previstos na legislação aplicável</strong>.
          </p>
          <div className="bg-white/5 border border-white/8 rounded-2xl px-5 py-3 flex items-center gap-3">
            <Lock size={14} className="text-[#1db89e] shrink-0" />
            <p className="text-white/50 text-xs">As comunicações são registradas e tratadas de forma compatível com a finalidade da solicitação e com os deveres de confidencialidade aplicáveis.</p>
          </div>
        </div>

        {/* Aviso legal */}
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6 mb-10 text-sm leading-relaxed">
          <p className="text-yellow-200/80">
            <strong className="text-yellow-200">Importante:</strong> Esta Política integra o conjunto de documentos aplicáveis à relação com a plataforma e deve ser lida em conjunto com os Termos de Uso e as condições específicas de matrícula ou contratação.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-white/8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={WR_PRIMARY_LOGO} alt={BRAND_LEGAL_NAME} className="w-8 h-8 object-contain" />
            <div>
              <p className="text-white font-bold text-sm">{BRAND_LEGAL_NAME}</p>
              <p className="text-white/30 text-xs">CNPJ {BRAND_CNPJ}</p>
            </div>
          </div>
          <div className="text-center">
            <span style={{
              fontFamily: '"Dancing Script", "Brush Script MT", cursive',
              fontSize: 28,
              color: '#7b8fcc',
              letterSpacing: 2,
              display: 'block',
              lineHeight: 1.2,
            }}>Documento institucional</span>
            <div className="w-48 border-t border-white/15 pt-2 mx-auto">
              <p className="text-white/30 text-[10px] uppercase tracking-widest">Política de Privacidade · {BRAND_LEGAL_NAME}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1db89e]" />
            <span className="text-white/30 text-[10px] font-mono font-semibold tracking-widest">V-004-00</span>
          </div>
        </div>
      </div>
    </div>
  );
}