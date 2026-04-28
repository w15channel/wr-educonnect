import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Play, Clock, Plus, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';

export default function Lessons() {
  const { user: session } = useOutletContext();
  const user = session;
  const isTeacher = session?.role === 'admin';
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', video_url: '', duration: '' });
  const [selectedVideo, setSelectedVideo] = useState(null);

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['lessons'],
    queryFn: () => base44.entities.RecordedLesson.list('order', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RecordedLesson.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      setShowForm(false);
      setForm({ title: '', description: '', video_url: '', duration: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RecordedLesson.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lessons'] }),
  });

  const getEmbedUrl = (url) => {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return url;
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Aulas Gravadas</h2>
          <p className="text-muted-foreground text-sm mt-1">Assista às aulas no seu ritmo</p>
        </div>
        {isTeacher && (
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus size={16} /> Nova Aula</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Aula Gravada</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input placeholder="Título da aula" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                <Textarea placeholder="Descrição" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                <Input placeholder="URL do vídeo (YouTube, Vimeo, etc.)" value={form.video_url} onChange={e => setForm({...form, video_url: e.target.value})} />
                <Input placeholder="Duração (ex: 45 min)" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} />
                <Button onClick={() => createMutation.mutate({...form, order: lessons.length + 1})} disabled={!form.title} className="w-full">
                  Salvar Aula
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Video Player Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedVideo?.title}</DialogTitle>
          </DialogHeader>
          {selectedVideo && (
            <div className="mt-2">
              {getEmbedUrl(selectedVideo.video_url) ? (
                <div className="aspect-video rounded-xl overflow-hidden bg-black">
                  <iframe
                    src={getEmbedUrl(selectedVideo.video_url)}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              ) : (
                <div className="aspect-video rounded-xl bg-muted flex items-center justify-center flex-col gap-3">
                  <p className="text-muted-foreground">Vídeo não disponível para embed</p>
                  {selectedVideo.video_url && (
                    <a href={selectedVideo.video_url} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center gap-1 text-sm hover:underline">
                      <ExternalLink size={14} /> Abrir link externo
                    </a>
                  )}
                </div>
              )}
              {selectedVideo.description && <p className="text-muted-foreground mt-4 text-sm">{selectedVideo.description}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3].map(i => (
            <div key={i} className="bg-card rounded-2xl border border-border animate-pulse">
              <div className="h-40 bg-muted rounded-t-2xl" />
              <div className="p-4 space-y-2"><div className="h-4 bg-muted rounded w-3/4" /><div className="h-3 bg-muted rounded w-1/2" /></div>
            </div>
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Play size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Nenhuma aula gravada ainda</p>
          {isTeacher && <p className="text-sm mt-1">Clique em "Nova Aula" para adicionar</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {lessons.map(lesson => (
            <div
              key={lesson.id}
              onClick={() => setSelectedVideo(lesson)}
              className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="h-40 bg-foreground/5 relative flex items-center justify-center">
                {lesson.thumbnail_url ? (
                  <img src={lesson.thumbnail_url} alt={lesson.title} className="w-full h-full object-cover" />
                ) : (
                  <Play size={40} className="text-muted-foreground/30 group-hover:scale-110 transition-transform" />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={20} className="text-primary-foreground ml-0.5" />
                  </div>
                </div>
                {lesson.duration && (
                  <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md font-medium">
                    {lesson.duration}
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm leading-snug">{lesson.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1.5">
                      <Clock size={12} /> {format(new Date(lesson.created_date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  {isTeacher && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(lesson.id); }}
                      className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}