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
  /**
   * Persiste uma aula da apostila usando apenas ações CRUD públicas do adminSave.
   *
   * Algumas instalações do backend ainda aceitam somente create/update/delete/list;
   * por isso o upsert é feito no cliente: primeiro localizamos a aula pelo trio
   * book_id + chapter_id + lesson_id e depois chamamos update ou create.
   */
  upsertBookChapter: async (data, id) => {
    const recordId = id || (await adminApi.list('BookChapter', {
      filter: {
        book_id: data.book_id,
        chapter_id: data.chapter_id,
        lesson_id: data.lesson_id,
      },
      sort_by: '-updated_date',
      limit: 1,
    }))[0]?.id;

    const response = recordId
      ? await adminApi.update('BookChapter', recordId, data)
      : await adminApi.create('BookChapter', data);

    return response.record;
  },
  syncBookChapters: async (chapters, { createOnly = true } = {}) => {
    const records = [];

    for (const chapter of chapters) {
      const existing = (await adminApi.list('BookChapter', {
        filter: {
          book_id: chapter.book_id,
          chapter_id: chapter.chapter_id,
          lesson_id: chapter.lesson_id,
        },
        sort_by: '-updated_date',
        limit: 1,
      }))[0];

      if (existing?.id) {
        if (createOnly) records.push(existing);
        else records.push(await adminApi.upsertBookChapter(chapter, existing.id));
      } else {
        records.push(await adminApi.upsertBookChapter(chapter));
      }
    }

    return records;
  },
};
