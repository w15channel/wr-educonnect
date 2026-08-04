import React from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, CheckCheck, ClipboardList, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function useScopedPrefix() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  if ((parts[0] === 'student' || parts[0] === 'adm') && parts[1]) {
    return `/${parts[0]}/${parts[1]}`;
  }
  return '';
}

function useCourseSlug() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  if ((parts[0] === 'student' || parts[0] === 'adm') && parts[1]) return parts[1];
  return null;
}

const SLUG_TO_PREFIX = { sex: 'SEX-', tcc: 'EDU-', psi: 'PSI-' };

export default function Notifications() {
  const { user: session } = useOutletContext() || {};
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const prefix = useScopedPrefix();
  const courseSlug = useCourseSlug();
  const codePrefix = courseSlug ? SLUG_TO_PREFIX[courseSlug] : null;
  const isAdmin = session?.role === 'admin';

  const { data: allNotifications = [] } = useQuery({
    queryKey: ['notifications-admin'],
    queryFn: () => base44.entities.Notification.filter({ recipient_email: 'admin' }, '-created_date', 200),
    enabled: isAdmin,
    refetchInterval: 15000,
  });

  const { data: accessCodes = [] } = useQuery({
    queryKey: ['access-codes-notif'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 500),
    enabled: isAdmin,
  });

  // Build set of emails that belong to the current course (by code prefix)
  const courseEmails = React.useMemo(() => {
    if (!codePrefix) return null;
    const set = new Set();
    accessCodes.forEach(c => {
      if ((c.code || '').startsWith(codePrefix) && c.student_email) set.add(c.student_email);
    });
    return set;
  }, [accessCodes, codePrefix]);

  const notifications = React.useMemo(() => {
    if (!courseEmails) return allNotifications;
    return allNotifications.filter(n => n.sender_email && courseEmails.has(n.sender_email));
  }, [allNotifications, courseEmails]);

  const unread = notifications.filter(n => !n.is_read);

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications-admin'] }),
  });

  const markOneRead = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications-admin'] }),
  });

  if (!isAdmin) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <p className="text-sm text-muted-foreground text-center py-12">Esta página é restrita a administradores.</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-7 max-w-3xl mx-auto space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
          <Bell size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl lg:text-2xl font-bold text-foreground">Notificações</h2>
          <p className="text-sm text-muted-foreground">Entregas dos alunos e atualizações da turma</p>
        </div>
        {unread.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <CheckCheck size={14} /> Marcar todas lidas
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Não lidas</p>
          <p className="text-2xl font-black text-orange-500">{unread.length}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-black text-foreground">{notifications.length}</p>
        </div>
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl py-16 text-center">
          <ClipboardList size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm font-semibold text-muted-foreground">Nenhuma notificação ainda</p>
          <p className="text-xs text-muted-foreground mt-1">Quando alunos enviarem tarefas, elas aparecerão aqui.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.is_read) markOneRead.mutate(n.id);
                const dest = n.sender_email
                  ? `${prefix}/scorecontrol?student=${encodeURIComponent(n.sender_email)}`
                  : `${prefix}/scorecontrol`;
                navigate(dest);
              }}
              className={`flex gap-3 p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-md ${
                !n.is_read
                  ? 'bg-orange-50/50 border-orange-200 hover:border-orange-300'
                  : 'bg-card border-border hover:border-primary/20'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0 text-sm font-black text-orange-700">
                {(n.sender_name || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                  {n.message}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {format(new Date(n.created_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </p>
                {n.sender_email && (
                  <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                    Ver pontuação do aluno →
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!n.is_read && <span className="w-2 h-2 bg-orange-500 rounded-full" />}
                <ArrowRight size={14} className="text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}