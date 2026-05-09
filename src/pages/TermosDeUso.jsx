import React from 'react';
import { Shield, CheckCircle, AlertTriangle, ArrowLeft, Scale, FileText, Lock, Users, RefreshCw, Ban } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/077216e46_textodoseupargrafoWR_20251219_192959_0000.png';

const TERMOS = [
  {
    num: '01',
    icon: FileText,
    color: '#5b5ef4',
    title: 'Acesso e Aceitação',
    text: 'O acesso e a utilização deste portal são estritamente voluntários e destinados a indivíduos que buscam capacitação profissional no âmbito das terapias integrativas e comportamentais. Ao ingressar no ambiente de aprendizagem ou navegar por suas páginas, o usuário manifesta sua aceitação automática, plena e irrestrita a todos os termos e condições aqui estabelecidos. Caso não concorde com qualquer diretriz apresentada, o usuário deverá, por decisão própria, abster-se imediatamente de utilizar a plataforma e seus serviços.',
  },
  {
    num: '02',
    icon: Shield,
    color: '#1db89e',
    title: 'Natureza Jurídica da Formação',
    text: 'A WR-EDU é uma instituição dedicada à oferta de cursos de formação profissionalizante livre, fundamentada na Lei nº 9.394/96 (Lei de Diretrizes e Bases da Educação Nacional), não se configurando como curso de graduação, extensão ou pós-graduação acadêmica. As certificações emitidas possuem caráter técnico-profissionalizante, reconhecidas pelas entidades associadas à instituição.',
  },
  {
    num: '03',
    icon: Lock,
    color: '#5b5ef4',
    title: 'Propriedade Intelectual',
    text: 'Todo o conteúdo disponibilizado na plataforma — incluindo a metodologia exclusiva da Teoria da Utilidade Comportamental, videoaulas, materiais didáticos, exercícios e recursos complementares — é de propriedade intelectual protegida e exclusiva do Professor William Ribeiro e da WR-EDU. É terminantemente proibida a reprodução, cópia, distribuição ou venda de qualquer material sem autorização prévia e expressa, sob pena de suspensão imediata do acesso e adoção das medidas legais cabíveis, inclusive ação por violação de direitos autorais nos termos da Lei nº 9.610/98.',
  },
  {
    num: '04',
    icon: Lock,
    color: '#a855f7',
    title: 'Credenciais e Intransferibilidade',
    text: 'O acesso à área do aluno é estritamente individual e intransferível. O compartilhamento de credenciais de acesso (login e senha) é considerado violação grave dos presentes termos, resultando na rescisão imediata do vínculo com a plataforma, sem direito a reembolso das quantias pagas, além de eventual apuração de responsabilidade civil.',
  },
  {
    num: '05',
    icon: Users,
    color: '#1db89e',
    title: 'Conduta em Aulas e Grupos',
    text: 'Durante as aulas em tempo real, mentorias e interações nos grupos de integração, o aluno compromete-se a manter conduta ética, respeitosa e pautada pelo sigilo absoluto das vivências e informações compartilhadas no ambiente de ensino. Qualquer violação ao dever de sigilo poderá ensejar responsabilidade civil e administrativa.',
  },
  {
    num: '06',
    icon: CheckCircle,
    color: '#1db89e',
    title: 'Responsabilidade pelo Aprendizado',
    text: 'A plataforma WR-EDU oferece as ferramentas pedagógicas, o suporte técnico e o acompanhamento necessários para o processo de aprendizagem. Contudo, a aplicação prática dos conceitos adquiridos, o desenvolvimento profissional e o sucesso na carreira são de responsabilidade exclusiva do aluno, não cabendo à instituição qualquer garantia de resultado profissional ou financeiro.',
  },
  {
    num: '07',
    icon: Scale,
    color: '#f4a23d',
    title: 'Política de Reembolso e Direito de Arrependimento',
    text: 'As transações financeiras realizadas nesta plataforma seguem rigorosamente o Código de Defesa do Consumidor (Lei nº 8.078/90). O aluno tem garantido o direito de arrependimento com reembolso integral em até 7 (sete) dias corridos após a confirmação da compra, conforme o Art. 49 do referido código, desde que formalizado por escrito junto ao suporte oficial da plataforma.',
  },
  {
    num: '08',
    icon: Users,
    color: '#5b5ef4',
    title: 'Corresponsabilidade e Convivência',
    text: 'O aluno reconhece-se como corresponsável pela harmonia, respeito e bem-estar no ambiente de ensino, comprometendo-se a utilizar linguagem positiva e manter diálogo construtivo com colegas e professores. Não serão toleradas atitudes de desrespeito, preconceito ou qualquer forma de discriminação. A WR-EDU é um espaço rigorosamente inclusivo, aberto à diversidade humana em todos os seus âmbitos.',
  },
  {
    num: '09',
    icon: Shield,
    color: '#1db89e',
    title: 'Isenção Ideológica e Rigor Científico',
    text: 'A metodologia de ensino aplicada pela WR-EDU não possui qualquer direcionamento ideológico, político ou religioso. O conteúdo é dirigido exclusivamente pelo viés científico e técnico, com a intenção estrita de educar, capacitar e fornecer aprendizagem fundamentada em evidências e práticas clínicas reconhecidas.',
  },
  {
    num: '10',
    icon: Ban,
    color: '#ef4444',
    title: 'Suspensão e Rescisão de Acesso',
    text: 'A WR-EDU reserva-se o direito de suspender ou encerrar, a qualquer tempo e sem aviso prévio, o acesso de usuários que violem os códigos de conduta, éticos e legais estabelecidos nestes Termos, visando proteger a integridade do grupo educativo e do processo formativo dos demais alunos.',
  },
  {
    num: '11',
    icon: AlertTriangle,
    color: '#f4a23d',
    title: 'Limitação de Responsabilidade Técnica',
    text: 'A WR-EDU não se responsabiliza por eventuais indisponibilidades temporárias da plataforma decorrentes de manutenções programadas, falhas em serviços de terceiros ou casos fortuitos e de força maior. Em tais situações, a instituição envidará esforços para restabelecer o acesso no menor prazo possível.',
  },
  {
    num: '12',
    icon: FileText,
    color: '#5b5ef4',
    title: 'Uso Adequado das Ferramentas Terapêuticas',
    text: 'O aluno compromete-se a utilizar as técnicas e ferramentas terapêuticas aprendidas exclusivamente para fins éticos, humanizados e de promoção do bem-estar. O uso inadequado, irresponsável ou antiético dos conhecimentos adquiridos é de inteira responsabilidade do profissional, não sendo a WR-EDU corresponsável por eventuais danos causados a terceiros.',
  },
  {
    num: '13',
    icon: Lock,
    color: '#a855f7',
    title: 'Confidencialidade dos Casos Clínicos',
    text: 'Todo e qualquer conteúdo de natureza clínica compartilhado durante as práticas supervisionadas, estudos de caso e sessões de supervisão deve ser tratado com absoluto sigilo, em conformidade com os princípios deontológicos das profissões da área da saúde e com os dispositivos legais aplicáveis.',
  },
  {
    num: '14',
    icon: Scale,
    color: '#1db89e',
    title: 'Foro e Legislação Aplicável',
    text: 'Os presentes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Para a resolução de eventuais conflitos decorrentes deste instrumento, as partes elegem o foro da Comarca de Curitiba, Estado do Paraná, com renúncia expressa a qualquer outro, por mais privilegiado que seja.',
  },
  {
    num: '15',
    icon: RefreshCw,
    color: '#5b5ef4',
    title: 'Atualização dos Termos',
    text: 'Estes Termos de Uso são dinâmicos e poderão ser revisados e atualizados periodicamente para refletir melhorias no ecossistema de aprendizagem, adequações regulatórias e ajustes nas normas vigentes de ensino livre. A continuidade no uso da plataforma após eventuais alterações implica a aceitação automática das novas condições.',
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
            <span className="text-xs font-bold text-[#5b5ef4] uppercase tracking-widest">Uso da Plataforma</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-3">Termos de Uso</h1>
          <p className="text-white/50 max-w-xl mx-auto text-sm leading-relaxed">
            Ao utilizar a plataforma WR-EDU, você concorda com os termos e condições descritos abaixo. Leia com atenção antes de prosseguir.
          </p>
          <div className="flex items-center justify-center gap-2 mt-5 text-white/30 text-xs">
            <RefreshCw size={11} />
            <span>Última atualização: Maio de 2026 · Versão 1.0</span>
          </div>
        </div>

        {/* Aviso de aceitação */}
        <div className="bg-[#5b5ef4]/8 border border-[#5b5ef4]/20 rounded-2xl px-6 py-5 mb-10 flex items-start gap-4">
          <AlertTriangle size={18} className="text-[#5b5ef4] mt-0.5 shrink-0" />
          <p className="text-white/70 text-sm leading-relaxed">
            <strong className="text-white">Aceitação implícita:</strong> O simples acesso à plataforma ou ao ambiente de aprendizagem constitui concordância plena com todos os termos aqui dispostos. Caso discorde de qualquer cláusula, abstenha-se imediatamente de utilizar os serviços da WR-EDU.
          </p>
        </div>

        {/* Lista de termos */}
        <div className="space-y-5 mb-14">
          {TERMOS.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.num} className="bg-[#0d1120] border border-white/8 rounded-2xl p-6 hover:border-white/15 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${t.color}18`, border: `1px solid ${t.color}30` }}>
                    <Icon size={16} style={{ color: t.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-black tracking-widest" style={{ color: t.color }}>Cláusula {t.num}</span>
                    </div>
                    <h3 className="text-white font-bold text-sm mb-2">{t.title}</h3>
                    <p className="text-white/55 text-sm leading-relaxed">{t.text}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Citação final */}
        <div className="bg-gradient-to-r from-[#5b5ef4]/10 via-white/4 to-[#1db89e]/10 border border-white/10 rounded-3xl p-8 mb-10 text-center">
          <p className="text-white/80 text-lg italic leading-relaxed mb-3">
            "A excelência nasce do compromisso diário com a ética, o respeito e a busca genuína pelo crescimento do próximo."
          </p>
          <p className="text-[#5b5ef4] text-sm font-bold">— WR-EDU</p>
          <p className="text-white/40 text-xs mt-4">Estes termos foram elaborados para proteger alunos, professores e a integridade do processo formativo.</p>
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
            <span className="text-white/30 text-[10px] font-mono font-semibold tracking-widest">V-001-00</span>
          </div>
        </div>
      </div>
    </div>
  );
}