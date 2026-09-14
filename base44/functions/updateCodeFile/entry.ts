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

    const currentResult = await callCodeApi('read_file', { paths: [path] });
    const current = currentResult.files?.[0];
    if (!current || current.error) return Response.json({ success: false, path, error: 'File not found; this tool only edits existing files' }, { status: 404 });
    if (current.content === body.content) {
      return Response.json({ success: true, path, unchanged: true, message: 'File already has this content' });
    }

    const result = await callCodeApi('write_file', { path, content: body.content, overwrite: true });
    const githubSync = await syncCodeToGitHub();
    return Response.json({ edited_by: user.email, ...result, success: true, ...githubSync });
  } catch (error) {
    return errorResponse(error);
  }
}