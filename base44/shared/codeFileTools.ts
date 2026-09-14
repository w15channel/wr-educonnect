import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

const protectedPaths = [
  'base44/functions/readCodeFile/',
  'base44/functions/updateCodeFile/',
  'base44/functions/listCodeFiles/',
  'base44/shared/codeFileTools.ts',
];

export async function requireAdmin(req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) throw Object.assign(new Error('Unauthorized'), { status: 401 });
  if (user.role !== 'admin') throw Object.assign(new Error('Forbidden: admin access required'), { status: 403 });
  return user;
}

export function normalizeCodePath(rawPath, options = {}) {
  if (typeof rawPath !== 'string' || !rawPath.trim()) throw Object.assign(new Error('path is required'), { status: 400 });
  let path = rawPath.trim().replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/+$/, '');
  if (path.startsWith('pages/')) path = `src/${path}`;
  if (path.startsWith('components/')) path = `src/${path}`;
  if (path.startsWith('functions/')) path = `base44/${path}`;
  if (path.includes('\0') || path.split('/').includes('..')) throw Object.assign(new Error('Invalid path'), { status: 400 });

  const listRoot = options.directory && ['src', 'base44/functions'].includes(path);
  const inAllowedRoot = path.startsWith('src/') || path.startsWith('base44/functions/');
  if (!listRoot && !inAllowedRoot) throw Object.assign(new Error('Only src and base44/functions code paths are allowed'), { status: 403 });
  if (!options.directory && protectedPaths.some((item) => path === item || path.startsWith(item))) {
    throw Object.assign(new Error('Code-management tools cannot modify or expose their own credentials layer'), { status: 403 });
  }
  return path;
}

export async function callCodeApi(endpoint, payload) {
  const appId = secrets.get('BASE44_APP_ID');
  const apiKey = secrets.get('BASE44_PERSONAL_API_KEY');
  if (!appId || !apiKey) throw Object.assign(new Error('Code-management connection is not configured'), { status: 503 });
  const response = await fetch(`https://app.base44.com/api/apps/${encodeURIComponent(appId)}/sandbox-bridge/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', api_key: apiKey },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
  if (!response.ok) {
    const message = data?.detail || data?.message || `Base44 code API failed (${response.status})`;
    throw Object.assign(new Error(typeof message === 'string' ? message : JSON.stringify(message)), { status: response.status });
  }
  return data;
}

export async function syncCodeToGitHub() {
  const appId = secrets.get('BASE44_APP_ID');
  const apiKey = secrets.get('BASE44_PERSONAL_API_KEY');
  if (!appId || !apiKey) {
    return { synced_to_github: false, github_error: 'GitHub sync connection is not configured' };
  }

  try {
    const response = await fetch(`https://app.base44.com/api/apps/${encodeURIComponent(appId)}/github/sync/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', api_key: apiKey },
    });
    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
    if (!response.ok || data?.success !== true) {
      const error = data?.error || data?.detail || data?.message || `GitHub sync failed (${response.status})`;
      return { synced_to_github: false, github_error: typeof error === 'string' ? error : JSON.stringify(error) };
    }
    return { synced_to_github: true };
  } catch (error) {
    return { synced_to_github: false, github_error: error?.message || 'GitHub sync failed' };
  }
}

export function errorResponse(error) {
  const status = Number(error?.status) || 500;
  return Response.json({ success: false, error: error?.message || 'Unexpected error' }, { status });
}