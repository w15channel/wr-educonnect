import React, { useRef, useEffect } from 'react';
import { Smile, Send, Check, Megaphone } from 'lucide-react';
import VoiceDictationButton from '@/components/shared/VoiceDictationButton';

export default function ChatComposer({
  text,
  setText,
  showPicker,
  setShowPicker,
  emojis,
  onSend,
  sending,
  editingMessage,
  editText,
  setEditText,
  onSaveEdit,
  onCancelEdit,
  isAdmin = false,
  onOpenAnnouncement = null,
}) {
  const textareaRef = useRef(null);

  // Auto-ajuste de altura da textarea conforme o texto cresce
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (text.trim() && !sending) {
        onSend(text);
      }
    }
  };

  return (
    <div className="shrink-0 border-t border-border bg-card/60 backdrop-blur-xs">
      {/* Picker de Emojis */}
      {showPicker && (
        <div className="border-b border-border p-2">
          <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">Emojis</p>
          <div className="grid grid-cols-8 gap-1 max-h-36 overflow-y-auto">
            {emojis.map((emoji) => (
              <button
                type="button"
                key={emoji}
                onClick={() => setText((current) => `${current}${emoji}`)}
                className="h-9 rounded-lg text-lg hover:bg-secondary transition-colors"
                aria-label={`Inserir ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modo de Edição de Mensagem Existente */}
      {editingMessage && (
        <form onSubmit={onSaveEdit} className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/30 p-3">
          <label htmlFor="chat-edit" className="w-full text-xs font-medium text-primary">
            Editar mensagem
          </label>
          <input
            id="chat-edit"
            autoFocus
            value={editText}
            onChange={(event) => setEditText(event.target.value)}
            className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button type="button" onClick={onCancelEdit} className="px-2 text-xs text-muted-foreground hover:text-foreground">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!editText.trim()}
            className="flex h-10 items-center gap-1 rounded-lg bg-rose-600 hover:bg-rose-700 px-3 text-xs font-semibold text-white disabled:opacity-50 transition-colors"
          >
            <Check size={14} />
            Salvar
          </button>
        </form>
      )}

      {/* Formulário Principal de Envio */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (text.trim() && !sending) onSend(text);
        }}
        className="p-2 sm:p-3 space-y-2"
      >
        <div className="relative">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Compartilhe uma mensagem com a turma (Shift+Enter para pular linha)..."
            aria-label="Mensagem para a turma"
            className="min-h-[44px] max-h-[120px] w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botão de Emoji */}
          <button
            type="button"
            onClick={() => setShowPicker((value) => !value)}
            aria-label="Escolher emoji"
            aria-expanded={showPicker}
            className={`rounded-lg p-2 transition-colors ${
              showPicker
                ? 'border border-primary/40 bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Smile size={19} />
          </button>

          {/* Ditado por Voz */}
          <VoiceDictationButton value={text} onChange={setText} />

          {/* Botão de Novo Comunicado Oficial (exclusivo para Admin) */}
          {isAdmin && onOpenAnnouncement && (
            <button
              type="button"
              onClick={onOpenAnnouncement}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300/50 bg-rose-500/10 px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors"
              title="Criar comunicado oficial com título e destaque"
            >
              <Megaphone size={14} className="shrink-0" />
              <span className="hidden sm:inline">Comunicado Oficial</span>
              <span className="sm:hidden">Comunicado</span>
            </button>
          )}

          {/* Botão de Envio / Publicar */}
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="ml-auto inline-flex h-9 items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 text-xs font-semibold text-white shadow-xs transition-colors disabled:opacity-50"
          >
            <Send size={14} />
            <span>{sending ? 'Publicando...' : 'Publicar'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}