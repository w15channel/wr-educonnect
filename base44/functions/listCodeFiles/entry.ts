import { requireAdmin, normalizeCodePath, callCodeApi, errorResponse } from '../../shared/codeFileTools.ts';

export default async function(req) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const path = normalizeCodePath(body?.path || 'src', { directory: true });
    const recursive = body?.recursive !== false;
    const maxDepth = Math.min(10, Math.max(1, Number(body?.max_depth) || 4));
    const result = await callCodeApi('list_directory', { path, recursive, max_depth: maxDepth, include_hidden: false });
    const entries = (result.entries || []).filter((entry) => !entry.path?.includes('/.'));
    return Response.json({ success: true, path, entries, truncated: Boolean(result.truncated) });
  } catch (error) {
    return errorResponse(error);
  }
}