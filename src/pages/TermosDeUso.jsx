import React from 'react';
import { Shield, CheckCircle, AlertTriangle, ArrowLeft, FileText, Lock, Users, RefreshCw, Ban, DollarSign, BookOpen } from 'lucide-react';
import { BRAND_CNPJ, BRAND_LEGAL_NAME, WR_PRIMARY_LOGO } from '@/lib/brand';

const TERMS = [
  { num: '1', icon: FileText, color: '#5b5ef4', title: 'Objeto e Aceitação', text: 'Estes Termos disciplinam o acesso e a utilização da plataforma e dos serviços educacionais disponibilizados. Ao realizar cadastro, matrícula ou utilizar recursos restritos da plataforma, o usuário declara ciência e concordância com estas disposições. Caso não concorde com os Termos, o usuário deverá abster-se de utilizar os serviços.' },
  { num: '2', icon: BookOpen, color: '#1db89e', title: 'Natureza da Formação', text: `A ${BRAND_LEGAL_NAME}, inscrita no CNPJ sob o nº ${BRAND_CNPJ}, oferta cursos livres de formação e aperfeiçoamento profissional. Tais cursos não se confundem com graduação, pós-graduação ou cursos regulados pelo sistema federal de ensino, e os certificados são emitidos de acordo com os requisitos acadêmicos e administrativos informados para cada formação.` },
  { num: '3', icon: Shield, color: '#5b5ef4', title: 'Propriedade Intelectual', text: `Os conteúdos, materiais didáticos, videoaulas, textos, marcas, metodologias e demais recursos disponibilizados na plataforma são protegidos pela legislação aplicável e pertencem à ${BRAND_LEGAL_NAME} e/ou aos respectivos titulares. É vedada sua reprodução, distribuição, adaptação, comercialização ou disponibilização a terceiros sem autorização prévia e expressa, ressalvadas as hipóteses legalmente permitidas.` },
  { num: '4', icon: Lock, color: '#a855f7', title: 'Credenciais de Acesso', text: 'As credenciais de acesso são pessoais, individuais e intransferíveis. O usuário é responsável por sua guarda, sigilo e pelo uso realizado por meio de sua conta. A instituição poderá adotar medidas de segurança, inclusive suspensão preventiva, diante de indícios de compartilhamento indevido, acesso não autorizado ou uso em desconformidade com estes Termos.' },
  { num: '5', icon: Users, color: '#1db89e', title: 'Conduta em Ambientes de Aprendizagem', text: `Nos ambientes síncronos, assíncronos e colaborativos, o usuário deverá observar conduta respeitosa, lícita e compatível com a finalidade educacional do serviço. É vedada a divulgação não autorizada de dados pessoais, relatos, imagens, gravações ou informações compartilhadas por terceiros, bem como a prática de assédio, discriminação, ameaça ou qualquer conduta que comprometa a segurança e o regular funcionamento do ambiente.` },
  { num: '6', icon: CheckCircle, color: '#1db89e', title: 'Responsabilidades Acadêmicas', text: 'A participação, o acompanhamento das atividades, o cumprimento de prazos, a realização de avaliações e a observância dos requisitos de certificação são de responsabilidade do aluno. A disponibilização de conteúdos e recursos pedagógicos não constitui garantia de resultado individual, desempenho profissional ou aplicação de técnicas fora dos limites legais, éticos e de habilitação do usuário.' },
  { num: '7', icon: DollarSign, color: '#f4a23d', title: 'Condições Financeiras e Arrependimento', text: 'Os valores, formas de pagamento, condições de bolsa e eventuais regras de renovação são informados no momento da contratação ou da matrícula. Nas contratações realizadas fora do estabelecimento comercial, o direito de arrependimento será observado nos termos do Código de Defesa do Consumidor. As solicitações serão analisadas conforme a modalidade contratada, o período de acesso usufruído e a legislação aplicável.' },
  { num: '8', icon: RefreshCw, color: '#5b5ef4', title: 'Vigência e Renovação de Acesso', text: 'O acesso aos conteúdos observará o prazo e as condições vinculados à matrícula. Eventual renovação, extensão ou acesso complementar dependerá de disponibilidade, solicitação do aluno e condições vigentes à época, podendo possuir escopo distinto do período regular, inclusive quanto a tutorias, encontros ao vivo, grupos e certificação.' },
  { num: '9', icon: Ban, color: '#ef4444', title: 'Medidas por Descumprimento', text: `O descumprimento destes Termos, das regras de convivência ou da legislação aplicável poderá ensejar advertência, limitação de funcionalidades, suspensão ou encerramento do acesso, conforme a gravidade do caso e observados os direitos de defesa aplicáveis. A adoção dessas medidas não afasta a apuração de perdas e danos ou outras providências cabíveis.` },
  { num: '10', icon: FileText, color: '#1db89e', title: 'Alterações dos Termos', text: 'Estes Termos poderão ser atualizados para refletir alterações legais, operacionais ou de serviços. A versão vigente permanecerá disponível na plataforma, com indicação da data de atualização. Mudanças relevantes serão comunicadas pelos canais adequados, quando exigido ou recomendável.' },
  { num: '11', icon: DollarSign, color: '#1db89e', title: 'Bolsas e Contribuições Voluntárias', text: `A concessão de bolsas, descontos ou contribuições voluntárias, quando existentes, observará critérios, disponibilidade e condições previamente comunicados. A eventual emissão de documentos de cobrança ou registros administrativos vinculados à bolsa não altera a natureza voluntária de contribuição expressamente qualificada como tal. O beneficiário deverá cumprir as obrigações acadêmicas e as regras aplicáveis à modalidade concedida, sob pena de revisão ou encerramento do benefício, mediante análise do caso.` },
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
            <img src={WR_PRIMARY_LOGO} alt={BRAND_LEGAL_NAME} className="w-6 h-6 object-contain" />
            <span className="text-white/60 text-sm font-semibold">{BRAND_LEGAL_NAME}</span>
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
            Documento que estabelece as condições de acesso, uso da plataforma e participação nas atividades educacionais.
          </p>
          <p className="text-white/30 text-xs mt-3">Última atualização: Setembro de 2026</p>
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
                A renovação ou extensão de acesso, quando disponibilizada, possui as condições apresentadas no ato da solicitação. O escopo poderá ser restrito a <strong className="text-white">conteúdos gravados e atividades de revisão</strong>, sem incluir recursos próprios do período regular, tais como aulas ao vivo, tutoria, grupos da turma ativa ou emissão de certificado.
              </p>
            </div>
          </div>
        </div>

        {/* Aviso legal geral */}
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6 mb-10 text-sm leading-relaxed">
          <p className="text-yellow-200/80">
            <strong className="text-yellow-200">Atenção:</strong> Estes Termos devem ser interpretados conforme a legislação brasileira aplicável, inclusive as normas de proteção ao consumidor e as regras pertinentes à oferta de cursos livres. Para informações sobre o tratamento de dados pessoais, consulte a Política de Privacidade.
          </p>
        </div>

        {/* Footer da página */}
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
              <p className="text-white/30 text-[10px] uppercase tracking-widest">Termos de Uso · {BRAND_LEGAL_NAME}</p>
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