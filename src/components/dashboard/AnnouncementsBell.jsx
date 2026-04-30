import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, AlertCircle, Info, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const READ_KEY = 'wреdu_read_announcements';

const getReadIds = () => {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')); }
  catch { return new Set(); }
};
const markRead = (id) => {
  const ids = getReadIds();
  ids.add(id);
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
};
const markAllRead = (ids) => {
  localStorage.setItem(READ_KEY, JSON.stringify(ids));
};

const typeIcons = { info: Info, warning: AlertCircle, urgent: Bell };
const typeColors = {
  info: 'bg-primary/5 border-primary/20 text-primary',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  urgent: 'bg-destructive/5 border-destructive/20 text-destructive',
};

export default function AnnouncementsBell({ limit = 3 }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [readIds, setReadIds] = useState(getReadIds);

  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => base44.entities.Announcement.list('-created_date', 20),
  });

  const unread = announcements.filter(a => !readIds.has(a.id));
  const displayed = expanded ? announcements : announcements.slice(0, limit);

  const handleOpen = () => {
    setExpanded(v => !v);
    // mark all as read on open
    const allIds = announcements.map(a => a.id);
    markAllRead(allIds);
    setReadIds(new Set(allIds));
  };

  if (announcements.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={handleOpen}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Bell size={18} className={unread.length > 0 ? 'text-destructive' : 'text-muted-foreground'} />
            {unread.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-destructive text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {unread.length > 9 ? '9+' : unread.length}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-sm text-foreground">Mural de Avisos</h3>
          {unread.length > 0 && (
            <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">
              {unread.length} novo{unread.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/announcements'); }}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Ver todos <ExternalLink size={11} />
          </button>
          {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </div>
      </button>

      {/* Items */}
      <div className={`transition-all duration-300 ${expanded ? '' : ''}`}>
        {displayed.map(a => {
          const Icon = typeIcons[a.type] || Info;
          const isUnread = !readIds.has(a.id);
          return (
            <div
              key={a.id}
              className={`flex gap-3 px-5 py-3.5 border-t border-border transition-all ${isUnread ? 'bg-secondary/20' : ''}`}
              onClick={() => { markRead(a.id); setReadIds(new Set([...readIds, a.id])); }}
            >
              <Icon size={16} className={`shrink-0 mt-0.5 ${typeColors[a.type]?.split(' ').find(c => c.startsWith('text-')) || 'text-muted-foreground'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {a.title && <p className={`text-sm font-semibold truncate ${isUnread ? 'text-foreground' : 'text-muted-foreground'}`}>{a.title}</p>}
                    {isUnread && <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{format(new Date(a.created_date), 'dd/MM')}</span>
                </div>
                <p className={`text-xs mt-0.5 line-clamp-2 ${isUnread ? 'text-foreground/80' : 'text-muted-foreground'}`}>{a.content}</p>
              </div>
            </div>
          );
        })}

        {!expanded && announcements.length > limit && (
          <button onClick={handleOpen} className="w-full py-2.5 text-xs text-primary hover:bg-secondary/30 transition-colors border-t border-border">
            Ver mais {announcements.length - limit} avisos
          </button>
        )}
      </div>
    </div>
  );
}