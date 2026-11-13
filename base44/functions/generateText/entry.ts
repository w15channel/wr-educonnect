import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

const GROK_URL = 'https://api.x.ai/v1/chat/completions';
// Modelo de escrita direta da Grok: o modelo com raciocínio estourava o tempo em textos longos.
const GROK_MODEL = 'grok-4.20-0309-non-reasoning';
// Visitantes do site público usam apenas conversas curtas; alunos e equipe têm o limite completo.
const LIMITS = {
  visitor: { promptChars: 6000, maxTokens: 500 },
  member: { promptChars: 120000, maxTokens: 8000 },
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const prompt = String(body.prompt || '').trim();
    if (!prompt) return Response.json({ error: 'O prompt da IA não pode estar vazio.' }, { status: 400 });

    const user = await base44.auth.me().catch(() => null);
    let member = !!user;
    const codeId = String(body.access_code_id || '').trim();
    if (!member && codeId) {
      const access = await base44.asServiceRole.entities.AccessCode.get(codeId).catch(() => null);
      member = !!access && access.is_active !== false;
    }
    const limits = member ? LIMITS.member : LIMITS.visitor;
    if (prompt.length > limits.promptChars) {
      return Response.json({ error: 'O texto enviado à IA é longo demais.' }, { status: 400 });
    }

    const temperature = Math.min(1, Math.max(0, Number(body.temperature) || 0.35));
    const response = await fetch(GROK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secrets.get('XAI_API_KEY')}` },
      signal: AbortSignal.timeout(150000),
      body: JSON.stringify({
        model: GROK_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: limits.maxTokens,
        stream: false,
      }),
    });
    if (!response.ok) {
      console.error('Grok error', response.status, await response.text());
      return Response.json({ error: `A IA da Grok está indisponível (${response.status}).` }, { status: 502 });
    }
    const payload = await response.json();
    const text = String(payload?.choices?.[0]?.message?.content || '').trim();
    if (!text) return Response.json({ error: 'A IA retornou uma resposta vazia.' }, { status: 502 });
    return Response.json({ text });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}