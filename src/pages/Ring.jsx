import React from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, CheckCheck, ClipboardList, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

function useScopedPrefix() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  if ((parts[0] === 'student' || parts[0] === 'adm') && parts[1]) {
    return `/${parts[0]}/${parts[1]}`;
  }
  return '';
}

export default function Ring() {
  const { user: session } = useOutletContext() || {};
  const navigate = useNavigate();
  const prefix = useScopedPrefix();
  const queryClient = useQueryClient();
  const isAdmin = session?.role === 'admin';

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications-admin'],
    queryFn: () => base44.entities.Notification.filter({ recipient_email: 'admin' }, '-created_date', 200),
    enabled: isAdmin,
    refetchInterval: 15000,
  });

  const unread = notifications.filter(n => !n.is_read);

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications-admin'] }),
  });

  const markOneRead = async (id) => {
    await base44.entities.Notification.update(id, { is_read: true });
    queryClient.invalidateQueries({ queryKey: ['notifications-admin'] });
  };

  if (!isAdmin) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Esta página é exclusiva para administradores.
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-7 max-w-3xl mx-auto animate-fade-in-up">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
            <Bell size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-foreground">Notificações</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {unread.length > 0
                ? `${unread.length} ${unread.length === 1 ? 'nova entrega' : 'novas entregas'}`
                : 'Tudo em dia'}
            </p>
          </div>
        </div>
        {unread.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <CheckCheck size={14} /> Marcar todas como lidas
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border py-16 text-center text-muted-foreground">
          <ClipboardList size={42} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm font-semibold">Nenhuma entrega ainda</p>
          <p className="text-xs mt-1">As notificações dos alunos aparecerão aqui.</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.is_read) markOneRead(n.id);
                navigate(`${prefix}/scores`);
              }}
              className={`flex gap-3 px-4 py-3.5 border-b border-border/50 last:border-b-0 cursor-pointer hover:bg-secondary/30 transition-colors ${!n.is_read ? 'bg-orange-50/50' : ''}`}
            >
              <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0 text-xs font-bold text-orange-700">
                {(n.sender_name || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                  {n.message}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {format(new Date(n.created_date), "dd/MM/yyyy 'às' HH:mm")}
                </p>
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