// Avisos com destinatário definido (ex.: certificado de monitor) são pessoais:
// só o próprio aluno — e o administrador — podem vê-los.
export function isAnnouncementVisible(announcement, viewerEmail, isTeacher = false) {
  const recipient = announcement?.recipient_email;
  if (!recipient) return true;
  if (isTeacher) return true;
  return String(recipient).trim().toLowerCase() === String(viewerEmail || '').trim().toLowerCase();
}