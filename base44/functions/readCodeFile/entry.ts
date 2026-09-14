import { requireAdmin, normalizeCodePath, callCodeApi, errorResponse } from '../../shared/codeFileTools.ts';

export default async function(req) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const path = normalizeCodePath(body?.path);
    const offset = Math.max(1, Number(body?.offset) || 1);
    const limit = Math.min(2000, Math.max(1, Number(body?.limit) || 2000));
    const result = await callCodeApi('read_file', { paths: [path], offset, limit });
    const file = result.files?.[0];
    if (!file || file.error) return Response.json({ success: false, path, error: file?.error?.message || 'File not found' }, { status: 404 });
    return Response.json({ success: true, ...file });
  } catch (error) {
    return errorResponse(error);
  }
}