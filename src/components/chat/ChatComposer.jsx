import React from 'react';
import { Smile, Send, Check } from 'lucide-react';
import VoiceDictationButton from '@/components/shared/VoiceDictationButton';

export default function ChatComposer({ text, setText, showPicker, setShowPicker, emojis, onSend, sending, editingMessage, editText, setEditText, onSaveEdit, onCancelEdit }) {
  return <div className="shrink-0 border-t border-rose-100 bg-rose-50/20">
    {showPicker && <div className="border-b border-rose-100 p-2"><p className="px-2 pb-1 text-xs font-medium text-rose-600/70">Emojis</p><div className="grid grid-cols-8 gap-1">{emojis.map((emoji) => <button type="button" key={emoji} onClick={() => setText((current) => `${current}${emoji}`)} className="h-9 rounded-lg text-lg hover:bg-rose-100" aria-label={`Inserir ${emoji}`}>{emoji}</button>)}</div></div>}
    {editingMessage && <form onSubmit={onSaveEdit} className="flex flex-wrap items-center gap-2 border-b border-rose-100 bg-rose-50/40 p-3">
      <label htmlFor="chat-edit" className="w-full text-xs font-medium text-rose-600/70">Editar mensagem</label>
      <input id="chat-edit" autoFocus value={editText} onChange={(event) => setEditText(event.target.value)} className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
      <button type="button" onClick={onCancelEdit} className="px-2 text-xs text-muted-foreground">Cancelar</button>
      <button type="submit" disabled={!editText.trim()} className="flex h-10 items-center gap-1 rounded-lg bg-rose-500 px-3 text-xs font-semibold text-white disabled:opacity-50"><Check size={14}/>Salvar</button>
    </form>}
    <form onSubmit={(event) => { event.preventDefault(); if (text.trim() && !sending) onSend(text); }} className="p-2 sm:p-3">
      <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Compartilhe uma mensagem de superação..." aria-label="Mensagem para a turma" className="h-11 w-full min-w-0 rounded-xl border border-rose-200 bg-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
      <div className="mt-2 flex items-center gap-2">
        <button type="button" onClick={() => setShowPicker((value) => !value)} aria-label="Escolher emoji" aria-expanded={showPicker} className={`rounded-lg p-2 transition-colors ${showPicker ? 'border border-rose-300 bg-rose-100 text-rose-500' : 'text-muted-foreground hover:bg-rose-100 hover:text-rose-500'}`}><Smile size={19}/></button>
        <VoiceDictationButton value={text} onChange={setText}/>
        <button type="submit" disabled={!text.trim() || sending} className="ml-auto inline-flex h-10 items-center gap-2 rounded-xl bg-rose-500 px-4 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-50"><Send size={15}/>{sending ? 'Publicando...' : 'Publicar'}</button>
      </div>
    </form>
  </div>;
}