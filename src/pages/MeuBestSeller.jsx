import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BookOpen, Plus, Trash2, ChevronLeft, Download, Search, Wand2, Loader2, Image, AlignLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import ReactQuill from 'react-quill';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

const COVER_SUGGESTIONS = [
  'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&q=80',
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
  'https://images.unsplash.com/photo-1474932430478-367dbb6832c1?w=400&q=80',
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&q=80',
  'https://images.unsplash.com/photo-1499244571948-7ccddb3583f1?w=400&q=80',
  'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400&q=80',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=80',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80',
];

const PAGE_FORMATS = [
  { value: 'A4', label: 'A4 (210×297mm)' },
  { value: 'A5', label: 'A5 (148×210mm)' },
  { value: 'Letter', label: 'Letter (216×279mm)' },
  { value: '6x9', label: 'Livro 6×9 (152×229mm)' },
];

const STATUS_LABELS = { draft: 'Rascunho', in_progress: 'Em andamento', finished: 'Finalizado' };
const STATUS_COLORS = { draft: 'bg-muted text-muted-foreground', in_progress: 'bg-blue-100 text-blue-700', finished: 'bg-green-100 text-green-700' };

export default function MeuBestSeller() {
  const { user: session } = useOutletContext();
  const queryClient = useQueryClient();
  const [selectedBook, setSelectedBook] = useState(null);
  const [editingChapter, setEditingChapter] = useState(null);
  const [chapterContent, setChapterContent] = useState('');
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [coverSearch, setCoverSearch] = useState('');
  const [coverResults, setCoverResults] = useState(COVER_SUGGESTIONS);
  const [aiLoading, setAiLoading] = useState(false);
  const [newBookForm, setNewBookForm] = useState({ title: '', subtitle: '', page_format: 'A4', cover_image_url: '', dedication: '', preface: '' });
  const [showNewBook, setShowNewBook] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const { data: books = [] } = useQuery({
    queryKey: ['books', session?.email],
    queryFn: () => base44.entities.Book.filter({ author_email: session?.email }, '-created_date', 50),
    enabled: !!session?.email,
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ['book-chapters', selectedBook?.id],
    queryFn: () => base44.entities.BookChapter.filter({ book_id: selectedBook?.id }, 'order', 100),
    enabled: !!selectedBook?.id,
  });

  const createBookMutation = useMutation({
    mutationFn: (data) => base44.entities.Book.create(data),
    onSuccess: (book) => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setShowNewBook(false);
      setSelectedBook(book);
      toast.success('Livro criado!');
    },
  });

  const updateBookMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Book.update(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setSelectedBook(prev => ({ ...prev, ...updated }));
    },
  });

  const createChapterMutation = useMutation({
    mutationFn: (data) => base44.entities.BookChapter.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-chapters', selectedBook?.id] });
      toast.success('Capítulo adicionado!');
    },
  });

  const updateChapterMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BookChapter.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-chapters', selectedBook?.id] });
      setEditingChapter(null);
      toast.success('Capítulo salvo!');
    },
  });

  const deleteChapterMutation = useMutation({
    mutationFn: (id) => base44.entities.BookChapter.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['book-chapters', selectedBook?.id] }),
  });

  const deleteBookMutation = useMutation({
    mutationFn: (id) => base44.entities.Book.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setSelectedBook(null);
      toast.success('Livro removido.');
    },
  });

  const handleSearchCover = async () => {
    if (!coverSearch.trim()) return;
    const query = encodeURIComponent(coverSearch + ' book cover background');
    setCoverResults([
      `https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&q=80&sig=${Math.random()}`,
      `https://source.unsplash.com/400x600/?${encodeURIComponent(coverSearch)}`,
      `https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80`,
      `https://images.unsplash.com/photo-1474932430478-367dbb6832c1?w=400&q=80`,
      `https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&q=80`,
      `https://images.unsplash.com/photo-1499244571948-7ccddb3583f1?w=400&q=80`,
      `https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400&q=80`,
      `https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=80`,
    ]);
    toast.info('Mostrando sugestões de capa.');
  };

  const handleAISuggest = async () => {
    if (!editingChapter) return;
    setAiLoading(true);
    const bookTitle = selectedBook?.title || 'meu livro';
    const chapTitle = editingChapter.title || 'capítulo';
    const currentText = chapterContent.replace(/<[^>]+>/g, '').substring(0, 500);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Sou um estudante escrevendo um livro chamado "${bookTitle}". Estou no capítulo "${chapTitle}". ${currentText ? `O que escrevi até agora: "${currentText}". ` : ''}Sugira um parágrafo criativo e inspirador para continuar este capítulo, no estilo de um livro de desenvolvimento pessoal. Escreva em português, de forma fluida e envolvente. Responda apenas com o parágrafo sugerido.`,
    });
    setChapterContent(prev => prev + `<p>${result}</p>`);
    setAiLoading(false);
    toast.success('Sugestão da IA adicionada!');
  };

  const handleExportPDF = async () => {
    setPdfLoading(true);
    const formatMap = { A4: [210, 297], A5: [148, 210], Letter: [216, 279], '6x9': [152, 229] };
    const dims = formatMap[selectedBook?.page_format] || [210, 297];
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: dims });
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();

    // Capa
    if (selectedBook?.cover_image_url) {
      try {
        pdf.addImage(selectedBook.cover_image_url, 'JPEG', 0, 0, W, H);
      } catch {}
    } else {
      pdf.setFillColor(30, 30, 60);
      pdf.rect(0, 0, W, H, 'F');
    }
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.text(selectedBook?.title || 'Meu Livro', W / 2, H / 2 - 10, { align: 'center', maxWidth: W - 20 });
    if (selectedBook?.subtitle) {
      pdf.setFontSize(13);
      pdf.text(selectedBook.subtitle, W / 2, H / 2 + 8, { align: 'center', maxWidth: W - 20 });
    }
    pdf.setFontSize(11);
    pdf.text(session?.name || '', W / 2, H - 20, { align: 'center' });

    // Dedicatória
    if (selectedBook?.dedication) {
      pdf.addPage();
      pdf.setTextColor(40, 40, 40);
      pdf.setFontSize(13);
      pdf.text('Dedicatória', W / 2, 30, { align: 'center' });
      pdf.setFontSize(11);
      pdf.text(selectedBook.dedication, 20, 50, { maxWidth: W - 40 });
    }

    // Prefácio
    if (selectedBook?.preface) {
      pdf.addPage();
      pdf.setTextColor(40, 40, 40);
      pdf.setFontSize(13);
      pdf.text('Prefácio', W / 2, 30, { align: 'center' });
      pdf.setFontSize(11);
      pdf.text(selectedBook.preface, 20, 50, { maxWidth: W - 40 });
    }

    // Capítulos
    for (const ch of chapters) {
      pdf.addPage();
      pdf.setTextColor(40, 40, 40);
      pdf.setFontSize(15);
      pdf.text(`Capítulo ${ch.order}: ${ch.title}`, W / 2, 25, { align: 'center', maxWidth: W - 20 });
      pdf.setFontSize(11);
      const plain = ch.content ? ch.content.replace(/<[^>]+>/g, '') : '';
      pdf.text(plain, 15, 40, { maxWidth: W - 30, lineHeightFactor: 1.6 });
    }

    pdf.save(`${selectedBook?.title || 'livro'}.pdf`);
    setPdfLoading(false);
    toast.success('PDF gerado!');
  };

  // ── Editor de capítulo ──
  if (editingChapter) {
    return (
      <div className="flex flex-col h-full p-4 lg:p-7 max-w-4xl mx-auto space-y-4 animate-fade-in-up">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => setEditingChapter(null)} className="gap-1.5 text-xs">
            <ChevronLeft size={14} /> Voltar ao Livro
          </Button>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => updateChapterMutation.mutate({ id: editingChapter.id, data: { content: chapterContent } })}
            disabled={updateChapterMutation.isPending}
          >
            Salvar Capítulo
          </Button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-foreground">{editingChapter.title}</h2>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleAISuggest} disabled={aiLoading}>
            {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
            Sugestão IA
          </Button>
        </div>
        <div className="flex-1 bg-white rounded-xl border border-border overflow-hidden">
          <ReactQuill
            value={chapterContent}
            onChange={setChapterContent}
            style={{ height: '60vh' }}
            theme="snow"
            modules={{
              toolbar: [
                [{ header: [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ align: [] }],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['blockquote'],
                ['clean'],
              ],
            }}
          />
        </div>
      </div>
    );
  }

  // ── Detalhes do livro ──
  if (selectedBook) {
    return (
      <div className="p-4 lg:p-7 max-w-4xl mx-auto space-y-5 animate-fade-in-up">
        <div className="flex items-center gap-3 justify-between flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => setSelectedBook(null)} className="gap-1.5 text-xs">
            <ChevronLeft size={14} /> Meus Livros
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={handleExportPDF} disabled={pdfLoading}>
              {pdfLoading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Exportar PDF
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive gap-1.5 text-xs" onClick={() => deleteBookMutation.mutate(selectedBook.id)}>
              <Trash2 size={13} /> Excluir
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <Tabs defaultValue="chapters">
            <div className="flex items-start gap-4 flex-wrap mb-4">
              {/* Capa miniatura */}
              <div
                className="w-24 h-32 rounded-xl border-2 border-border overflow-hidden cursor-pointer flex-shrink-0 relative group"
                onClick={() => setShowCoverPicker(true)}
              >
                {selectedBook.cover_image_url
                  ? <img src={selectedBook.cover_image_url} alt="capa" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <BookOpen size={24} className="text-white opacity-60" />
                    </div>
                }
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Image size={16} className="text-white" />
                </div>
              </div>
              <div className="flex-1 space-y-2 min-w-[200px]">
                <Input
                  value={selectedBook.title}
                  onChange={e => updateBookMutation.mutate({ id: selectedBook.id, data: { title: e.target.value } })}
                  className="font-bold text-base"
                  placeholder="Título do livro"
                />
                <Input
                  value={selectedBook.subtitle || ''}
                  onChange={e => updateBookMutation.mutate({ id: selectedBook.id, data: { subtitle: e.target.value } })}
                  placeholder="Subtítulo (opcional)"
                  className="text-sm"
                />
                <div className="flex items-center gap-2">
                  <Select value={selectedBook.page_format} onValueChange={v => updateBookMutation.mutate({ id: selectedBook.id, data: { page_format: v } })}>
                    <SelectTrigger className="h-8 text-xs w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_FORMATS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={selectedBook.status} onValueChange={v => updateBookMutation.mutate({ id: selectedBook.id, data: { status: v } })}>
                    <SelectTrigger className="h-8 text-xs w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="in_progress">Em andamento</SelectItem>
                      <SelectItem value="finished">Finalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <TabsList className="mb-4">
              <TabsTrigger value="chapters"><AlignLeft size={13} className="mr-1.5" /> Capítulos</TabsTrigger>
              <TabsTrigger value="meta"><FileText size={13} className="mr-1.5" /> Dedicatória & Prefácio</TabsTrigger>
            </TabsList>

            <TabsContent value="chapters" className="space-y-3">
              {chapters.map(ch => (
                <div key={ch.id} className="flex items-center gap-3 p-3 bg-secondary/40 rounded-xl hover:bg-secondary/60 transition-colors group">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">{ch.order}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{ch.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{ch.content ? ch.content.replace(/<[^>]+>/g, '').substring(0, 60) + '...' : 'Vazio'}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      onClick={() => { setEditingChapter(ch); setChapterContent(ch.content || ''); }}
                    >
                      Editar
                    </Button>
                    <button onClick={() => deleteChapterMutation.mutate(ch.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-xs border-dashed"
                onClick={() => {
                  createChapterMutation.mutate({
                    book_id: selectedBook.id,
                    author_email: session?.email,
                    title: `Capítulo ${chapters.length + 1}`,
                    content: '',
                    order: chapters.length + 1,
                  });
                }}
              >
                <Plus size={13} /> Adicionar Capítulo
              </Button>
            </TabsContent>

            <TabsContent value="meta" className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">Dedicatória</label>
                <Textarea
                  rows={4}
                  placeholder="A quem você dedica este livro?"
                  value={selectedBook.dedication || ''}
                  onChange={e => updateBookMutation.mutate({ id: selectedBook.id, data: { dedication: e.target.value } })}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">Prefácio</label>
                <Textarea
                  rows={6}
                  placeholder="Escreva a introdução do seu livro..."
                  value={selectedBook.preface || ''}
                  onChange={e => updateBookMutation.mutate({ id: selectedBook.id, data: { preface: e.target.value } })}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Cover Picker */}
        <Dialog open={showCoverPicker} onOpenChange={setShowCoverPicker}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Image size={16} /> Escolher Capa</DialogTitle></DialogHeader>
            <div className="flex gap-2 mb-4">
              <Input placeholder="Pesquisar tema de capa..." value={coverSearch} onChange={e => setCoverSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchCover()} />
              <Button variant="outline" onClick={handleSearchCover}><Search size={15} /></Button>
            </div>
            <div className="grid grid-cols-4 gap-2 max-h-80 overflow-y-auto">
              {coverResults.map((url, i) => (
                <div
                  key={i}
                  className={`aspect-[2/3] rounded-xl overflow-hidden cursor-pointer border-2 transition-all hover:border-primary ${selectedBook.cover_image_url === url ? 'border-primary' : 'border-transparent'}`}
                  onClick={() => { updateBookMutation.mutate({ id: selectedBook.id, data: { cover_image_url: url } }); setShowCoverPicker(false); toast.success('Capa atualizada!'); }}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── Lista de livros ──
  return (
    <div className="p-4 lg:p-7 max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen size={22} className="text-primary" /> Meu Best Seller
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Escreva e publique o seu próprio livro</p>
        </div>
        <Button onClick={() => setShowNewBook(true)} className="gap-2">
          <Plus size={15} /> Novo Livro
        </Button>
      </div>

      {books.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-16 text-center">
          <BookOpen size={52} className="mx-auto mb-4 text-primary opacity-20" />
          <p className="font-bold text-lg text-foreground">Você ainda não tem nenhum livro</p>
          <p className="text-sm text-muted-foreground mt-1">Comece agora sua jornada de autor!</p>
          <Button className="mt-5 gap-2" onClick={() => setShowNewBook(true)}><Plus size={15} /> Criar Meu Primeiro Livro</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map(book => (
            <button
              key={book.id}
              onClick={() => setSelectedBook(book)}
              className="bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all text-left group"
            >
              <div className="aspect-[3/2] relative overflow-hidden">
                {book.cover_image_url
                  ? <img src={book.cover_image_url} alt="capa" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full bg-gradient-to-br from-primary/80 to-accent/80 flex items-center justify-center">
                      <BookOpen size={32} className="text-white opacity-60" />
                    </div>
                }
              </div>
              <div className="p-4">
                <p className="font-bold text-sm text-foreground truncate">{book.title}</p>
                {book.subtitle && <p className="text-xs text-muted-foreground truncate">{book.subtitle}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`text-[10px] ${STATUS_COLORS[book.status]}`}>{STATUS_LABELS[book.status]}</Badge>
                  <span className="text-[10px] text-muted-foreground">{book.page_format}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* New book dialog */}
      <Dialog open={showNewBook} onOpenChange={setShowNewBook}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><BookOpen size={16} /> Criar Novo Livro</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <Input placeholder="Título do livro *" value={newBookForm.title} onChange={e => setNewBookForm(p => ({ ...p, title: e.target.value }))} />
            <Input placeholder="Subtítulo (opcional)" value={newBookForm.subtitle} onChange={e => setNewBookForm(p => ({ ...p, subtitle: e.target.value }))} />
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">Formato das Páginas</label>
              <Select value={newBookForm.page_format} onValueChange={v => setNewBookForm(p => ({ ...p, page_format: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAGE_FORMATS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              disabled={!newBookForm.title.trim() || createBookMutation.isPending}
              onClick={() => createBookMutation.mutate({ ...newBookForm, author_email: session?.email, author_name: session?.name })}
            >
              Criar Livro
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}