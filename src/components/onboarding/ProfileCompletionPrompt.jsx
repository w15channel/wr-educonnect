import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IdCard, Cake, Smile, Palette, BookUser, Mail, Phone, X } from 'lucide-react';

const FIELDS = [
  { icon: IdCard, title: 'Nome completo', desc: 'Exatamente como está no seu documento — é este nome que será impresso no seu certificado.' },
  { icon: Cake, title: 'Data de nascimento', desc: 'Confirma sua identificação acadêmica e evita troca de cadastros com nomes parecidos.' },
  { icon: Smile, title: 'Apelido / nickname', desc: 'Como você quer ser chamado(a) pelos colegas e pelo sistema no dia a dia.' },
  { icon: Palette, title: 'Avatar e cor favorita', desc: 'Sua identidade visual na turma, no ranking e no mural de conquistas.' },
  { icon: BookUser, title: 'Apresentação pessoal', desc: 'Em poucas linhas: quem você é, sua trajetória, conquistas e sonhos.' },
  { icon: Mail, title: 'Email de preferência', desc: 'Canal oficial para avisos, documentos e envio do seu certificado.' },
  { icon: Phone, title: 'WhatsApp com DDD', desc: 'Contato direto da coordenação e do suporte quando você precisar.' },
];

/**
 * Primeiro acesso: depois do tutorial, convidamos o aluno a completar o perfil.
 * Um perfil completo evita preenchimento manual pela coordenação e garante a
 * emissão correta dos certificados.
 */
export default function ProfileCompletionPrompt({ onClose }) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg max-h-[92dvh] overflow-y-auto rounded-3xl bg-background p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Último passo</p>
            <h2 className="mt-1 text-xl font-bold text-foreground">Complete o seu perfil de aluno</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Todos os dados do perfil são importantes para o bom funcionamento da plataforma: eles identificam você
          corretamente na turma, organizam sua pontuação e histórico acadêmico e são a base para a emissão do seu
          certificado. Preenchendo agora, você não precisará corrigir informações depois.
        </p>

        <ul className="mt-4 space-y-2.5">
          {FIELDS.map(({ icon: Icon, title, desc }) => (
            <li key={title} className="flex gap-3 rounded-2xl border border-border p-3">
              <Icon size={16} className="text-primary shrink-0 mt-0.5" />
              <span>
                <span className="block text-sm font-bold text-foreground">{title}</span>
                <span className="block text-[12px] text-muted-foreground">{desc}</span>
              </span>
            </li>
          ))}
        </ul>

        <button
          onClick={() => navigate('/student/profile')}
          className="mt-5 w-full h-12 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
        >
          Preencher meu perfil agora
        </button>
        <button
          onClick={onClose}
          className="mt-3 w-full text-[11px] font-semibold text-muted-foreground/80 underline hover:text-foreground"
        >
          Preencher depois
        </button>
      </div>
    </div>
  );
}