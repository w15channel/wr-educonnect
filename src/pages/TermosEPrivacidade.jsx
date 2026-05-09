import React, { useState } from 'react';
import { ChevronRight, Shield, FileText, Lock, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';

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
    <div className="min-h-screen bg-[#080b14] text-white font-jakarta">
      {/* Header */}
      <header className="border-b border-white/8 py-5 px-6 lg:px-20 sticky top-0 z-50 bg-[#080b14]/95 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src={LOGO_URL} alt="WR-EDU" className="w-9 h-9 object-contain" />
            <span className="text-white font-black text-lg">WR-EDU</span>
          </a>
          <a href="/" className="text-white/40 hover:text-white text-sm transition-colors flex items-center gap-1.5">
            ← Voltar ao site
          </a>
        </div>
      </header>

      {/* Hero */}
      <div className="py-16 px-6 lg:px-20 border-b border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#5b5ef4]/10 border border-[#5b5ef4]/20 rounded-full px-4 py-1.5 mb-5">
            <Shield size={12} className="text-[#5b5ef4]" />
            <span className="text-xs font-bold text-[#5b5ef4] uppercase tracking-widest">Documentos Institucionais</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white mb-4">Transparência e Compromisso</h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">Conheça nossas políticas, termos de uso e práticas de privacidade. Atualizados em Janeiro de 2026.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[73px] z-40 bg-[#080b14]/95 backdrop-blur-xl border-b border-white/8 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto flex gap-1 overflow-x-auto py-3">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === id ? 'bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] text-white shadow-lg' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="py-16 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">

          {/* ── POLÍTICA DE TRABALHO ── */}
          {activeTab === 'politica' && (
            <div className="space-y-10 animate-fade-in">
              <Section title="1. Natureza e Finalidade dos Cursos" icon={FileText}>
                <p>Os cursos oferecidos pela <strong>WR-EDU</strong> são formações profissionalizantes de caráter complementar e extensivo, ministrados na modalidade <strong>EAD (Ensino a Distância)</strong>, em conformidade com a Lei nº 9.394/1996 (LDB) e as diretrizes do Ministério da Educação para cursos livres.</p>
                <p>As formações têm como objetivo capacitar profissionais para atuação nas áreas de Terapia, Psicanálise e Sexologia, com base em metodologias reconhecidas e conteúdo estruturado por profissionais habilitados.</p>
              </Section>

              <Section title="2. Vinculações Institucionais" icon={CheckCircle} color="teal">
                <p>A WR-EDU é mantenedora associada à <strong>ABED — Associação Brasileira de Educação a Distância</strong>, entidade de referência nacional no setor de EAD. A verificação da associação pode ser feita diretamente no portal:</p>
                <a href="https://www.abed.org.br/site/associados/consulta-associados-ativos/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[#1db89e] text-sm font-semibold hover:opacity-80 transition-opacity mt-1">
                  <ExternalLink size={13} /> Consultar Associados ABED
                </a>
                <p className="mt-4">Adicionalmente, o coordenador da plataforma, <strong>Prof. William Ribeiro</strong>, é membro registrado da <strong>AHDE — Associação de Hipnose e Desenvolvimento Especializado</strong> (ID: 00403THE), entidade com reconhecimento internacional.</p>
              </Section>

              <Section title="3. Validade dos Certificados" icon={Shield}>
                <p>Os certificados emitidos pela WR-EDU têm validade como <strong>cursos livres profissionalizantes</strong>, sendo aceitos para fins de atualização profissional, portfólio e comprovação de capacitação complementar.</p>
                <AlertBox title="Importantes Esclarecimentos">
                  <p>Os cursos da WR-EDU <strong>não são</strong> credenciados pelos seguintes conselhos e órgãos regulatórios:</p>
                  <ul className="list-disc list-inside space-y-1 mt-2 text-white/60">
                    <li>CFP — Conselho Federal de Psicologia</li>
                    <li>CFM — Conselho Federal de Medicina</li>
                    <li>CFO — Conselho Federal de Odontologia</li>
                    <li>MEC (como curso técnico ou superior)</li>
                  </ul>
                  <p className="mt-3">Profissionais regulamentados por esses conselhos devem verificar as regras de atuação em complementação terapêutica junto aos seus respectivos órgãos.</p>
                </AlertBox>
              </Section>

              <Section title="4. Requisitos para Certificação" icon={CheckCircle} color="teal">
                <p>Para obter o certificado de conclusão, o aluno deverá cumprir <strong>obrigatoriamente</strong>:</p>
                <ul className="list-disc list-inside space-y-2 text-white/60 mt-2">
                  <li>Frequência mínima de 75% nas aulas ao vivo</li>
                  <li>Assistir a pelo menos 80% das aulas gravadas</li>
                  <li>Entregar todas as tarefas obrigatórias nos prazos estipulados</li>
                  <li>Participar da vivência de consultório (sessões práticas supervisionadas)</li>
                  <li>Atingir aproveitamento mínimo de 60% nas avaliações</li>
                </ul>
                <p className="mt-4">O não cumprimento de qualquer um desses requisitos implica na impossibilidade de emissão do certificado, sem direito a reembolso proporcional.</p>
              </Section>

              <Section title="5. Responsabilidade Legal e Ética" icon={AlertTriangle} color="red">
                <p>A falsificação, adulteração ou uso indevido dos certificados emitidos pela WR-EDU constitui crime previsto no <strong>Art. 297 do Código Penal Brasileiro</strong> (falsificação de documento público/particular), sujeitando o infrator a penas de reclusão.</p>
                <p className="mt-3">O aluno que apresentar certificado da WR-EDU como credencial de psicólogo, médico ou qualquer outra profissão regulamentada, sem possuir o devido registro profissional, estará sujeito a responder pelo crime de <strong>exercício ilegal da profissão</strong> (Art. 282 do CP), de forma totalmente independente de qualquer responsabilidade da instituição.</p>
              </Section>

              <Section title="6. Compromisso Ético da Instituição" icon={Shield}>
                <p>A WR-EDU se compromete a:</p>
                <ul className="list-disc list-inside space-y-2 text-white/60 mt-2">
                  <li>Manter a transparência sobre a natureza e limitações dos cursos oferecidos</li>
                  <li>Garantir a qualidade do conteúdo ministrado por profissionais habilitados</li>
                  <li>Emitir certificados apenas mediante cumprimento integral dos requisitos</li>
                  <li>Atualizar constantemente o conteúdo programático conforme avanços da área</li>
                  <li>Respeitar a confidencialidade dos dados dos alunos</li>
                </ul>
              </Section>
            </div>
          )}

          {/* ── TERMOS DE USO ── */}
          {activeTab === 'termos' && (
            <div className="space-y-10 animate-fade-in">
              <Section title="1. Aceitação dos Termos" icon={FileText}>
                <p>Ao acessar e utilizar a plataforma WR-EDU, você concorda com estes Termos de Uso em sua totalidade. Caso não concorde com qualquer disposição, recomendamos que não utilize nossos serviços.</p>
                <p className="mt-3">Estes termos podem ser atualizados a qualquer momento. Alterações relevantes serão comunicadas por e-mail e notificadas na plataforma.</p>
              </Section>

              <Section title="2. Cadastro e Acesso" icon={Shield}>
                <p>O acesso à plataforma é realizado por meio de <strong>código de acesso individual e intransferível</strong>, fornecido exclusivamente ao aluno matriculado. É expressamente proibido:</p>
                <ul className="list-disc list-inside space-y-2 text-white/60 mt-2">
                  <li>Compartilhar o código de acesso com terceiros</li>
                  <li>Utilizar o acesso de outro aluno</li>
                  <li>Tentar contornar os mecanismos de segurança da plataforma</li>
                  <li>Realizar engenharia reversa do sistema</li>
                </ul>
                <p className="mt-3">O descumprimento dessas regras resultará no cancelamento imediato do acesso, sem reembolso.</p>
              </Section>

              <Section title="3. Uso do Conteúdo" icon={Lock}>
                <p>Todo o conteúdo disponibilizado na plataforma WR-EDU — incluindo aulas gravadas, materiais didáticos, apresentações e textos — é protegido por direitos autorais e propriedade intelectual.</p>
                <AlertBox title="É expressamente proibido:">
                  <ul className="list-disc list-inside space-y-1 mt-1 text-white/60">
                    <li>Gravar, reproduzir ou redistribuir as aulas</li>
                    <li>Compartilhar materiais da plataforma em redes sociais ou grupos</li>
                    <li>Utilizar o conteúdo para fins comerciais sem autorização</li>
                    <li>Criar materiais derivados sem crédito expresso à WR-EDU</li>
                  </ul>
                </AlertBox>
              </Section>

              <Section title="4. Conduta na Plataforma" icon={CheckCircle} color="teal">
                <p>Esperamos que todos os alunos mantenham conduta ética e respeitosa. São consideradas violações graves:</p>
                <ul className="list-disc list-inside space-y-2 text-white/60 mt-2">
                  <li>Assédio, discriminação ou ataques a outros alunos ou professores</li>
                  <li>Publicação de conteúdo ofensivo, difamatório ou ilegal</li>
                  <li>Desinformação intencional sobre a plataforma ou seus cursos</li>
                  <li>Qualquer comportamento que prejudique o ambiente de aprendizado</li>
                </ul>
              </Section>

              <Section title="5. Pagamentos e Reembolsos" icon={FileText}>
                <p>Os valores das mensalidades e matrículas são definidos no momento da inscrição. A WR-EDU adota a seguinte política:</p>
                <ul className="list-disc list-inside space-y-2 text-white/60 mt-2">
                  <li>Cancelamento com reembolso integral: até 7 dias após a matrícula (direito do consumidor — Lei 8.078/90)</li>
                  <li>Cancelamento após 7 dias: sem reembolso das mensalidades já pagas</li>
                  <li>Inadimplência superior a 30 dias: suspensão temporária do acesso</li>
                  <li>Inadimplência superior a 60 dias: cancelamento definitivo da matrícula</li>
                </ul>
              </Section>

              <Section title="6. Limitação de Responsabilidade" icon={AlertTriangle} color="red">
                <p>A WR-EDU não se responsabiliza por:</p>
                <ul className="list-disc list-inside space-y-2 text-white/60 mt-2">
                  <li>Uso inadequado das técnicas ensinadas fora do contexto ético e profissional</li>
                  <li>Resultados profissionais individuais após a conclusão do curso</li>
                  <li>Indisponibilidade temporária da plataforma por manutenção ou falhas técnicas</li>
                  <li>Perda de dados causada por uso inadequado do aluno</li>
                </ul>
              </Section>
            </div>
          )}

          {/* ── PRIVACIDADE ── */}
          {activeTab === 'privacidade' && (
            <div className="space-y-10 animate-fade-in">
              <Section title="1. Dados que Coletamos" icon={Lock}>
                <p>Para oferecer nossos serviços, coletamos as seguintes informações dos alunos:</p>
                <ul className="list-disc list-inside space-y-2 text-white/60 mt-2">
                  <li><strong className="text-white">Dados de identificação:</strong> nome completo, e-mail, data de nascimento, WhatsApp</li>
                  <li><strong className="text-white">Dados de acesso:</strong> código de acesso, registros de login e atividade</li>
                  <li><strong className="text-white">Dados acadêmicos:</strong> progresso nas aulas, notas, submissões e participação</li>
                  <li><strong className="text-white">Dados de pagamento:</strong> histórico de mensalidades (não armazenamos dados de cartão)</li>
                </ul>
              </Section>

              <Section title="2. Como Utilizamos seus Dados" icon={CheckCircle} color="teal">
                <p>Seus dados são utilizados exclusivamente para:</p>
                <ul className="list-disc list-inside space-y-2 text-white/60 mt-2">
                  <li>Gerenciar sua matrícula e acesso à plataforma</li>
                  <li>Acompanhar seu progresso acadêmico</li>
                  <li>Emitir certificados e históricos acadêmicos</li>
                  <li>Enviar comunicados institucionais e avisos de aula</li>
                  <li>Melhorar a qualidade dos nossos cursos e serviços</li>
                </ul>
                <p className="mt-3"><strong>Nunca vendemos ou compartilhamos seus dados com terceiros para fins comerciais.</strong></p>
              </Section>

              <Section title="3. Armazenamento e Segurança" icon={Shield}>
                <p>Todos os dados são armazenados em servidores seguros com criptografia em trânsito (TLS/HTTPS) e em repouso. Adotamos as melhores práticas de segurança da informação para proteger seus dados contra acesso não autorizado.</p>
                <p className="mt-3">A plataforma WR-EDU é construída sobre infraestrutura cloud com backups automáticos e monitoramento contínuo.</p>
              </Section>

              <Section title="4. Seus Direitos (LGPD)" icon={FileText}>
                <p>Em conformidade com a <strong>Lei Geral de Proteção de Dados (Lei 13.709/2018)</strong>, você tem direito a:</p>
                <ul className="list-disc list-inside space-y-2 text-white/60 mt-2">
                  <li>Acessar todos os dados que temos sobre você</li>
                  <li>Solicitar a correção de dados incorretos</li>
                  <li>Solicitar a exclusão dos seus dados após encerramento do vínculo</li>
                  <li>Revogar o consentimento para uso dos seus dados a qualquer momento</li>
                  <li>Portabilidade dos seus dados acadêmicos</li>
                </ul>
                <p className="mt-3">Para exercer qualquer desses direitos, entre em contato conosco pelo WhatsApp ou e-mail institucional.</p>
              </Section>

              <Section title="5. Cookies e Tecnologias de Rastreamento" icon={Lock}>
                <p>A plataforma utiliza cookies essenciais para manter sua sessão ativa e garantir o funcionamento correto do sistema. Não utilizamos cookies de rastreamento para fins publicitários.</p>
                <p className="mt-3">Você pode desativar os cookies no seu navegador, mas isso pode afetar o funcionamento da plataforma.</p>
              </Section>

              <Section title="6. Retenção de Dados" icon={Shield}>
                <p>Seus dados acadêmicos são mantidos por um período mínimo de <strong>5 anos</strong> após a conclusão ou cancelamento do curso, para fins de emissão de históricos e certificados. Após este período, os dados são anonimizados ou excluídos.</p>
              </Section>

              <Section title="7. Contato e DPO" icon={CheckCircle} color="teal">
                <p>Para questões relacionadas à privacidade e proteção de dados, entre em contato com nosso responsável pela proteção de dados:</p>
                <div className="mt-3 bg-white/4 border border-white/8 rounded-2xl p-5">
                  <p className="text-white font-bold">WR-EDU — Instituto de Desenvolvimento Humano</p>
                  <p className="text-white/50 text-sm mt-1">Responsável: Prof. William Ribeiro</p>
                  <p className="text-white/50 text-sm">Curitiba — PR, Brasil</p>
                  <p className="text-white/40 text-xs mt-3">Política atualizada em Janeiro de 2026</p>
                </div>
              </Section>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/8 py-8 px-6 lg:px-20 bg-[#080b14]">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="WR-EDU" className="w-8 h-8 object-contain" />
            <span className="text-white/40 text-sm">WR-EDU © 2026 — Todos os direitos reservados</span>
          </div>
          <a href="/" className="text-[#5b5ef4] text-sm font-semibold hover:opacity-80 transition-opacity flex items-center gap-1">
            Voltar ao site <ChevronRight size={14} />
          </a>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, icon: Icon, color = 'indigo', children }) {
  const colors = {
    indigo: 'from-[#5b5ef4]/20 to-[#5b5ef4]/10 text-[#5b5ef4]',
    teal: 'from-[#1db89e]/20 to-[#1db89e]/10 text-[#1db89e]',
    red: 'from-red-500/20 to-red-500/10 text-red-400',
  };
  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-7 hover:border-white/12 transition-all">
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center shrink-0`}>
          <Icon size={16} className={colors[color].split(' ').find(c => c.startsWith('text-'))} />
        </div>
        <h2 className="text-white font-black text-lg">{title}</h2>
      </div>
      <div className="space-y-3 text-white/60 text-sm leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function AlertBox({ title, children }) {
  return (
    <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
      <p className="text-yellow-400 font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <AlertTriangle size={12} /> {title}
      </p>
      <div className="text-white/60 text-sm">
        {children}
      </div>
    </div>
  );
}