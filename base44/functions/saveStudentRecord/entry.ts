import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

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
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9-]/g, '');
}

function certificateCodeVariants(value) {
  const normalized = normalizeVerificationCode(value);
  const compact = normalized.replace(/-/g, '');
  const wrParts = normalized.match(/^WR-?(\d{2})-?(\d+)$/);
  return Array.from(new Set([
    normalized,
    compact,
    normalized.replace(/^WR(\d{2})(\d+)$/, 'WR-$1-$2'),
    wrParts ? `WR-${wrParts[1]}-${wrParts[2]}` : '',
    wrParts ? `WR${wrParts[1]}${wrParts[2]}` : '',
    wrParts ? wrParts[2] : '',
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
        (recordCompactCode && compactCodes.some((code) => recordCompactCode.endsWith(code) || code.endsWith(recordCompactCode))) ||
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

function getDMSessionId(emailA, emailB) {
  const sorted = [emailA, emailB].sort();
  return `dm_${sorted[0]}_${sorted[1]}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const action = payload.action;

    if (action === 'migrateAnnouncementsToDM') {
      const user = await base44.auth.me().catch(() => null);
      let isAdmin = user?.role === 'admin';
      if (!isAdmin && payload.admin_email) {
        const normAdmin = String(payload.admin_email).trim().toLowerCase();
        const credentials = await base44.asServiceRole.entities.AdminCredential.list('-updated_date', 100);
        isAdmin = credentials.some((c) => String(c.email || '').trim().toLowerCase() === normAdmin);
        if (!isAdmin) {
          const codes = await base44.asServiceRole.entities.AccessCode.filter(
            { student_email: normAdmin }, '-created_date', 10
          );
          isAdmin = codes.some((c) =>
            c.is_active !== false &&
            ['admin', 'management'].includes(c.profile_category)
          );
        }
      }
      if (!isAdmin) {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }

      const adminEmail = payload.admin_email || user?.email || '';
      const lunaEmail = 'luna@wr-edu.internal';
      const lunaName = 'Luna · Assistente digital';
      const distributionId = `luna-migration-${Date.now()}`;
      const searchText = payload.search_text || 'Eu sou a Luna';

      const announcements = await base44.asServiceRole.entities.Announcement.filter(
        { content: { $regex: searchText } },
        '-created_date',
        200
      );

      let migrated = 0;
      let failed = 0;
      const errors = [];

      for (const ann of announcements) {
        try {
          const studentEmail = String(ann.recipient_email || '').trim();
          if (!studentEmail) {
            errors.push({ id: ann.id, error: 'No recipient_email' });
            failed++;
            continue;
          }

          const sessionId = getDMSessionId(lunaEmail, studentEmail);
          const fullContent = ann.title
            ? `${ann.title}\n\n${ann.content}`
            : ann.content;

          await base44.asServiceRole.entities.ChatMessage.create({
            session_id: sessionId,
            author_name: lunaName,
            author_email: lunaEmail,
            content: fullContent,
            is_hand_raised: false,
            is_luna_distribution: true,
            distributed_by: adminEmail,
            distribution_id: distributionId,
          });

          await base44.asServiceRole.entities.Notification.create({
            recipient_email: studentEmail,
            sender_email: lunaEmail,
            sender_name: lunaName,
            message: `Você recebeu uma mensagem particular da coordenação: "${ann.title || 'Recado importante'}"`,
            type: 'wall_reply',
          });

          await base44.asServiceRole.entities.Announcement.delete(ann.id);
          migrated++;
        } catch (err) {
          errors.push({ id: ann.id, error: err.message });
          failed++;
        }
      }

      return Response.json({
        success: true,
        migrated,
        failed,
        total: announcements.length,
        errors: errors.length ? errors : undefined,
      });
    }

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

    if (action === 'listChatMessages') {
      const sessionId = payload.session_id;
      if (!sessionId) return Response.json({ error: 'session_id obrigatório.' }, { status: 400 });
      const records = await base44.asServiceRole.entities.ChatMessage.filter({ session_id: sessionId }, 'created_date', 300);
      return Response.json({ success: true, records });
    }

    if (action === 'setPresence') {
      const code = String(payload.access_code || '').trim();
      const codeId = String(payload.access_code_id || '').trim();
      const claimedEmail = norm(payload.student_email);
      let access = codeId
        ? await base44.asServiceRole.entities.AccessCode.get(codeId).catch(() => null)
        : null;
      if (!access && code) {
        const matches = await base44.asServiceRole.entities.AccessCode.filter({ code }, '-created_date', 5);
        access = matches.find((item) => item.code === code) || null;
      }
      if (!access || access.is_active === false || (code && access.code !== code) || (claimedEmail && norm(access.student_email) !== claimedEmail)) {
        return Response.json({ error: 'Acesso não autorizado.' }, { status: 401 });
      }
      const record = await base44.asServiceRole.entities.AccessCode.update(access.id, {
        is_online: payload.is_online === true,
        last_seen_at: new Date().toISOString(),
      });
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