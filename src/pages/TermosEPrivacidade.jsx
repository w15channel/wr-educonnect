import React, { useState } from 'react';
import { Shield, FileText, Lock, CheckCircle, AlertTriangle, ExternalLink, ChevronRight, ArrowLeft } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/5265f3b64_1000407748_d589e7f2d77d09c6941cdd7fa30003c5-03_02_202612_32_07.png';

const TABS = [
  { id: 'politica', label: 'Política de Trabalho', icon: FileText },
  { id: 'termos', label: 'Termos de Uso', icon: Shield },
  { id: 'privacidade', label: 'Privacidade', icon: Lock },
];

export default function TermosEPrivacidade() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') || 'politica';
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="min-h-screen bg-[#07090f] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Top bar */}
      <div className="border-b border-white/6 bg-[#07090f]/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="WR-EDU" className="w-8 h-8 object-contain opacity-90" />
            <div className="h-5 w-px bg-white/10" />
            <span className="text-white/50 text-xs uppercase tracking-widest font-semibold">Documentos Institucionais</span>
          </div>
          <a href="/" className="flex items-center gap-1.5 text-white/30 hover:text-white/70 text-xs font-medium transition-colors">
            <ArrowLeft size={13} /> Voltar ao site
          </a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Page heading */}
        <div className="mb-10">
          <p className="text-[#5b5ef4] text-xs font-bold uppercase tracking-widest mb-2">WR-EDU · Instituto de Desenvolvimento Humano</p>
          <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight">
            Documentos Legais e<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5b5ef4] to-[#1db89e]">Compromissos Institucionais</span>
          </h1>
          <p className="text-white/35 text-sm mt-3 max-w-xl">Leia com atenção antes de iniciar sua formação. Estes documentos regulam a relação entre o aluno e a WR-EDU.</p>
          <p className="text-white/20 text-xs mt-2 font-mono">Última atualização: Janeiro de 2026 · Curitiba, PR</p>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 mb-8 border-b border-white/6 pb-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
                activeTab === id
                  ? 'border-[#5b5ef4] text-white'
                  : 'border-transparent text-white/30 hover:text-white/60'
              }`}
            >
              <Icon size={13} />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* ── POLÍTICA DE TRABALHO ── */}
        {activeTab === 'politica' && (
          <div className="space-y-1 animate-fade-in">

            {/* Intro */}
            <div className="py-8 border-b border-white/6">
              <p className="text-[#5b5ef4] text-xs font-bold uppercase tracking-widest mb-3">Política de Trabalho e Compromisso Ético</p>
              <p className="text-white/70 text-sm leading-relaxed max-w-3xl">
                Nossa Política de Trabalho reflete os valores que sustentam cada etapa da nossa formação. Acreditamos que a excelência não é um destino, mas um <strong className="text-white">padrão de conduta aplicado diariamente</strong> na relação entre professor, aluno e o futuro paciente.
              </p>
            </div>

            <DocSection number="1" title="Natureza da Formação e Amparo Legal">
              <p>A WR-EDU dedica-se à oferta de <strong className="text-white">Cursos de Formação Profissionalizante Livre</strong>, em conformidade com a <strong className="text-white">Lei nº 9.394 — Diretrizes e Bases da Educação Nacional</strong>. É importante ressaltar que nossas certificações são de caráter profissionalizante e de atualização técnica, não se configurando como cursos de graduação ou pós-graduação acadêmica.</p>
              <p>Nosso objetivo é a capacitação prática para o exercício ético e técnico da terapia no âmbito das <strong className="text-white">terapias integrativas e comportamentais</strong>.</p>
              <Notice type="info">
                Nossas formações são reconhecidas institucionalmente pela <strong>ABED</strong> e pelo credenciamento internacional <strong>AHDE (ID: 00403THE)</strong>, atestando a seriedade e o comprometimento da plataforma com padrões elevados de ensino a distância.
              </Notice>
            </DocSection>

            <DocSection number="2" title="Metodologia e Interação Real-Time">
              <p>Nosso compromisso é com o <strong className="text-white">aprendizado ativo</strong>. Diferente de modelos de ensino passivos, nossa política de trabalho prioriza a interação em tempo real. As aulas e mentorias são desenhadas para proporcionar o diálogo direto com o professor e a troca de experiências entre os membros da turma.</p>
              <p>A participação nos grupos de integração é incentivada como ferramenta fundamental para o networking e o fortalecimento da comunidade acadêmica e profissional — especialmente dentro do ecossistema <strong className="text-white">Sinapse Coletiva</strong>.</p>
            </DocSection>

            <DocSection number="3" title="Prática Terapêutica Assistida">
              <p>A excelência na terapia nasce da vivência. Nossa política garante que o aluno tenha contato com <strong className="text-white">simulações e práticas de consultório</strong> ainda durante o período de formação.</p>
              <p>Essas atividades são conduzidas sob rigorosos critérios éticos, visando preparar o futuro terapeuta para lidar com a subjetividade humana nas áreas de <strong className="text-white">TCC, Psicanálise Freudiana e Sexualidade Humana</strong> com segurança, profundidade e responsabilidade clínica.</p>
            </DocSection>

            <DocSection number="4" title="Conduta Ética e Humanização">
              <p>Pautamos nosso trabalho no resgate da dignidade e no acolhimento. Espera-se que todos os alunos e colaboradores mantenham um padrão de conduta baseado em:</p>
              <ul>
                <li>Respeito mútuo entre todos os membros da turma e da instituição</li>
                <li>Sigilo absoluto das informações compartilhadas em aula e nas sessões práticas</li>
                <li>Busca constante pela humanização do atendimento terapêutico</li>
                <li>Uso da empatia como ferramenta central de trabalho</li>
              </ul>
              <p>Não formamos apenas técnicos. Formamos <strong className="text-white">agentes de transformação social</strong> que utilizam a escuta ativa e o acolhimento como diferenciais profissionais.</p>
            </DocSection>

            <DocSection number="5" title="Propriedade Intelectual e Direitos Autorais">
              <p>Todo o material didático, metodologias exclusivas — incluindo a <strong className="text-white">Teoria da Utilidade Comportamental</strong> — e conteúdos disponibilizados na plataforma são de <strong className="text-white">propriedade intelectual da WR-EDU</strong> e de seu mantenedor, protegidos pela Lei 9.610/98.</p>
              <p>O uso desse material é restrito ao aprendizado individual do aluno matriculado, sendo expressamente proibida a reprodução, gravação, redistribuição ou comercialização sem autorização prévia e formal da instituição.</p>
              <Notice type="warning">
                A violação de direitos autorais sujeitará o infrator às sanções cíveis e penais previstas na legislação brasileira, independentemente de qualquer vínculo acadêmico com a WR-EDU.
              </Notice>
            </DocSection>

            {/* Closing quote */}
            <div className="py-10 border-b border-white/6">
              <blockquote className="border-l-2 border-[#5b5ef4]/40 pl-6 max-w-2xl">
                <p className="text-white/60 text-base leading-relaxed italic">"Você pode fazer muitas coisas na sua vida, mas a excelência vai se apresentar somente quando encontrar o que realmente nasceu para fazer."</p>
                <footer className="mt-3 text-[#5b5ef4] text-xs font-bold uppercase tracking-widest">— William Ribeiro</footer>
              </blockquote>
              <p className="text-white/25 text-xs mt-6 max-w-xl">Esta política visa assegurar que sua jornada conosco seja produtiva, segura e, acima de tudo, transformadora.</p>
            </div>

          </div>
        )}

        {/* ── TERMOS DE USO ── */}
        {activeTab === 'termos' && (
          <div className="space-y-1 animate-fade-in">
            <DocSection number="1" title="Aceitação e Vigência">
              <p>Ao acessar e utilizar a plataforma WR-EDU, o usuário declara ter lido, compreendido e concordado integralmente com estes Termos de Uso. Caso não concorde com qualquer disposição, não utilize os serviços.</p>
              <p>Estes termos entram em vigor na data de matrícula e permanecem válidos até o encerramento definitivo do vínculo acadêmico. Alterações relevantes serão comunicadas com antecedência mínima de 15 dias via e-mail ou notificação na plataforma.</p>
            </DocSection>

            <DocSection number="2" title="Acesso e Código de Usuário">
              <p>O acesso à plataforma WR-EDU é realizado exclusivamente por meio de <strong className="text-white">código de acesso individual e intransferível</strong>, emitido no ato da matrícula. São expressamente vedados:</p>
              <ul>
                <li>Compartilhamento do código de acesso com qualquer terceiro</li>
                <li>Utilização do acesso de outro aluno, mesmo com consentimento</li>
                <li>Tentativa de contornar ou burlar os mecanismos de autenticação</li>
                <li>Acesso simultâneo ao mesmo código em múltiplos dispositivos</li>
                <li>Engenharia reversa ou exploração de vulnerabilidades do sistema</li>
              </ul>
              <Notice type="warning">
                O descumprimento resulta no cancelamento imediato e permanente do acesso, sem reembolso e sem prejuízo de medidas legais cabíveis.
              </Notice>
            </DocSection>

            <DocSection number="3" title="Propriedade Intelectual e Uso do Conteúdo">
              <p>Todo o conteúdo da plataforma WR-EDU — incluindo aulas gravadas, materiais didáticos, apostilas, apresentações, avaliações e design da plataforma — é protegido pela <strong className="text-white">Lei de Direitos Autorais (Lei 9.610/98)</strong> e é propriedade exclusiva da WR-EDU e de seus colaboradores.</p>
              <p>É expressamente proibido:</p>
              <ul>
                <li>Gravar, capturar tela ou reproduzir aulas em qualquer formato</li>
                <li>Redistribuir materiais da plataforma em grupos, redes sociais ou outros meios</li>
                <li>Utilizar o conteúdo para fins comerciais sem autorização formal por escrito</li>
                <li>Criar materiais derivados sem crédito expresso e autorização da WR-EDU</li>
              </ul>
            </DocSection>

            <DocSection number="4" title="Conduta e Convivência">
              <p>A WR-EDU preza por um ambiente de aprendizado ético, respeitoso e profissional. Constituem violações graves:</p>
              <ul>
                <li>Assédio, discriminação ou desrespeito a colegas, professores ou staff</li>
                <li>Publicação de conteúdo ofensivo, difamatório, racista ou ilegal em qualquer canal da plataforma</li>
                <li>Desinformação intencional sobre a WR-EDU, seus cursos ou certificados</li>
                <li>Comportamento que prejudique a experiência de outros alunos</li>
                <li>Uso da plataforma para fins alheios ao aprendizado</li>
              </ul>
              <p>Violações resultam em advertência formal, suspensão temporária ou desligamento definitivo, a critério da coordenação.</p>
            </DocSection>

            <DocSection number="5" title="Mensalidades, Pagamentos e Cancelamentos">
              <p>Os valores são definidos no contrato de matrícula. A WR-EDU adota a seguinte política financeira:</p>
              <ul>
                <li><strong className="text-white">Direito de arrependimento:</strong> cancelamento com reembolso integral em até 7 dias corridos após a matrícula (Lei 8.078/90 — CDC)</li>
                <li><strong className="text-white">Após 7 dias:</strong> não há reembolso de mensalidades já pagas</li>
                <li><strong className="text-white">Inadimplência até 30 dias:</strong> notificação e suspensão preventiva do acesso</li>
                <li><strong className="text-white">Inadimplência acima de 60 dias:</strong> cancelamento definitivo da matrícula sem reabilitação do curso</li>
                <li><strong className="text-white">Renegociação:</strong> sujeita à análise da coordenação financeira, sem garantia de aprovação</li>
              </ul>
            </DocSection>

            <DocSection number="6" title="Limitação de Responsabilidade">
              <p>A WR-EDU não se responsabiliza por:</p>
              <ul>
                <li>Resultados profissionais ou financeiros individuais após a formação</li>
                <li>Uso inadequado das técnicas terapêuticas fora do contexto ético e supervisionado</li>
                <li>Indisponibilidade temporária da plataforma por manutenção programada ou falhas técnicas externas</li>
                <li>Perda de progresso causada por uso inadequado, limpeza de cache ou problemas no dispositivo do aluno</li>
              </ul>
            </DocSection>
          </div>
        )}

        {/* ── PRIVACIDADE ── */}
        {activeTab === 'privacidade' && (
          <div className="space-y-1 animate-fade-in">
            <DocSection number="1" title="Base Legal e Conformidade">
              <p>Esta Política de Privacidade está em conformidade com a <strong className="text-white">Lei Geral de Proteção de Dados — LGPD (Lei 13.709/2018)</strong> e com o Código de Defesa do Consumidor (Lei 8.078/90).</p>
              <p>A WR-EDU atua como <strong className="text-white">controladora dos dados</strong> dos alunos, sendo responsável por definir as finalidades e os meios de tratamento das informações coletadas durante a formação.</p>
            </DocSection>

            <DocSection number="2" title="Dados Coletados">
              <p>Para prestação adequada dos serviços educacionais, coletamos:</p>
              <ul>
                <li><strong className="text-white">Identificação:</strong> nome completo, data de nascimento, e-mail, WhatsApp</li>
                <li><strong className="text-white">Acesso:</strong> código de matrícula, registros de login, dispositivos utilizados</li>
                <li><strong className="text-white">Acadêmicos:</strong> progresso em aulas, notas em tarefas e avaliações, participação em fórum e aulas ao vivo</li>
                <li><strong className="text-white">Financeiros:</strong> histórico de mensalidades e status de pagamento (não armazenamos dados de cartão)</li>
                <li><strong className="text-white">Comportamentais:</strong> tempo de acesso, conteúdos acessados e interações na plataforma</li>
              </ul>
            </DocSection>

            <DocSection number="3" title="Finalidade do Tratamento">
              <p>Os dados são utilizados exclusivamente para:</p>
              <ul>
                <li>Gerenciar matrícula, acesso e progresso acadêmico</li>
                <li>Emitir certificados, históricos e boletins de desempenho</li>
                <li>Enviar comunicados institucionais, avisos de aula e materiais didáticos</li>
                <li>Calcular pontuação e participação no sistema gamificado da plataforma</li>
                <li>Gerar análises agregadas para melhoria dos cursos</li>
                <li>Cumprir obrigações legais e contratuais</li>
              </ul>
              <Notice type="info">
                Jamais vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins comerciais ou publicitários.
              </Notice>
            </DocSection>

            <DocSection number="4" title="Armazenamento e Segurança">
              <p>Todos os dados são armazenados em infraestrutura cloud com:</p>
              <ul>
                <li>Criptografia em trânsito via <strong className="text-white">TLS/HTTPS</strong></li>
                <li>Criptografia em repouso nos bancos de dados</li>
                <li>Backups automáticos diários com retenção de 30 dias</li>
                <li>Controle de acesso por perfil e autenticação em dois fatores para administradores</li>
                <li>Monitoramento contínuo contra tentativas de acesso não autorizado</li>
              </ul>
            </DocSection>

            <DocSection number="5" title="Seus Direitos como Titular">
              <p>Em conformidade com a LGPD, você possui os seguintes direitos:</p>
              <ul>
                <li><strong className="text-white">Acesso:</strong> solicitar relatório completo dos seus dados armazenados</li>
                <li><strong className="text-white">Correção:</strong> atualizar dados incorretos ou desatualizados</li>
                <li><strong className="text-white">Exclusão:</strong> solicitar remoção dos dados após encerramento do vínculo</li>
                <li><strong className="text-white">Portabilidade:</strong> receber seus dados em formato estruturado</li>
                <li><strong className="text-white">Revogação:</strong> retirar o consentimento para usos específicos</li>
                <li><strong className="text-white">Oposição:</strong> contestar tratamentos considerados inadequados</li>
              </ul>
              <p>Para exercer qualquer desses direitos, entre em contato com a coordenação via WhatsApp institucional ou e-mail.</p>
            </DocSection>

            <DocSection number="6" title="Retenção de Dados">
              <p>Os dados acadêmicos são mantidos por <strong className="text-white">mínimo de 5 anos</strong> após a conclusão ou cancelamento do curso, para fins de emissão de históricos e certificados mediante solicitação.</p>
              <p>Dados de acesso e logs de segurança são mantidos por <strong className="text-white">2 anos</strong>. Após os prazos de retenção, as informações são anonimizadas ou excluídas definitivamente.</p>
            </DocSection>

            <DocSection number="7" title="Cookies e Rastreamento">
              <p>A plataforma WR-EDU utiliza apenas <strong className="text-white">cookies essenciais</strong> para manter a sessão ativa e garantir o funcionamento correto do sistema. Não utilizamos cookies de rastreamento publicitário, pixels de conversão ou tecnologias de fingerprinting.</p>
              <p>A desativação de cookies no navegador pode comprometer funcionalidades da plataforma, como manutenção do login e progresso das aulas.</p>
            </DocSection>

            <DocSection number="8" title="Responsável pela Proteção de Dados">
              <div className="bg-white/3 border border-white/8 rounded-xl p-5 mt-2">
                <p className="text-white font-bold text-sm mb-1">WR-EDU — Instituto de Desenvolvimento Humano</p>
                <p className="text-white/50 text-xs">Responsável (DPO): Prof. William Ribeiro</p>
                <p className="text-white/50 text-xs">Curitiba — PR, Brasil</p>
                <p className="text-white/30 text-xs mt-3 font-mono">Política vigente desde: Janeiro de 2026</p>
              </div>
            </DocSection>
          </div>
        )}

        {/* Bottom nav */}
        <div className="mt-14 pt-8 border-t border-white/6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 opacity-50">
            <img src={LOGO_URL} alt="WR" className="w-6 h-6 object-contain" />
            <span className="text-white/40 text-xs">WR-EDU © 2026 — Todos os direitos reservados</span>
          </div>
          <a href="/" className="text-[#5b5ef4] text-xs font-semibold hover:opacity-80 transition-opacity flex items-center gap-1">
            Voltar ao site <ChevronRight size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}

function DocSection({ number, title, children }) {
  return (
    <div className="py-7 border-b border-white/6 last:border-0">
      <div className="flex items-start gap-4">
        <span className="text-[#5b5ef4]/40 font-mono text-xs font-bold mt-1 shrink-0 w-5">{number}.</span>
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-bold text-base mb-4">{title}</h2>
          <div className="space-y-3 text-white/55 text-sm leading-relaxed [&_ul]:list-none [&_ul]:space-y-2 [&_ul>li]:flex [&_ul>li]:items-start [&_ul>li]:gap-2 [&_ul>li]:before:content-['—'] [&_ul>li]:before:text-[#5b5ef4]/40 [&_ul>li]:before:shrink-0 [&_ul>li]:before:text-xs [&_ul>li]:before:mt-0.5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function Notice({ type, children }) {
  const styles = {
    info: 'bg-[#5b5ef4]/8 border-[#5b5ef4]/20',
    warning: 'bg-yellow-500/8 border-yellow-500/20',
  };
  return (
    <div className={`mt-4 ${styles[type]} border rounded-xl p-4 text-sm text-white/55 leading-relaxed`}>
      {children}
    </div>
  );
}