import React from 'react';
import { Shield, CheckCircle, ArrowLeft, Lock, Eye, Database, Share2, Cookie, AlertTriangle, FileText, Server, Users, RefreshCw } from 'lucide-react';
import { BRAND_CNPJ, BRAND_LEGAL_NAME, WR_PRIMARY_LOGO } from '@/lib/brand';

const ARTICLES = [
  {
    num: '1',
    icon: Shield,
    color: '#5b5ef4',
    title: 'Compromisso com a Privacidade',
    text: `A ${BRAND_LEGAL_NAME} reafirma seu compromisso com a segurança e a privacidade de todos os seus usuários, tratando a proteção de dados pessoais como um pilar fundamental da nossa relação de confiança. CNPJ ${BRAND_CNPJ}. Esta Política de Privacidade é regida pela Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018), pelo Marco Civil da Internet (Lei nº 12.965/2014) e pelas normativas que regulamentam a transparência de informações em plataformas de ensino online credenciadas.`,
  },
  {
    num: '2',
    icon: Database,
    color: '#1db89e',
    title: 'Dados Coletados e Finalidade',
    text: 'Coletamos apenas os dados estritamente necessários para o ingresso, identificação e gestão acadêmica na plataforma — como nome completo, CPF, data de nascimento, telefone e e-mail — essenciais para a criação do histórico de aprendizagem e emissão de certificados com validade legal. As informações coletadas têm como finalidade exclusiva o gerenciamento do seu progresso acadêmico, a comunicação direta sobre o curso e o suporte técnico necessário durante a jornada EAD. Não solicitamos dados que excedam essa necessidade.',
  },
  {
    num: '3',
    icon: Lock,
    color: '#a855f7',
    title: 'Dados Financeiros e Segurança de Pagamentos',
    text: `Os dados financeiros utilizados no ato da compra são processados exclusivamente por gateways de pagamento certificados com criptografia de ponta a ponta (padrão PCI-DSS), garantindo que a ${BRAND_LEGAL_NAME} não armazene, em nenhuma hipótese, informações sensíveis de cartões de crédito ou débito. Toda transação é processada em ambiente seguro e auditável.`,
  },
  {
    num: '4',
    icon: Eye,
    color: '#5b5ef4',
    title: 'Transparência e Direitos do Titular',
    text: 'Em observância ao princípio da transparência previsto na LGPD, o usuário tem o direito de solicitar, a qualquer momento: (a) acesso aos seus dados pessoais armazenados; (b) correção de informações incompletas, inexatas ou desatualizadas; (c) anonimização, bloqueio ou eliminação de dados desnecessários; (d) portabilidade dos dados a outro fornecedor de serviço; (e) exclusão definitiva dos dados pessoais tratados com base no seu consentimento. As solicitações devem ser encaminhadas ao nosso canal oficial de suporte e serão atendidas no prazo legal.',
  },
  {
    num: '5',
    icon: Share2,
    color: '#ef4444',
    title: 'Não Comercialização de Dados',
    text: `A ${BRAND_LEGAL_NAME} compromete-se expressamente a não vender, alugar, ceder ou compartilhar seus dados pessoais com terceiros para fins comerciais, publicitários ou estranhos ao escopo do seu curso profissionalizante. Eventuais parceiros técnicos que necessitem de acesso a dados para prestação de serviços (como plataformas de emissão de certificados e sistemas de pagamento) estão contratualmente vinculados às mesmas obrigações de confidencialidade e segurança exigidas por esta política.`,
  },
  {
    num: '6',
    icon: Cookie,
    color: '#f4a23d',
    title: 'Uso de Cookies e Tecnologias de Rastreamento',
    text: 'Utilizamos tecnologias de rastreamento (cookies de sessão e cookies funcionais) apenas para otimizar a sua experiência de navegação, garantir que o progresso das aulas seja salvo corretamente na sua área do aluno e manter a segurança da sessão autenticada. Não utilizamos cookies de rastreamento publicitário ou de perfil comportamental para fins externos à plataforma.',
  },
  {
    num: '7',
    icon: Server,
    color: '#1db89e',
    title: 'Armazenamento e Segurança dos Dados',
    text: 'O armazenamento das informações ocorre em servidores com padrões internacionais de segurança digital (incluindo criptografia em repouso e em trânsito), visando proteger o aluno contra acessos não autorizados, vazamentos acidentais ou ataques cibernéticos. Os registros de acesso são mantidos pelo tempo necessário ao cumprimento das obrigações legais e regulatórias vinculadas ao setor educacional, conforme previsto no Art. 15 do Marco Civil da Internet.',
  },
  {
    num: '8',
    icon: Users,
    color: '#5b5ef4',
    title: 'Privacidade Mútua nas Interações',
    text: 'Durante as interações em tempo real, grupos de integração e demais ambientes colaborativos da plataforma, a proteção da privacidade é uma responsabilidade compartilhada. É dever de cada aluno não divulgar, reproduzir ou compartilhar dados pessoais, vivências ou informações de colegas sem o devido consentimento expresso do titular. A violação desta disposição poderá resultar nas sanções previstas nos Termos de Uso.',
  },
  {
    num: '9',
    icon: AlertTriangle,
    color: '#f4a23d',
    title: 'Incidentes de Segurança',
    text: `Na hipótese improvável de incidente de segurança que possa acarretar risco ou dano relevante aos titulares, a ${BRAND_LEGAL_NAME} se compromete a comunicar a ocorrência à Autoridade Nacional de Proteção de Dados (ANPD) e aos usuários afetados, no prazo previsto em lei, descrevendo a natureza dos dados afetados e as medidas adotadas para mitigação.`,
  },
  {
    num: '10',
    icon: CheckCircle,
    color: '#1db89e',
    title: 'Base Legal para o Tratamento',
    text: `O tratamento de dados pessoais realizado pela ${BRAND_LEGAL_NAME} está fundamentado nas seguintes bases legais previstas no Art. 7º da LGPD: (i) consentimento do titular, formalizado no ato de cadastro na plataforma; (ii) execução de contrato ou de procedimentos preliminares relacionados ao contrato do qual o titular é parte; e (iii) cumprimento de obrigação legal ou regulatória pelo controlador.`,
  },
  {
    num: '11',
    icon: RefreshCw,
    color: '#5b5ef4',
    title: 'Atualização desta Política',
    text: 'Esta Política de Privacidade é dinâmica e poderá ser atualizada para garantir que o direito à privacidade e o acesso à informação estejam sempre adequados diante de novas tecnologias, mudanças legislativas ou aprimoramentos nos nossos serviços. O usuário será notificado sobre alterações relevantes, e o uso continuado da plataforma após a publicação das atualizações implicará na aceitação das novas condições.',
  },
];

export default function PoliticaDePrivacidade() {
  return (
    <div className="min-h-screen bg-[#080b14] text-primary-foreground">
      {/* Header */}
      <div className="bg-[#0d1120] border-b border-border/8 px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <a href="/" className="flex items-center gap-2 text-primary-foreground/40 hover:text-primary-foreground transition-colors text-sm">
            <ArrowLeft size={15} /> Voltar ao site
          </a>
          <div className="h-4 w-px bg-card/10" />
          <div className="flex items-center gap-2">
            <img src={WR_PRIMARY_LOGO} alt={BRAND_LEGAL_NAME} className="w-6 h-6 object-contain" />
            <span className="text-primary-foreground/60 text-sm font-semibold">{BRAND_LEGAL_NAME}</span>
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
          <h1 className="text-4xl font-black text-primary-foreground mb-3">Política de Privacidade</h1>
          <p className="text-primary-foreground/50 max-w-xl mx-auto text-sm leading-relaxed">
            Seus dados estão protegidos. Conheça como coletamos, usamos e guardamos suas informações com responsabilidade e transparência.
          </p>
          <p className="text-primary-foreground/30 text-xs mt-3">Última atualização: Maio de 2026</p>
        </div>

        {/* Destaque LGPD */}
        <div className="bg-gradient-to-r from-[#1db89e]/10 via-white/4 to-[#5b5ef4]/10 border border-border/10 rounded-3xl p-8 mb-10">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#1db89e]/20 border border-[#1db89e]/30 flex items-center justify-center shrink-0">
              <Shield size={18} className="text-[#1db89e]" />
            </div>
            <div>
              <p className="text-primary-foreground font-bold text-sm mb-2">Seus dados são tratados com responsabilidade</p>
              <p className="text-primary-foreground/60 text-sm leading-relaxed">
                A {BRAND_LEGAL_NAME} atua como <strong className="text-primary-foreground">Controladora de Dados</strong> nos termos da LGPD, sendo responsável pelas decisões referentes ao tratamento dos seus dados pessoais. Nosso compromisso é coletar o mínimo necessário, com finalidade clara e proteção máxima.
              </p>
            </div>
          </div>
        </div>

        {/* Artigos */}
        <div className="space-y-5 mb-14">
          {ARTICLES.map((a) => {
            const Icon = a.icon;
            return (
              <div key={a.num} className="bg-[#0d1120] border border-border/8 rounded-2xl p-6 hover:border-border/15 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: a.color + '20', border: `1px solid ${a.color}30` }}>
                    <Icon size={15} style={{ color: a.color }} />
                  </div>
                  <div>
                    <p className="text-primary-foreground font-bold text-sm mb-2">
                      <span className="text-primary-foreground/30 mr-2">§ {a.num}.</span>{a.title}
                    </p>
                    <p className="text-primary-foreground/55 text-sm leading-relaxed">{a.text}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Canal de contato DPO */}
        <div className="bg-[#0d1120] border border-[#5b5ef4]/20 rounded-3xl p-8 mb-10">
          <p className="text-xs font-black text-primary-foreground/30 uppercase tracking-widest mb-4 flex items-center gap-2">
            <FileText size={13} className="text-[#5b5ef4]" /> Encarregado de Proteção de Dados (DPO)
          </p>
          <p className="text-primary-foreground/60 text-sm leading-relaxed mb-4">
            Para exercer seus direitos como titular de dados, solicitar informações ou reportar qualquer questão relacionada à privacidade, entre em contato com nosso encarregado pelo canal oficial de suporte da plataforma. Todas as solicitações serão respondidas no prazo de até <strong className="text-primary-foreground">15 (quinze) dias úteis</strong>, conforme previsto na LGPD.
          </p>
          <div className="bg-card/5 border border-border/8 rounded-2xl px-5 py-3 flex items-center gap-3">
            <Lock size={14} className="text-[#1db89e] shrink-0" />
            <p className="text-primary-foreground/50 text-xs">As comunicações são tratadas com sigilo e respondidas diretamente pela direção da {BRAND_LEGAL_NAME}.</p>
          </div>
        </div>

        {/* Aviso legal */}
        <div className="bg-accent/5 border border-primary/20 rounded-2xl p-6 mb-10 text-sm leading-relaxed">
          <p className="text-primary/80">
            <strong className="text-primary">Importante:</strong> A presente Política de Privacidade não substitui os Termos de Uso da plataforma. Recomendamos a leitura conjunta de ambos os documentos para total compreensão dos direitos e deveres envolvidos na relação educacional com a {BRAND_LEGAL_NAME}.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-border/8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={WR_PRIMARY_LOGO} alt={BRAND_LEGAL_NAME} className="w-8 h-8 object-contain" />
            <div>
              <p className="text-primary-foreground font-bold text-sm">{BRAND_LEGAL_NAME}</p>
              <p className="text-primary-foreground/30 text-xs">CNPJ {BRAND_CNPJ}</p>
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
            <div className="w-48 border-t border-border/15 pt-2 mx-auto">
              <p className="text-primary-foreground/30 text-[10px] uppercase tracking-widest">Direção Geral · {BRAND_LEGAL_NAME}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-card/5 border border-border/8 rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1db89e]" />
            <span className="text-primary-foreground/30 text-[10px] font-mono font-semibold tracking-widest">V-003-00</span>
          </div>
        </div>
      </div>
    </div>
  );
}
