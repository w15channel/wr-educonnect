import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, CheckCheck, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function NotificationsBell({ session }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const isAdmin = session?.role === 'admin';

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications-admin'],
    queryFn: () => base44.entities.Notification.filter({ recipient_email: 'admin' }, '-created_date', 50),
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

  if (!isAdmin) return null;

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(v => !v); }}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors"
      >
        <Bell size={18} className={unread.length > 0 ? 'text-orange-500' : 'text-muted-foreground'} />
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-11 z-50 w-80 bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell size={15} className="text-orange-500" />
                <span className="font-bold text-sm text-foreground">Entregas dos Alunos</span>
                {unread.length > 0 && (
                  <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{unread.length} nova{unread.length > 1 ? 's' : ''}</span>
                )}
              </div>
              {unread.length > 0 && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <CheckCheck size={12} /> Marcar lidas
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <ClipboardList size={28} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs">Nenhuma entrega ainda</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => { navigate('/scores'); setOpen(false); }}
                    className={`flex gap-3 px-4 py-3 border-b border-border/50 cursor-pointer hover:bg-secondary/30 transition-colors ${!n.is_read ? 'bg-orange-50/50' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0 text-[11px] font-bold text-orange-700">
                      {(n.sender_name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-snug ${!n.is_read ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{format(new Date(n.created_date), 'dd/MM HH:mm')}</p>
                    </div>
                    {!n.is_read && <span className="w-2 h-2 bg-orange-500 rounded-full shrink-0 mt-1" />}
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <button
                onClick={() => { navigate('/scores'); setOpen(false); }}
                className="w-full py-2.5 text-xs text-primary font-semibold hover:bg-secondary/30 transition-colors border-t border-border"
              >
                Ver todas as entregas →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}