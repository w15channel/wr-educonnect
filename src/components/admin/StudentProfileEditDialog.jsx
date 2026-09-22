import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { invalidateStudentIdentity } from '@/lib/studentIdentityCache';

// Permite ao admin pré-preencher informações importantes do perfil de um aluno
// (apelido, data de nascimento, WhatsApp, e-mail pessoal, apresentação) no momento
// do cadastro — antes mesmo do aluno acessar a plataforma pela primeira vez.
export default function StudentProfileEditDialog({ code, onClose }) {
  const queryClient = useQueryClient();
  const [nickname, setNickname] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['student-profile-edit', code?.id],
    queryFn: () => base44.entities.StudentProfile.filter({ code_id: code.id }, '-created_date', 1),
    enabled: !!code?.id,
  });
  const existingProfile = profiles[0] || null;

  useEffect(() => {
    if (existingProfile) {
      setNickname(existingProfile.nickname || '');
      setBirthDate(existingProfile.birth_date || '');
      setWhatsapp(existingProfile.whatsapp || '');
      setEmail(existingProfile.email || code?.student_email || '');
      setBio(existingProfile.bio || code?.profile_bio || '');
    } else {
      setNickname('');
      setBirthDate('');
      setWhatsapp('');
      setEmail(code?.student_email || '');
      setBio(code?.profile_bio || '');
    }
  }, [existingProfile, code]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        code_id: code.id,
        student_email: code.student_email || '',
        full_name: code.profile_name || code.student_name || '',
        nickname,
        birth_date: birthDate,
        whatsapp,
        email,
        bio,
      };
      if (existingProfile) {
        return base44.entities.StudentProfile.update(existingProfile.id, data);
      }
      return base44.entities.StudentProfile.create(data);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['student-profile-edit', code.id] });
      queryClient.invalidateQueries({ queryKey: ['student-profiles'] });
      await invalidateStudentIdentity(queryClient);
      toast.success('Perfil do aluno atualizado!');
      onClose();
    },
    onError: () => toast.error('Erro ao salvar perfil.'),
  });

  return (
    <Dialog open={!!code} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Perfil — {code?.profile_name || code?.student_name}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="h-40 bg-muted rounded-xl animate-pulse" />
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Apelido / Nickname</label>
                <Input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Como será chamado(a)" />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Data de Nascimento</label>
                <Input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">WhatsApp</label>
                <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(00) 00000-0000" />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">E-mail Pessoal</label>
                <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="aluno@email.com" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">Apresentação Pessoal</label>
              <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Informações importantes sobre o aluno..." rows={3} />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || isLoading}>
            {saveMutation.isPending ? 'Salvando...' : 'Salvar Perfil'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
