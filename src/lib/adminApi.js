/**
 * adminApi — wrapper para operações CRUD que requerem role admin.
 * Usa a função backend `adminSave` com asServiceRole para contornar o RLS
 * que exige autenticação nativa do Base44 (incompatível com o auth customizado do app).
 */
import { base44 } from '@/api/base44Client';
import { getSession } from '@/lib/customAuth';

function getAdminEmail() {
  const session = getSession();
  if (session?.role !== 'admin' || !session?.email) {
    throw new Error('Usuário não é admin ou não está autenticado.');
  }
  return session.email;
}

async function adminSave(params) {
  const admin_email = getAdminEmail();
  let res;
  try {
    res = await base44.functions.invoke('adminSave', { ...params, admin_email });
  } catch (error) {
    throw new Error(error.response?.data?.error || error.message || 'Erro desconhecido no adminSave');
  }
  if (!res.data?.success) {
    throw new Error(res.data?.error || 'Erro desconhecido no adminSave');
  }
  return res.data;
}

export const adminApi = {
  create: (entity, data) => adminSave({ action: 'create', entity, data }),
  update: (entity, id, data) => adminSave({ action: 'update', entity, id, data }),
  delete: (entity, id) => adminSave({ action: 'delete', entity, id }),
  list: (entity, { filter, sort_by, limit } = {}) =>
    adminSave({ action: 'list', entity, filter, sort_by, limit }).then(r => r.records || []),
  upsertBookChapter: (data, id) =>
    adminSave({ action: 'upsertBookChapter', entity: 'BookChapter', data, id }).then(r => r.record),
  syncBookChapters: (chapters, { createOnly = true } = {}) =>
    adminSave({ action: 'syncBookChapters', entity: 'BookChapter', data: { chapters, createOnly } }).then(r => r.records || []),
};
