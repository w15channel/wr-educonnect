import React from 'react';
import { Shield, CheckCircle, AlertTriangle, ArrowLeft, FileText, Lock, Users, RefreshCw, Ban, DollarSign, BookOpen } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/077216e46_textodoseupargrafoWR_20251219_192959_0000.png';

const TERMS = [
  {
    num: '1',
    icon: FileText,
    color: '#5b5ef4',
    title: 'Aceitação dos Termos',
    text: 'O acesso e a utilização deste portal são estritamente voluntários e destinados a indivíduos que buscam capacitação profissional no âmbito das terapias integrativas e comportamentais. Ao ingressar no ambiente de aprendizagem ou navegar por suas páginas, o usuário manifesta sua aceitação automática, plena e irrestrita a todos os termos e condições aqui estabelecidos. Caso o usuário não concorde com qualquer uma das diretrizes apresentadas, deverá, por decisão própria, abster-se imediatamente de utilizar a plataforma e seus serviços.',
  },
  {
    num: '2',
    icon: BookOpen,
    color: '#1db89e',
    title: 'Natureza Jurídica da Instituição',
    text: 'A WR-EDU é uma instituição dedicada à oferta de cursos de formação profissionalizante livre, fundamentada na Lei nº 9.394/96 (Lei de Diretrizes e Bases da Educação Nacional), não se configurando como curso de graduação ou pós-graduação acadêmica. As certificações emitidas possuem caráter técnico e profissionalizante, com validade reconhecida no âmbito das terapias integrativas e comportamentais.',
  },
  {
    num: '3',
    icon: Shield,
    color: '#5b5ef4',
    title: 'Propriedade Intelectual',
    text: 'Todo o conteúdo disponibilizado na plataforma — incluindo a metodologia exclusiva da Teoria da Utilidade Comportamental, videoaulas, materiais didáticos, textos e recursos interativos — é de propriedade intelectual protegida e exclusiva do Professor William Ribeiro e da WR-EDU. É terminantemente proibida a reprodução, cópia, distribuição ou venda de qualquer material sem autorização prévia e por escrito, sob pena de suspensão imediata do acesso e adoção das medidas legais cabíveis, incluindo ação por danos materiais e morais.',
  },
  {
    num: '4',
    icon: Lock,
    color: '#a855f7',
    title: 'Acesso Individual e Intransferibilidade',
    text: 'O acesso à área do aluno é estritamente individual e intransferível. O compartilhamento de credenciais de acesso (login e senha) é considerado uma violação grave destes Termos e resultará na rescisão imediata do vínculo educacional sem direito a reembolso de qualquer valor pago. Cada aluno é responsável pela guarda e confidencialidade de suas credenciais.',
  },
  {
    num: '5',
    icon: Users,
    color: '#1db89e',
    title: 'Conduta Ética e Sigilo',
    text: 'Durante as aulas em tempo real, interações nos grupos de integração e demais ambientes da plataforma, o aluno compromete-se a manter uma conduta ética, respeitosa e pautada pelo sigilo absoluto das vivências, casos clínicos e informações pessoais compartilhadas. A WR-EDU é um espaço rigorosamente inclusivo e não tolerará atitudes de desrespeito, preconceito ou qualquer forma de discriminação. O aluno reconhece-se como corresponsável pela harmonia e bem-estar do ambiente de ensino, comprometendo-se ao diálogo construtivo com colegas e professores.',
  },
  {
    num: '6',
    icon: CheckCircle,
    color: '#1db89e',
    title: 'Responsabilidade pelo Aprendizado',
    text: 'A plataforma oferece as ferramentas, o suporte técnico e o acompanhamento pedagógico necessários para o aprendizado. Contudo, a aplicação prática dos conceitos adquiridos, o desempenho nas avaliações e o êxito profissional são de responsabilidade exclusiva do aluno. A metodologia aplicada não possui direcionamento ideológico, sendo orientada exclusivamente pelo amparo científico, com a intenção estrita de educar e fornecer aprendizagem técnica de qualidade.',
  },
  {
    num: '7',
    icon: DollarSign,
    color: '#f4a23d',
    title: 'Transações Financeiras e Direito de Arrependimento',
    text: 'As transações financeiras e o direito de arrependimento seguem rigorosamente o Código de Defesa do Consumidor (Lei nº 8.078/90), garantindo ao aluno o direito ao reembolso integral em até 7 (sete) dias corridos após a confirmação da compra, desde que solicitado formalmente. Após este prazo, não caberá restituição de valores pagos referentes ao período em curso.',
  },
  {
    num: '8',
    icon: RefreshCw,
    color: '#5b5ef4',
    title: 'Sistema de Locação de Acesso e Renovação Parcial',
    text: 'O uso da plataforma opera em regime de locação de acesso por período determinado, vinculado à duração do curso matriculado. Caso o aluno não conclua a carga horária mínima exigida ou não obtenha aprovação nas avaliações ao término do período regular, poderá solicitar uma Renovação Parcial de Acesso, que será concedida pelo valor equivalente a 50% da mensalidade padrão do curso. Importante: durante o período de renovação parcial, o acompanhamento de tutor não estará disponível, sendo este serviço exclusivo das turmas em vigência regular. O aluno terá acesso ao conteúdo gravado para fins de revisão e complementação, sem suporte pedagógico individualizado.',
  },
  {
    num: '9',
    icon: Ban,
    color: '#ef4444',
    title: 'Suspensão e Rescisão de Acesso',
    text: 'A WR-EDU reserva-se o direito de suspender ou rescindir o acesso de usuários que violem os códigos de conduta, os direitos de propriedade intelectual ou quaisquer outras disposições estabelecidas nestes Termos, visando proteger a integridade do grupo e do processo educativo. Em casos de rescisão por infração, não haverá direito a reembolso.',
  },
  {
    num: '10',
    icon: FileText,
    color: '#1db89e',
    title: 'Atualizações dos Termos',
    text: 'Estes Termos de Uso são dinâmicos e poderão ser atualizados periodicamente para refletir melhorias no ecossistema de aprendizagem, ajustes nas normas vigentes de ensino livre ou exigências legais. O usuário será notificado sobre alterações relevantes e o uso continuado da plataforma após qualquer atualização implicará na aceitação automática das novas condições.',
  },
];

export default function TermosDeUso() {
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
            <FileText size={13} className="text-[#5b5ef4]" />
            <span className="text-xs font-bold text-[#5b5ef4] uppercase tracking-widest">Documento Legal</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-3">Termos de Uso</h1>
          <p className="text-white/50 max-w-xl mx-auto text-sm leading-relaxed">
            Ao utilizar a plataforma WR-EDU, o usuário declara ter lido, compreendido e concordado integralmente com os termos a seguir.
          </p>
          <p className="text-white/30 text-xs mt-3">Última atualização: Maio de 2026</p>
        </div>

        {/* Termos */}
        <div className="space-y-5 mb-14">
          {TERMS.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.num} className="bg-[#0d1120] border border-white/8 rounded-2xl p-6 hover:border-white/15 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: t.color + '20', border: `1px solid ${t.color}30` }}>
                    <Icon size={15} style={{ color: t.color }} />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm mb-2">
                      <span className="text-white/30 mr-2">Art. {t.num}.</span>{t.title}
                    </p>
                    <p className="text-white/55 text-sm leading-relaxed">{t.text}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Destaque Renovação Parcial */}
        <div className="bg-gradient-to-r from-[#5b5ef4]/10 via-white/4 to-[#1db89e]/10 border border-white/10 rounded-3xl p-8 mb-10">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#f4a23d]/15 border border-[#f4a23d]/30 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} className="text-[#f4a23d]" />
            </div>
            <div>
              <p className="text-white font-bold text-sm mb-2">Aviso sobre Renovação Parcial de Acesso</p>
              <p className="text-white/60 text-sm leading-relaxed">
                O período de renovação parcial tem caráter exclusivamente de <strong className="text-white">revisão e complementação de conteúdo gravado</strong>. Não inclui acesso a aulas ao vivo, suporte de tutor, participação em grupos de integração da turma ativa nem emissão de certificado. A renovação é uma cortesia oferecida ao aluno que, por razões justificadas, não concluiu o curso no período regular.
              </p>
            </div>
          </div>
        </div>

        {/* Aviso legal geral */}
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6 mb-10 text-sm leading-relaxed">
          <p className="text-yellow-200/80">
            <strong className="text-yellow-200">Atenção:</strong> Os presentes Termos de Uso foram redigidos em conformidade com a legislação brasileira vigente, incluindo a Lei nº 9.394/96 (LDB), a Lei nº 8.078/90 (CDC) e as disposições aplicáveis ao ensino livre. Para questões relativas ao tratamento de dados pessoais (LGPD), consulte nossa Política de Privacidade.
          </p>
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