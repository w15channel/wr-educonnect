/**
 * PostCard — shared between Forum and SalaDebates
 * ──────────────────────────────────────────────
 * Shows author, topic, date, participation badge,
 * expand/collapse with replies panel.
 */
import React, { useState } from 'react';
import { MessageSquare, ChevronDown, ChevronUp, Trash2, Pencil, Star, BookOpen, Check, X, Send, SmilePlus } from 'lucide-react';
import { ClickableStudent } from '@/components/shared/StudentProfileCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import VoiceDictationButton from '@/components/shared/VoiceDictationButton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function Avatar({ photoUrl, name, color, avatarEmoji = '', size = 9 }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
  const cls = `w-${size} h-${size} rounded-full shrink-0`;
  if (photoUrl) return <img src={photoUrl} alt={name} className={`${cls} object-cover`} />;
  return (
    <div className={`${cls} flex items-center justify-center font-bold text-white`} style={{ fontSize: size < 9 ? 10 : 13, backgroundColor: color || '#7c3aed' }}>
      {avatarEmoji || initials}
    </div>
  );
}

export default function PostCard({
  post,
  replies,
  isTeacher,
  myEmail,
  myName,
  myAvatarColor,
  myPhotoUrl,
  getAvatar,            // (email, role) => { photoUrl, avatarColor, avatarEmoji }
  replyText,
  setReplyText,
  isExpanded,
  onToggleExpand,
  onSubmitReply,
  onDeletePost,
  onEditPost,
  onDeleteReply,
  onEditReply,
  editingPost,
  setEditingPost,
  editingReply,
  setEditingReply,
  onUpdatePost,
  onUpdateReply,
  replyPlaceholder = 'Escreva sua resposta...',
}) {
  const av = getAvatar(post.author_email, post.author_role);
  const myPostParticipated = post.author_email === myEmail;

  // Check if current user has replied to this post
  const myReplied = replies?.some(r => r.author_email === myEmail) || myPostParticipated;

  return (
    <div className={`bg-card rounded-2xl border shadow-sm overflow-hidden transition-all ${myReplied ? 'border-emerald-400/40' : 'border-border'}`}>
      {/* Post header */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Avatar photoUrl={av.photoUrl} name={post.author_name} color={av.avatarColor} avatarEmoji={av.avatarEmoji} size={9} />

          <div className="flex-1 min-w-0">
            {/* Meta row */}
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <ClickableStudent email={post.author_email} className="font-bold text-sm text-foreground">{post.author_name}</ClickableStudent>
              {post.author_role === 'teacher' && (
                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] py-0 px-1.5">Professor</Badge>
              )}
              {post.topic && (
                <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                  <BookOpen size={9} /> {post.topic}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground ml-auto">
                {post.created_date ? format(new Date(post.created_date), "dd/MM 'às' HH:mm", { locale: ptBR }) : ''}
              </span>
            </div>

            {/* Content / edit */}
            {editingPost?.id === post.id ? (
              <div className="flex gap-2 mt-1">
                <Textarea value={editingPost.content} onChange={e => setEditingPost({ ...editingPost, content: e.target.value })} className="resize-none text-sm flex-1" rows={2} />
                <div className="flex flex-col gap-1">
                  <button onClick={() => onUpdatePost(post.id, editingPost.content)} className="text-green-600 hover:text-green-700 p-1"><Check size={14} /></button>
                  <button onClick={() => setEditingPost(null)} className="text-muted-foreground hover:text-foreground p-1"><X size={14} /></button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground/80 leading-relaxed">{post.content}</p>
            )}
          </div>

          {(isTeacher || post.author_email === myEmail) && (
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setEditingPost({ id: post.id, content: post.content })} className="text-muted-foreground hover:text-primary min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg transition-colors">
                <Pencil size={12} />
              </button>
              <button onClick={() => onDeletePost(post.id)} className="text-muted-foreground hover:text-destructive min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer bar: participation badge + expand */}
      <div className="border-t border-border px-4 sm:px-5 py-2.5 flex items-center gap-3 bg-secondary/20 flex-wrap">
        <button
          onClick={onToggleExpand}
          className="text-xs font-semibold text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors"
        >
          <MessageSquare size={13} />
          {post.reply_count || 0} {post.reply_count === 1 ? 'Resposta' : 'Respostas'}
          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {/* Participation badge */}
        {!isTeacher && (
          myReplied ? (
            <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              😄 Parabéns, você participou!
            </span>
          ) : (
            <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-bold text-red-500 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
              😢 Você ainda não participou
            </span>
          )
        )}
      </div>

      {/* Expanded replies */}
      {isExpanded && (
        <div className="border-t border-border bg-secondary/10 p-4 space-y-3">
          {(replies || []).map(reply => {
            const rav = getAvatar(reply.author_email, reply.author_role);
            return (
              <div key={reply.id} className="flex gap-3 pl-2">
                <Avatar photoUrl={rav.photoUrl} name={reply.author_name} color={rav.avatarColor} avatarEmoji={rav.avatarEmoji} size={7} />
                <div className="flex-1 bg-card rounded-xl p-3 border border-border">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <ClickableStudent email={reply.author_email} className="font-bold text-xs text-foreground">{reply.author_name}</ClickableStudent>
                    {reply.author_role === 'teacher' && <Badge className="bg-primary/10 text-primary text-[9px] py-0 px-1">Prof.</Badge>}
                    <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
                      {reply.created_date ? format(new Date(reply.created_date), "dd/MM 'às' HH:mm", { locale: ptBR }) : ''}
                      {(isTeacher || reply.author_email === myEmail) && (
                        <>
                          <button onClick={() => setEditingReply({ id: reply.id, content: reply.content })} className="text-muted-foreground hover:text-primary ml-1"><Pencil size={10} /></button>
                          <button onClick={() => onDeleteReply(reply.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={10} /></button>
                        </>
                      )}
                    </span>
                  </div>
                  {editingReply?.id === reply.id ? (
                    <div className="flex gap-2 mt-1">
                      <Input value={editingReply.content} onChange={e => setEditingReply({ ...editingReply, content: e.target.value })} className="flex-1 h-8 text-sm" />
                      <button onClick={() => onUpdateReply(reply.id, editingReply.content)} className="text-green-600 hover:text-green-700"><Check size={14} /></button>
                      <button onClick={() => setEditingReply(null)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground/80">{reply.content}</p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Reply form */}
          <form
            onSubmit={e => { e.preventDefault(); if (replyText.trim()) onSubmitReply(post.id, replyText); }}
            className="flex gap-2 pt-1"
          >
            <Input
              placeholder={replyPlaceholder}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              className="flex-1 h-9 text-sm"
            />
            <VoiceDictationButton value={replyText} onChange={setReplyText} />
            <Button type="submit" size="sm" className="h-9 w-9 p-0 shrink-0" disabled={!replyText.trim()}>
              <Send size={13} />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}