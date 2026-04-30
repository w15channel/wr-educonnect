import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TYPE_COLORS = {
  aula: 'bg-blue-500',
  prova: 'bg-red-500',
  tarefa: 'bg-orange-500',
  evento: 'bg-purple-500',
  feriado: 'bg-green-500',
};
const TYPE_LABELS = { aula: 'Aula', prova: 'Prova', tarefa: 'Tarefa', evento: 'Evento', feriado: 'Feriado' };

export default function Calendar() {
  const { user: session } = useOutletContext();
  const isAdmin = session?.role === 'admin';
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', event_date: '', event_time: '', type: 'aula' });

  const { data: events = [] } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: () => base44.entities.CalendarEvent.list('event_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CalendarEvent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setShowForm(false);
      setForm({ title: '', description: '', event_date: '', event_time: '', type: 'aula' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CalendarEvent.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendar-events'] }),
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart); // 0=Sun

  const getEventsForDay = (day) => events.filter(e => isSameDay(new Date(e.event_date + 'T12:00:00'), day));

  const upcomingEvents = events
    .filter(e => new Date(e.event_date) >= new Date(new Date().setHours(0,0,0,0)))
    .slice(0, 8);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Calendário</h2>
          <p className="text-muted-foreground text-sm mt-1">Aulas, provas e eventos</p>
        </div>
        {isAdmin && (
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus size={16} /> Novo Evento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar Evento</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <Input placeholder="Título" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                <Textarea placeholder="Descrição (opcional)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} />
                <div className="grid grid-cols-2 gap-3">
                  <Input type="date" value={form.event_date} onChange={e => setForm({...form, event_date: e.target.value})} />
                  <Input type="time" value={form.event_time} onChange={e => setForm({...form, event_time: e.target.value})} />
                </div>
                <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={() => createMutation.mutate(form)} disabled={!form.title || !form.event_date} className="w-full">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <ChevronLeft size={18} />
            </button>
            <h3 className="text-base font-bold capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h3>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-px mb-1">
            {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
            {days.map(day => {
              const dayEvents = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[56px] p-1.5 rounded-lg border transition-colors ${
                    isToday ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-secondary/50'
                  }`}
                >
                  <span className={`text-xs font-medium block text-center mb-1 w-6 h-6 flex items-center justify-center rounded-full mx-auto ${isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>
                    {format(day, 'd')}
                  </span>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map(ev => (
                      <div key={ev.id} className="flex items-center gap-1 group">
                        <span className={`text-[10px] text-white px-1 py-0.5 rounded truncate flex-1 ${TYPE_COLORS[ev.type] || 'bg-primary'}`}>
                          {ev.title}
                        </span>
                        {isAdmin && (
                          <button onClick={() => deleteMutation.mutate(ev.id)} className="opacity-0 group-hover:opacity-100 text-destructive">
                            <Trash2 size={10} />
                          </button>
                        )}
                      </div>
                    ))}
                    {dayEvents.length > 2 && <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 2}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border">
            {Object.entries(TYPE_LABELS).map(([type, label]) => (
              <div key={type} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${TYPE_COLORS[type]}`} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
            <CalIcon size={16} className="text-primary" /> Próximos Eventos
          </h3>
          {upcomingEvents.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum evento próximo.</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map(ev => (
                <div key={ev.id} className="flex gap-3 items-start">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${TYPE_COLORS[ev.type] || 'bg-primary'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(ev.event_date + 'T12:00:00'), 'dd/MM/yyyy')}
                      {ev.event_time && ` às ${ev.event_time}`}
                    </p>
                    <span className={`text-[10px] text-white px-1.5 py-0.5 rounded-full mt-0.5 inline-block ${TYPE_COLORS[ev.type] || 'bg-primary'}`}>
                      {TYPE_LABELS[ev.type]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}