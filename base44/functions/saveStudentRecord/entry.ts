import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ALLOWED_ENTITIES = new Set(['ForumPost', 'ForumReply', 'ChatMessage', 'TaskSubmission', 'LiveAttendance']);
const CERTIFICATE_LIST_LIMIT = 5000;

function norm(value) {
  return String(value || '').trim().toLowerCase();
}

function uniqueNormList(values = []) {
  return Array.from(new Set((values || []).map(norm).filter(Boolean)));
}


function normalizeVerificationCode(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[–—−]/g, '-')
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9-]/g, '');
}

function certificateCodeVariants(value) {
  const normalized = normalizeVerificationCode(value);
  const compact = normalized.replace(/-/g, '');
  return Array.from(new Set([
    normalized,
    compact,
    normalized.replace(/^WR(\d{2})(\d+)$/, 'WR-$1-$2'),
  ].filter(Boolean)));
}

async function findCertificateRecords(base44, payload = {}) {
  const codes = certificateCodeVariants(payload.verification_code || payload.code);
  const email = norm(payload.student_email || payload.email);
  const accessCode = norm(payload.student_access_code || payload.access_code);

  for (const code of codes) {
    const records = await base44.asServiceRole.entities.CertificateRecord.filter({ verification_code: code }, '-created_date', 5);
    if (records.length) return records;
  }

  if (email) {
    const records = await base44.asServiceRole.entities.CertificateRecord.filter({ student_email: email }, '-created_date', 5);
    if (records.length) return records;
  }

  if (accessCode) {
    const records = await base44.asServiceRole.entities.CertificateRecord.filter({ student_access_code: accessCode }, '-created_date', 5);
    if (records.length) return records;
  }

  if (codes.length || email || accessCode) {
    const records = await base44.asServiceRole.entities.CertificateRecord.list('-created_date', CERTIFICATE_LIST_LIMIT);
    const compactCodes = codes.map((code) => code.replace(/-/g, ''));
    return records.filter((record) => {
      const recordCode = normalizeVerificationCode(record.verification_code);
      const recordCompactCode = recordCode.replace(/-/g, '');
      const recordEmail = norm(record.student_email);
      const recordAccessCode = norm(record.student_access_code);
      return (
        codes.includes(recordCode) ||
        compactCodes.includes(recordCompactCode) ||
        (email && recordEmail === email) ||
        (accessCode && recordAccessCode === accessCode)
      );
    }).slice(0, 5);
  }

  return [];
}

function cleanObject(obj = {}) {
  const out = {};
  for (const [key, value] of Object.entries(obj || {})) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const action = payload.action;

    if (action === 'lessonProgressUpsert') {
      const lessonId = payload.lesson_id;
      const studentEmail = norm(payload.student_email);
      const identifiers = uniqueNormList([studentEmail, ...(payload.student_identifiers || [])]);
      if (!lessonId || identifiers.length === 0) {
        return Response.json({ error: 'Dados do aluno ou da aula ausentes.' }, { status: 400 });
      }

      const records = await base44.asServiceRole.entities.LessonProgress.list('-updated_date', 5000);
      const existing = records.find((item) => item.lesson_id === lessonId && identifiers.includes(norm(item.student_email)));
      const canonicalStudentEmail = studentEmail || identifiers[0];
      const data = cleanObject({ lesson_id: lessonId, student_email: canonicalStudentEmail, ...payload.patch });

      const record = existing
        ? await base44.asServiceRole.entities.LessonProgress.update(existing.id, data)
        : await base44.asServiceRole.entities.LessonProgress.create(data);

      return Response.json({ success: true, record });
    }

    if (action === 'certificateSearch') {
      const records = await findCertificateRecords(base44, payload);
      return Response.json({ success: true, records });
    }

    if (action === 'certificateUpsert') {
      const data = cleanObject(payload.data || {});
      const verificationCode = normalizeVerificationCode(data.verification_code);
      const studentName = String(data.student_name || '').trim();
      if (!verificationCode || !studentName || !data.course_name) {
        return Response.json({ error: 'Código, aluno e curso são obrigatórios para salvar o certificado.' }, { status: 400 });
      }

      data.verification_code = verificationCode;
      data.student_email = norm(data.student_email);
      data.student_access_code = String(data.student_access_code || '').trim();

      const records = payload.id
        ? []
        : await findCertificateRecords(base44, { verification_code: verificationCode });
      const recordId = payload.id || records[0]?.id;
      const record = recordId
        ? await base44.asServiceRole.entities.CertificateRecord.update(recordId, data)
        : await base44.asServiceRole.entities.CertificateRecord.create(data);

      return Response.json({ success: true, record });
    }

    if (action === 'create') {
      const entity = payload.entity;
      if (!ALLOWED_ENTITIES.has(entity)) {
        return Response.json({ error: 'Área não permitida para salvamento.' }, { status: 400 });
      }
      const data = cleanObject(payload.data || {});

      if (entity === 'TaskSubmission') {
        const taskId = data.task_id;
        const identifiers = uniqueNormList([data.student_email, ...(payload.student_identifiers || [])]);

        if (taskId && identifiers.length > 0) {
          const records = await base44.asServiceRole.entities.TaskSubmission.list('-updated_date', 5000);
          const existing = records.find((item) => item.task_id === taskId && identifiers.includes(norm(item.student_email)));
          if (existing) {
            const merged = cleanObject({ ...existing, ...data, student_email: norm(data.student_email) || norm(existing.student_email) });
            const record = await base44.asServiceRole.entities.TaskSubmission.update(existing.id, merged);
            return Response.json({ success: true, record, restored: true });
          }
        }
      }

      const record = await base44.asServiceRole.entities[entity].create(data);
      return Response.json({ success: true, record });
    }

    if (action === 'updateForumReplyCount') {
      const postId = payload.post_id;
      const replyCount = Number(payload.reply_count || 0);
      if (!postId) return Response.json({ error: 'Publicação não informada.' }, { status: 400 });
      const record = await base44.asServiceRole.entities.ForumPost.update(postId, { reply_count: replyCount });
      return Response.json({ success: true, record });
    }

    return Response.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});