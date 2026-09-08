import { base44 } from '@/api/base44Client';
import { normalizeStudentEmail } from '@/lib/therapistPairings';

/**
 * Mural individual do aluno (StudentWallPost).
 *
 * Convenção do projeto: toda vez que uma publicação for realizada em nome de
 * um aluno (ex.: pareamento do "Terapeuta da Semana", um aviso direcionado,
 * uma tarefa avaliada, etc.), deve ser criado um registro no mural individual
 * dele através de `publishToStudentWall`, mencionando o aluno na mensagem.
 * Isso garante que o aluno tenha, em um único lugar, o histórico de tudo que
 * foi publicado em seu nome — mesmo que a funcionalidade de origem não tenha
 * uma tela própria de histórico.
 *
 * Sempre que uma nova funcionalidade publicar algo "em nome do aluno", basta
 * chamar esta função (ou `publishToStudentWallBatch` para vários alunos de
 * uma vez, como ocorre no pareamento de duplas) informando um `source_type`
 * e `source_id` estáveis, evitando duplicidade em novas publicações.
 */

const buildPayload = ({
  studentEmail,
  message,
  title,
  sourceType = 'other',
  sourceId,
  relatedEmail,
  relatedName,
  publishedBy,
}) => ({
  student_email: normalizeStudentEmail(studentEmail),
  title: title || '',
  message,
  source_type: sourceType,
  source_id: sourceId || '',
  related_email: relatedEmail || '',
  related_name: relatedName || '',
  published_by: publishedBy || 'system',
  published_at: new Date().toISOString(),
  is_read: false,
});

/**
 * Publica uma mensagem no mural individual de um aluno.
 * Evita duplicidade quando `sourceType` + `sourceId` já existem para o aluno.
 */
export async function publishToStudentWall(params) {
  const { studentEmail, message, sourceType, sourceId } = params;
  if (!studentEmail || !message) return null;
  const normalizedStudentEmail = normalizeStudentEmail(studentEmail);

  if (sourceType && sourceId) {
    const existing = await base44.entities.StudentWallPost.filter(
      { student_email: normalizedStudentEmail, source_type: sourceType, source_id: sourceId },
      '-published_at',
      1
    );
    if (existing?.[0]) {
      const next = buildPayload(params);
      const existingPost = existing[0];
      const hasChanges =
        (existingPost.title || '') !== next.title ||
        (existingPost.message || '') !== next.message ||
        (existingPost.related_email || '') !== next.related_email ||
        (existingPost.related_name || '') !== next.related_name ||
        (existingPost.published_by || '') !== next.published_by;
      if (!hasChanges) return existingPost;
      return base44.entities.StudentWallPost.update(existing[0].id, {
        title: next.title,
        message: next.message,
        related_email: next.related_email,
        related_name: next.related_name,
        published_by: next.published_by,
      });
    }
  }

  return base44.entities.StudentWallPost.create(buildPayload(params));
}

/**
 * Publica a mesma origem (source_type/source_id) para vários alunos, cada um
 * com sua própria mensagem — útil quando uma publicação envolve mais de uma
 * pessoa (ex.: os dois lados de uma dupla).
 *
 * Processado sequencialmente (com uma pequena pausa entre cada publicação) em
 * vez de Promise.all: disparar todas as chamadas de uma vez excede o limite
 * de requisições da plataforma quando há muitos alunos (ex.: publicar todas
 * as duplas do Terapeuta da Semana de uma rodada).
 */
export async function publishToStudentWallBatch(entries = []) {
  const results = [];
  for (const entry of entries) {
    results.push(await publishToStudentWall(entry));
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return results;
}

export default publishToStudentWall;