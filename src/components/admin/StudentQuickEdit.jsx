import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { PROFILE_FUNCTIONS } from '@/lib/profileRoles';

/**
 * Edição rápida do usuário: nome, e-mail, função e situação.
 * A função salva concede automaticamente os privilégios do papel escolhido
 * no próximo acesso do usuário.
 */
export default function StudentQuickEdit({ code, onDone }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(code.profile_name || code.student_name || '');
  const [email, setEmail] = useState(code.student_email || '');
  const [profileCategory, setProfileCategory] = useState(code.profile_category || 'student');
  const [isActive, setIsActive] = useState(code.is_active !== false);

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.AccessCode.update(code.id, {
      student_name: name.trim(),
      profile_name: name.trim(),
      student_email: email.trim(),
      profile_category: profileCategory,
      is_active: isActive,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-codes'] });
      toast.success('Dados salvos no servidor!');
      onDone();
    },
    onError: () => toast.error('Erro ao salvar os dados.'),
  });

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3.5 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground block mb-1">Nome</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10 text-sm" placeholder="Nome do usuário" />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground block mb-1">E-mail</label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 text-sm" placeholder="email@exemplo.com" />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground block mb-1">Função</label>
          <Select value={profileCategory} onValueChange={setProfileCategory}>
            <SelectTrigger className="h-10 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PROFILE_FUNCTIONS.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground block mb-1">Situação</label>
          <Select value={isActive ? 'active' : 'inactive'} onValueChange={(v) => setIsActive(v === 'active')}>
            <SelectTrigger className="h-10 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">
        A função escolhida define a identificação e os privilégios do usuário na plataforma.
      </p>
      <div className="flex items-center gap-2">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="h-10 gap-2 text-xs font-bold">
          <Save size={15} /> {saveMutation.isPending ? 'Salvando...' : 'Salvar no servidor'}
        </Button>
        <Button variant="outline" onClick={onDone} className="h-10 gap-2 text-xs">
          <X size={15} /> Cancelar
        </Button>
      </div>
    </div>
  );
}