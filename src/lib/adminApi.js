/**
 * adminApi — wrapper para operações CRUD que requerem autenticação.
 * Usa a função backend `adminSave` com asServiceRole para contornar o RLS
 * que exige autenticação nativa do Base44 (incompatível com o auth customizado do app).
 *
 * Níveis de permissão:
 *   • admin   — controle irrestrito (criar, atualizar, excluir, listar)
 *   • teacher — leitura + criar/atualizar conteúdo (sem excluir)
 *   • student — sem acesso (usa entidades públicas do SDK)
 */
import { base44 } from '@/api/base44Client';
import { getSession } from '@/lib/customAuth';

/**
 * Retorna o email do operador autenticado (admin OU teacher).
 * Usado para operações de criação e atualização.
 */
function getOperatorEmail() {
  const session = getSession();
  if (!session?.email || !['admin', 'teacher'].includes(session?.role)) {
    throw new Error('Usuário não autenticado ou sem permissão.');
  }
  return session.email;
}

/**
 * Retorna o email do admin autenticado.
 * Usado para operações destrutivas (excluir) — restritas a admin.
 */
function getAdminEmail() {
  const session = getSession();
  if (session?.role !== 'admin' || !session?.email) {
    throw new Error('Operação restrita ao administrador.');
  }
  return session.email;
}

async function adminSave(params) {
  const admin_email = params.action === 'delete' ? getAdminEmail() : getOperatorEmail();
  let res;
  try {
    res = await base44.functions.invoke('adminSave', { ...params, admin_email });
  } catch (error) {
    throw new Error(error?.response?.data?.error || error?.message || 'Erro desconhecido no adminSave');
  }

  // Validação segura da resposta
  if (!res || typeof res !== 'object') {
    throw new Error('Resposta inválida do servidor: formato não reconhecido');
  }

  const data = res.data || res;
  if (!data || typeof data !== 'object') {
    throw new Error('Resposta inválida do servidor: dados não disponíveis');
  }

  if (data.success === false || !data.success) {
    throw new Error(data.error || 'Erro desconhecido no adminSave');
  }

  return data;
}

export const adminApi = {
  create: (entity, data) => adminSave({ action: 'create', entity, data }),
  update: (entity, id, data) => adminSave({ action: 'update', entity, id, data }),
  delete: (entity, id) => adminSave({ action: 'delete', entity, id }),
  list: (entity, { filter, sort_by, limit } = {}) =>
    adminSave({ action: 'list', entity, filter, sort_by, limit }).then(r => (r && Array.isArray(r.records)) ? r.records : []),

  // ── BookChapter helpers ──────────────────────────────────────────────
  // Atalhos para a entidade BookChapter usados pela apostila.
  updateBookChapter: (id, data) => adminSave({ action: 'update', entity: 'BookChapter', id, data }),
  createBookChapter: (data) => adminSave({ action: 'create', entity: 'BookChapter', data }),

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

    return response?.record || response;
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