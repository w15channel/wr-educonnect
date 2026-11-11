/**
 * Motor de automação nativo do WR-EDU.
 *
 * Executa, em código próprio, as rotinas que antes dependiam de trabalho manual.
 * Não usa nenhuma integração de IA nem serviço externo: custo zero de créditos.
 * Cada regra é idempotente e pode ser executada quantas vezes for preciso.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { stalePresenceIds, tuitionStatusChanges, referenceDay } from '../../shared/nativeAutomations.ts';

const PAGE_SIZE = 500;
const WRITE_BATCH = 40;

async function readAll(entity) {
  const rows = [];
  for (let skip = 0; ; skip += PAGE_SIZE) {
    const page = await entity.list('-created_date', PAGE_SIZE, skip);
    rows.push(...(page || []));
    if (!page || page.length < PAGE_SIZE) break;
  }
  return rows;
}

async function writeBatches(entity, changes) {
  for (let offset = 0; offset < changes.length; offset += WRITE_BATCH) {
    await entity.bulkUpdate(changes.slice(offset, offset + WRITE_BATCH));
  }
  return changes.length;
}

const RULES = [
  {
    key: 'tuition_status',
    label: 'Situação das mensalidades',
    admin_only: false,
    run: async ({ store, dryRun, day }) => {
      const tuitions = await readAll(store.Tuition);
      const changes = tuitionStatusChanges(tuitions, day);
      if (dryRun) return { checked: tuitions.length, updated: 0, pending_changes: changes.length };
      return { checked: tuitions.length, updated: await writeBatches(store.Tuition, changes) };
    },
  },
  {
    key: 'presence',
    label: 'Presença online dos alunos',
    admin_only: false,
    run: async ({ store, dryRun }) => {
      const codes = await readAll(store.AccessCode);
      const ids = stalePresenceIds(codes);
      const changes = ids.map((id) => ({ id, is_online: false }));
      if (dryRun) return { checked: codes.length, updated: 0, pending_changes: changes.length };
      return { checked: codes.length, updated: await writeBatches(store.AccessCode, changes) };
    },
  },
];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const dryRun = payload?.dry_run === true;
    const requested = Array.isArray(payload?.rules) && payload.rules.length ? payload.rules.map(String) : null;
    const day = typeof payload?.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(payload.day) ? payload.day : referenceDay();
    const store = base44.asServiceRole.entities;
    const isAdmin = user.role === 'admin';

    const results = [];
    for (const rule of RULES) {
      if (requested && !requested.includes(rule.key)) continue;
      if (rule.admin_only && !isAdmin) {
        results.push({ rule: rule.key, label: rule.label, skipped: 'admin_only' });
        continue;
      }
      const outcome = await rule.run({ store, dryRun, user, day });
      results.push({ rule: rule.key, label: rule.label, ...outcome });
    }

    return Response.json({
      ok: true,
      dry_run: dryRun,
      reference_day: day,
      triggered_by: user.role,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}