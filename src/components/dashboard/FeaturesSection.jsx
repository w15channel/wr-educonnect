import React from 'react';
import {
  Users, Gamepad2, HeadphonesIcon, GraduationCap, Globe, Palette,
  Plug, CreditCard, Monitor, Gift, SearchCheck, MessageSquare,
  Video, VideoIcon, Brain, ClipboardList, RefreshCw, FileText,
  ShieldCheck, Smartphone, Award, ShoppingCart
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Alunos Ilimitados',
    description: 'Não há limites para o número de alunos que você pode ter. Um ambiente de ensino aberto e flexível para uma experiência de aprendizado incomparável!',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  {
    icon: Gamepad2,
    title: 'Gamificação',
    description: 'Viva uma experiência única! Ganhe pontos em cada aula, download, visualização e atividade. Acompanhe o desenvolvimento de cada aluno!',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
  },
  {
    icon: HeadphonesIcon,
    title: 'Suporte',
    description: 'Experimente um suporte excepcional! Nossa dedicação ao sucesso do cliente se reflete em atendimento diferenciado com SLA e disponibilidade contratual.',
    color: 'text-green-500',
    bg: 'bg-green-50',
  },
  {
    icon: GraduationCap,
    title: 'Professores e Cursos Ilimitados',
    description: 'Explore a liberdade de ensinar: professores e cursos sem limites em todos os planos! Recursos avançados para valorizar seus educadores.',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
  },
  {
    icon: Globe,
    title: 'Domínio Próprio',
    description: 'Use seu domínio, subdomínio ou um subdomínio da plataforma. Flexibilidade total sobre sua presença online com personalização completa.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-50',
  },
  {
    icon: Palette,
    title: 'Personalize e Modifique',
    description: 'Personalize seu site ao máximo pelo painel administrativo ou envie PSD/imagens para transformação completa do layout. Identidade autêntica e única!',
    color: 'text-pink-500',
    bg: 'bg-pink-50',
  },
  {
    icon: Plug,
    title: 'API de Integração',
    description: 'Integre com ERP, SAP, Totvs Protheus, Salesforce. Realize SSO com sua base ou otimize vendas com MailChimp, WhatsApp ou Telegram.',
    color: 'text-indigo-500',
    bg: 'bg-indigo-50',
  },
  {
    icon: CreditCard,
    title: 'Pagamentos sem Complicação',
    description: 'Integração nativa de pagamentos. Faça tudo dentro da plataforma, sem criar contas em sistemas externos. Mais fácil e conveniente!',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
  },
  {
    icon: Monitor,
    title: 'Plataforma em Todas as Telas',
    description: 'Entrega personalizada para celular, tablet e computador, sem bugs. Experiência consistente independentemente do dispositivo ou sistema.',
    color: 'text-sky-500',
    bg: 'bg-sky-50',
  },
  {
    icon: Gift,
    title: 'Comissione sua Rede com Cupons',
    description: 'Comissione contatos por participação ou vendas. Realize split de pagamentos e gerencie comissões de forma eficaz para maximizar ganhos.',
    color: 'text-yellow-500',
    bg: 'bg-yellow-50',
  },
  {
    icon: SearchCheck,
    title: 'SEO para Ajudar nas Vendas',
    description: 'Plataforma otimizada para seu curso ser encontrado nas pesquisas orgânicas dos principais buscadores, especialmente no Google.',
    color: 'text-teal-500',
    bg: 'bg-teal-50',
  },
  {
    icon: MessageSquare,
    title: 'Fórum de Última Geração',
    description: 'Alunos podem fazer perguntas públicas ou privadas diretamente ao moderador, criando um ambiente interativo e colaborativo.',
    color: 'text-violet-500',
    bg: 'bg-violet-50',
  },
  {
    icon: Video,
    title: 'Apostila Digital',
    description: 'Organize conteúdos por módulos, ofereça material de apoio e facilite a revisão dos alunos com estudo guiado dentro da plataforma.',
    color: 'text-red-500',
    bg: 'bg-red-50',
  },
  {
    icon: VideoIcon,
    title: 'Videoconferências',
    description: 'Integração com Zoom para reunir alunos, professores e profissionais na mesma sala virtual. Grave aulas e facilite a comunicação.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: Brain,
    title: 'Pontuação por Área de Conhecimento',
    description: 'Analise o conhecimento dos alunos por meio de pontuações em áreas específicas. Visão detalhada do desempenho de cada um.',
    color: 'text-fuchsia-500',
    bg: 'bg-fuchsia-50',
  },
  {
    icon: ClipboardList,
    title: 'Simulados',
    description: 'Simulados para provas importantes ou preparatórios para concursos. Defina data, horário, tipo de pontuação e muito mais!',
    color: 'text-lime-600',
    bg: 'bg-lime-50',
  },
  {
    icon: RefreshCw,
    title: 'Pagamentos Recorrentes',
    description: 'Plataforma com todas as regras para recorrência: boleto e cartão com ou sem limite de parcelas. Sem dor de cabeça!',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    icon: FileText,
    title: 'Provas',
    description: 'Faça provas com questões objetivas ou subjetivas diretamente na plataforma. Avaliações personalizadas de maneira eficiente.',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  {
    icon: ShieldCheck,
    title: 'Segurança contra Pirataria',
    description: 'Segurança em software, criptografia e equipe de engenheiros de rede. Somos um provedor de internet e conteúdo sem igual.',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
  },
  {
    icon: Smartphone,
    title: 'Aplicativo no Celular',
    description: 'APP com funções avançadas, download de aulas para visualização offline e várias outras funções personalizadas para alunos e colaboradores.',
    color: 'text-rose-500',
    bg: 'bg-rose-50',
  },
  {
    icon: Award,
    title: 'Certificados Completos',
    description: 'Certificado com quantas páginas forem necessárias. Envie o modelo e a plataforma preenche automaticamente com os dados do aluno!',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
  },
  {
    icon: ShoppingCart,
    title: 'E-commerce Completo',
    description: 'Aumente suas vendas com nosso e-commerce completo. Experiência do usuário otimizada para converter mais e vender melhor.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
];

export default function FeaturesSection() {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground">Recursos da Plataforma</h3>
        <p className="text-muted-foreground text-sm mt-1">Tudo que você precisa para ensinar online com excelência</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="flex flex-col gap-3 p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200 bg-background group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${feature.bg} shrink-0`}>
                <Icon size={20} className={feature.color} />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground leading-tight mb-1">{feature.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}