import { requireAdmin, normalizeCodePath, callCodeApi, syncCodeToGitHub, errorResponse } from '../../shared/codeFileTools.ts';

export default async function(req) {
  try {
    const user = await requireAdmin(req);
    const body = await req.json();
    const path = normalizeCodePath(body?.path);
    if (typeof body?.content !== 'string' || !body.content.length) {
      return Response.json({ success: false, error: 'content must be a non-empty string' }, { status: 400 });
    }
    if (body.content.length > 6000000) {
      return Response.json({ success: false, error: 'content exceeds the 6 MB limit' }, { status: 413 });
    }

    // Arquivo inexistente é criado; uma falha real de conexão aparece na gravação logo abaixo.
    const currentResult = await callCodeApi('read_file', { paths: [path] }).catch(() => ({}));
    const current = currentResult.files?.[0];
    const created = !current || !!current.error;
    if (!created && current.content === body.content) {
      return Response.json({ success: true, path, unchanged: true, message: 'File already has this content' });
    }

    const result = await callCodeApi('write_file', { path, content: body.content, overwrite: true });
    const githubSync = await syncCodeToGitHub();
    return Response.json({ edited_by: user.email, ...result, created, success: true, ...githubSync });
  } catch (error) {
    return errorResponse(error);
  }
}