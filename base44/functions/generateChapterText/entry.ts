import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const MODEL_ID = 'gpt_6_luna';
const MAX_PROMPT_CHARS = 120000;
const MAX_SCHEMA_CHARS = 30000;

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

async function isAuthorizedChapterEditor(base44, adminEmail, user) {
  if (user?.role === 'admin') return true;
  if (!adminEmail) return false;

  const credentials = await base44.asServiceRole.entities.AdminCredential
    .list('-updated_date', 100)
    .catch(() => []);
  if (credentials.some((item) => normalizeEmail(item.email) === adminEmail)) return true;

  const accessCodes = await base44.asServiceRole.entities.AccessCode
    .filter({ student_email: adminEmail }, '-created_date', 10)
    .catch(() => []);
  return accessCodes.some((item) =>
    item.is_active !== false && ['admin', 'management'].includes(item.profile_category)
  );
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const prompt = String(body.prompt || '').trim();
    const adminEmail = normalizeEmail(body.admin_email);
    const user = await base44.auth.me().catch(() => null);

    if (!await isAuthorizedChapterEditor(base44, adminEmail, user)) {
      return Response.json({ error: 'Acesso restrito à equipe autorizada.' }, { status: 403 });
    }
    if (!prompt) return Response.json({ error: 'O prompt da IA não pode estar vazio.' }, { status: 400 });
    if (prompt.length > MAX_PROMPT_CHARS) {
      return Response.json({ error: 'O texto enviado ao gerador excede o limite permitido.' }, { status: 400 });
    }

    const schema = body.response_json_schema;
    if (schema !== undefined && (!schema || typeof schema !== 'object' || Array.isArray(schema))) {
      return Response.json({ error: 'O formato de resposta informado é inválido.' }, { status: 400 });
    }
    if (schema && JSON.stringify(schema).length > MAX_SCHEMA_CHARS) {
      return Response.json({ error: 'O formato de resposta excede o limite permitido.' }, { status: 400 });
    }

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: MODEL_ID,
      ...(schema ? { response_json_schema: schema } : {}),
    });

    return Response.json({ result });
  } catch (error) {
    console.error('generateChapterText failed:', error?.message || error);
    return Response.json({ error: error?.message || 'Falha ao gerar conteúdo com GPT Luna 6.' }, { status: 502 });
  }
}
