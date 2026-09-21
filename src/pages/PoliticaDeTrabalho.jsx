import React from 'react';
import { Shield, CheckCircle, AlertTriangle, ExternalLink, ArrowLeft, Scale, Award, DollarSign } from 'lucide-react';
import { BRAND_CNPJ, BRAND_LEGAL_NAME, WR_PRIMARY_LOGO } from '@/lib/brand';

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
            <img src={WR_PRIMARY_LOGO} alt={BRAND_LEGAL_NAME} className="w-6 h-6 object-contain" />
            <span className="text-white/60 text-sm font-semibold">{BRAND_LEGAL_NAME}</span>
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
            Documento institucional que estabelece diretrizes para a oferta dos serviços educacionais, a certificação e a conduta no ambiente de aprendizagem.
          </p>
        </div>

        {/* Selos de Associação */}
        <div className="bg-gradient-to-r from-[#5b5ef4]/10 via-white/4 to-[#1db89e]/10 border border-white/10 rounded-3xl p-8 mb-10">
          <p className="text-xs font-black text-white/30 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Award size={13} className="text-yellow-400" /> Associações e Reconhecimentos Institucionais
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/6 border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center gap-4">
              <img src={ABED_WHITE} alt="Somos Associados ABED" className="h-28 object-contain" />
              <div>
                <p className="text-white font-bold text-sm mb-1">Associação Brasileira de Educação a Distância</p>
                <p className="text-white/50 text-xs leading-relaxed">
                  A filiação associativa é informada para fins de transparência institucional. A consulta pública de associados deve ser realizada diretamente no canal oficial da entidade. CNPJ {BRAND_CNPJ}.
                </p>
              </div>
              <a href="https://www.abed.org.br/site/associados/consulta-associados-ativos/" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#5b5ef4] text-xs font-semibold hover:opacity-80 transition-opacity">
                <ExternalLink size={11} /> Consultar Associados Ativos
              </a>
            </div>

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
                  Informações sobre registros, associações e critérios de atuação devem ser verificadas diretamente nos canais oficiais da entidade responsável.
                </p>
              </div>
              <a href="https://ahde-global.org/?lang=pt-br" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#1db89e] text-xs font-semibold hover:opacity-80 transition-opacity">
                <ExternalLink size={11} /> Verificar Registro AHDE
              </a>
            </div>
          </div>

          <div className="mt-5 bg-white/4 border border-white/8 rounded-2xl px-6 py-4 flex items-start gap-3">
            <CheckCircle size={15} className="text-[#1db89e] mt-0.5 shrink-0" />
            <p className="text-white/60 text-sm">
              A oferta dos cursos observa o enquadramento aplicável à modalidade de cursos livres e as disposições legais pertinentes, sem prejuízo das obrigações específicas de cada atividade profissional.
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
              Os cursos são ofertados <strong className="text-white">em ambiente on-line</strong>, com conteúdos e atividades destinados à formação e ao aperfeiçoamento profissional, conforme o programa de cada curso.
            </p>
            <div className="h-px bg-white/5" />
            <p>
              A participação em atividades práticas, estudos de caso ou simulações não autoriza o exercício de profissões regulamentadas nem substitui habilitações, registros, supervisões ou requisitos legais eventualmente exigíveis.
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
              Os cursos possuem natureza de <strong className="text-yellow-200">curso livre</strong> e não se caracterizam como graduação ou pós-graduação.
            </p>
            <div className="h-px bg-yellow-500/10" />
            <p className="text-yellow-200/80">
              A conclusão do curso não confere habilitação, registro profissional ou autorização para o exercício de atividades privativas de profissões regulamentadas. Cabe ao participante verificar os requisitos legais e éticos aplicáveis à sua atuação.
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
              A emissão de certificado depende do <strong className="text-white">cumprimento integral dos requisitos acadêmicos e administrativos</strong> divulgados para o curso, incluindo, quando previstos, carga horária, participação, avaliações e regularidade da matrícula.
            </p>
            <div className="flex items-start gap-3 bg-[#1db89e]/8 border border-[#1db89e]/20 rounded-xl p-4">
              <CheckCircle size={15} className="text-[#1db89e] mt-0.5 shrink-0" />
              <p className="text-white/70 text-sm">
                Os certificados são emitidos após a verificação dos requisitos aplicáveis. Não são admitidas antecipação de conclusão, alteração retroativa de datas ou emissão em desacordo com os registros acadêmicos.
              </p>
            </div>
            <p>
              Os documentos acadêmicos refletem os dados e registros disponíveis na plataforma, observadas as condições de emissão e a legislação aplicável.
            </p>
          </div>
        </div>

        {/* ─── Seções complementares ─────────────────────────────── */}

        <div className="mb-10">
          <h2 className="text-2xl font-black text-white mb-3">Política de Trabalho e Compromisso Ético</h2>
          <p className="text-white/55 text-sm leading-relaxed">
            Esta Política estabelece parâmetros institucionais de oferta, participação e conduta aplicáveis às atividades educacionais disponibilizadas na plataforma.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <CheckCircle size={16} className="text-[#5b5ef4]" /> 1. Natureza da Formação e Amparo Legal
          </h2>
          <div className="bg-[#0d1120] border border-white/8 rounded-2xl p-6 text-sm text-white/60 leading-relaxed">
            <p>
              A {BRAND_LEGAL_NAME} oferta <strong className="text-white">cursos livres de formação e aperfeiçoamento</strong>. As certificações emitidas não equivalem a diplomas de graduação ou pós-graduação e não substituem requisitos legais ou regulatórios exigidos para o exercício de atividades profissionais específicas.
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <CheckCircle size={16} className="text-[#1db89e]" /> 2. Metodologia e Interação Real-Time
          </h2>
          <div className="bg-[#0d1120] border border-white/8 rounded-2xl p-6 text-sm text-white/60 leading-relaxed">
            <p>
              A metodologia poderá incluir conteúdos gravados, encontros ao vivo, mentorias, exercícios e ambientes colaborativos, conforme a configuração de cada curso. A disponibilidade e as regras de participação de cada recurso serão informadas no respectivo programa ou ambiente de matrícula.
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <CheckCircle size={16} className="text-[#1db89e]" /> 3. Prática Terapêutica Assistida
          </h2>
          <div className="bg-[#0d1120] border border-white/8 rounded-2xl p-6 text-sm text-white/60 leading-relaxed">
            <p>
              Eventuais simulações, estudos de caso e atividades práticas possuem finalidade exclusivamente pedagógica. O participante deverá respeitar os limites éticos, a confidencialidade e as normas aplicáveis, não sendo tais atividades equivalentes a estágio profissional, supervisão legal ou autorização de prática clínica.
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <CheckCircle size={16} className="text-[#5b5ef4]" /> 4. Conduta Ética e Humanização
          </h2>
          <div className="bg-[#0d1120] border border-white/8 rounded-2xl p-6 text-sm text-white/60 leading-relaxed">
            <p>
              Todos os participantes deverão manter conduta compatível com o ambiente educacional, baseada em <strong className="text-white">respeito, não discriminação e confidencialidade</strong>. É vedada a divulgação não autorizada de dados, relatos, gravações ou conteúdos compartilhados por terceiros, bem como qualquer conduta ilícita, ofensiva ou incompatível com a finalidade do curso.
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Shield size={16} className="text-[#5b5ef4]" /> 5. Propriedade Intelectual e Direitos
          </h2>
          <div className="bg-[#0d1120] border border-white/8 rounded-2xl p-6 text-sm text-white/60 leading-relaxed">
            <p>
              Os materiais, conteúdos, marcas e metodologias disponibilizados são protegidos pela legislação aplicável e pertencem à <strong className="text-white">{BRAND_LEGAL_NAME} e/ou aos respectivos titulares</strong>. O uso é limitado às finalidades educacionais da matrícula, sendo vedada a reprodução, distribuição ou exploração sem autorização expressa.
            </p>
          </div>
        </div>

        {/* 6. Contribuição Voluntária e Sustentabilidade do Projeto Social */}
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <DollarSign size={16} className="text-[#1db89e]" /> 6. Contribuição Voluntária e Sustentabilidade do Projeto Social
          </h2>
          <div className="bg-[#0d1120] border border-white/8 rounded-2xl p-6 space-y-5 text-sm text-white/60 leading-relaxed">
            <p>
              A instituição poderá disponibilizar <strong className="text-white">bolsas, descontos ou condições especiais de acesso</strong>, conforme critérios de elegibilidade, disponibilidade e regras divulgadas para cada iniciativa.
            </p>
            <div className="h-px bg-white/5" />
            <p>
              <strong className="text-white">Das condições financeiras:</strong> Valores, descontos, bolsas, contribuições voluntárias e eventuais documentos de cobrança observarão as condições apresentadas no processo de matrícula ou no instrumento aplicável. A concessão de benefício não dispensa o cumprimento dos requisitos acadêmicos e administrativos informados.
            </p>
            <div className="h-px bg-white/5" />
            <p>
              <strong className="text-white">Das contribuições voluntárias:</strong> Quando expressamente qualificadas como voluntárias, as contribuições não constituem condição obrigatória para o benefício concedido. As informações financeiras serão apresentadas de maneira clara, com a identificação da respectiva natureza.
            </p>
            <div className="h-px bg-white/5" />
            <p>
              <strong className="text-white">Da transparência:</strong> As condições de contratação e de concessão de benefícios serão disponibilizadas pelos canais institucionais pertinentes. Informações adicionais poderão ser solicitadas ao suporte antes da confirmação de matrícula ou adesão a programas de bolsa.
            </p>
            <div className="h-px bg-white/5" />
            <p>
              <strong className="text-white">Das obrigações do beneficiário:</strong> O beneficiário deverá observar os requisitos de participação, conduta e aproveitamento previstos para a modalidade concedida. O benefício poderá ser revisto em caso de descumprimento das condições aplicáveis, mediante análise administrativa.
            </p>
          </div>
        </div>

        {/* Citação */}
        <div className="bg-gradient-to-r from-[#5b5ef4]/10 via-white/4 to-[#1db89e]/10 border border-white/10 rounded-3xl p-8 mb-10 text-center">
          <p className="text-white/80 text-lg italic leading-relaxed mb-3">
            "A relação educacional é orientada por transparência, integridade acadêmica e observância das normas aplicáveis."
          </p>
          <p className="text-[#5b5ef4] text-sm font-bold">— Diretriz institucional</p>
          <p className="text-white/40 text-xs mt-4">Esta Política deve ser lida em conjunto com os Termos de Uso e as condições específicas de matrícula.</p>
        </div>

        {/* Aviso Penal */}
        <div className="space-y-4 mb-14">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Scale size={16} className="text-red-400" /> Responsabilidade Legal
          </h2>
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 text-sm leading-relaxed">
            <p className="text-red-200/80">
              A emissão, alteração ou utilização de documentos acadêmicos deverá corresponder aos registros e requisitos efetivamente cumpridos. Eventuais irregularidades poderão ensejar a adoção das medidas administrativas e legais cabíveis, conforme a legislação aplicável.
            </p>
          </div>
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
              <p className="text-white/30 text-[10px] uppercase tracking-widest">Política de Trabalho · {BRAND_LEGAL_NAME}</p>
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