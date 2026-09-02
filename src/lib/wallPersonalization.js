const YOU_PATTERN = /voc(?:e|ê)/gi;

/**
 * Adapta avisos pessoais quando eles aparecem no mural público da turma.
 * O destinatário continua vendo "Você"; os colegas veem o nome da pessoa.
 */
export function personalizeWallNotice(notice, viewerEmail, resolveStudentName) {
  const recipientEmail = notice.recipient_email || notice.student_email;
  if (!recipientEmail || recipientEmail === viewerEmail) return notice;

  const recipientName = resolveStudentName(recipientEmail);
  return {
    ...notice,
    title: (notice.title || 'Recado importante').replace(YOU_PATTERN, recipientName),
    content: (notice.content || '').replace(YOU_PATTERN, recipientName),
  };
}
