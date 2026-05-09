import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';
import { CalendarDays, Plus, Trash2, ChevronLeft, ChevronRight, Clock, Video, FileText, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, parseISO, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const EVENT_TYPES = {
  personal: { label: 'Pessoal', color: 'bg-purple-500', dot: 'bg-purple-500' },
  study: { label: 'Estudo', color: 'bg-blue-500', dot: 'bg-blue-500' },
  live: { label: 'Aula ao Vivo', color: 'bg-red-500', dot: 'bg-red-500' },
  task: { label: 'Tarefa', color: 'bg-orange-500', dot: 'bg-orange-500' },
  exam: { label: 'Prova', color: 'bg-pink-500', dot: 'bg-pink-500' },
  reminder: { label: 'Lembrete', color: 'bg-green-500', dot: 'bg-green-500' },
};

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function Calendar() {
  const { user: session } = useOutletContext();
  const isAdmin = session?.role === 'admin';
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', date: '', time: '', type: 'personal' });

  const { data: myEvents = [] } = useQuery({
    queryKey: ['calendar-events', session?.email],
    queryFn: () => base44.entities.CalendarEvent.filter({ student_email: session?.email }, '-date', 200),
    enabled: !!session?.email,
  });

  const { data: liveSessions = [] } = useQuery({
    queryKey: ['live-sessions'],
    queryFn: () => base44.entities.LiveSession.list('-scheduled_at', 50),
  });

  const userCourse = session?.course;
  const { emails: courseEmails } = useCourseFilteredEmails();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-calendar', isAdmin ? 'all' : userCourse],
    queryFn: () => isAdmin
      ? base44.entities.Task.list('-created_date', 200)
      : base44.entities.Task.filter({ course: userCourse || 'tcc' }, '-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CalendarEvent.create({ ...data, student_email: session?.email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events', session?.email] });
      setShowForm(false);
      setForm({ title: '', description: '', date: '', time: '', type: 'personal' });
      toast.success('Evento adicionado!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CalendarEvent.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendar-events', session?.email] }),
  });

  const monthDays = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const firstDayOfWeek = startOfMonth(currentMonth).getDay();
  const paddingDays = Array(firstDayOfWeek).fill(null);

  // Combine all events
  const allEvents = [
    ...myEvents.map(e => ({ ...e, source: 'personal' })),
    ...liveSessions.filter(s => s.scheduled_at).map(s => ({
      id: `live-${s.id}`,
      title: `📡 ${s.title}`,
      date: s.scheduled_at.split('T')[0],
      time: s.scheduled_at.includes('T') ? s.scheduled_at.split('T')[1].slice(0, 5) : '',
      type: 'live',
      source: 'platform',
    })),
    ...tasks.filter(t => t.deadline).map(t => ({
      id: `task-${t.id}`,
      title: `${t.type === 'quiz' ? '📝' : '📋'} ${t.title}`,
      date: t.deadline.split('T')[0],
      time: t.deadline.includes('T') ? t.deadline.split('T')[1].slice(0, 5) : '',
      type: t.type === 'quiz' ? 'exam' : 'task',
      source: 'platform',
    })),
  ];

  const getEventsForDay = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return allEvents.filter(e => e.date === dayStr);
  };

  const selectedDayEvents = getEventsForDay(selectedDay);

  return (
    <div className="p-4 lg:p-7 max-w-5xl mx-auto animate-fade-in-up">
      <div className="flex items-center justify-between mb-5 gap-3">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground">Calendário</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Seus eventos e compromissos</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="gap-2 h-9 text-sm"><Plus size={15} /> Novo Evento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Adicionar Evento</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <Input placeholder="Título do evento" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              <Textarea placeholder="Descrição (opcional)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Data</label>
                  <Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Horário</label>
                  <Input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
                </div>
              </div>
              <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_TYPES).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => createMutation.mutate(form)} disabled={!form.title || !form.date} className="w-full">
                Salvar Evento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-secondary rounded-xl transition-colors">
              <ChevronLeft size={18} className="text-muted-foreground" />
            </button>
            <h3 className="font-bold text-foreground capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h3>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-secondary rounded-xl transition-colors">
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[11px] font-bold text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {paddingDays.map((_, i) => <div key={`pad-${i}`} />)}
            {monthDays.map(day => {
              const dayEvents = getEventsForDay(day);
              const isSel = isSameDay(day, selectedDay);
              const today = isToday(day);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square flex flex-col items-center justify-start pt-1 rounded-xl text-sm font-medium transition-all relative ${
                    isSel
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                      : today
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'hover:bg-secondary text-foreground'
                  }`}
                >
                  <span className="text-xs">{format(day, 'd')}</span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                      {dayEvents.slice(0, 3).map((e, ei) => (
                        <span
                          key={ei}
                          className={`w-1.5 h-1.5 rounded-full ${isSel ? 'bg-white/70' : (EVENT_TYPES[e.type]?.dot || 'bg-primary')}`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border">
            {Object.entries(EVENT_TYPES).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${val.dot}`} />
                <span className="text-[10px] text-muted-foreground">{val.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Day events sidebar */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-bold text-foreground mb-1">
            {format(selectedDay, "d 'de' MMMM", { locale: ptBR })}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            {isToday(selectedDay) ? 'Hoje' : format(selectedDay, 'EEEE', { locale: ptBR })}
          </p>

          {selectedDayEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarDays size={36} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">Nenhum evento neste dia</p>
              <p className="text-xs mt-1">Clique em "Novo Evento" para adicionar</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDayEvents.map(event => {
                const typeCfg = EVENT_TYPES[event.type] || EVENT_TYPES.personal;
                return (
                  <div key={event.id} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50 border border-border group">
                    <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${typeCfg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{event.title}</p>
                      {event.time && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock size={9} /> {event.time}
                        </p>
                      )}
                      {event.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{event.description}</p>}
                    </div>
                    {event.source === 'personal' && (
                      <button
                        onClick={() => deleteMutation.mutate(event.id)}
                        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}