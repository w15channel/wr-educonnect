/**
 * Plano de contribuição mensal do aluno.
 *
 * save_plan: guarda valor + dia escolhidos e já lança a mensalidade do período.
 * confirm_payment: registra que o aluno contribuiu e entrega o Diamante da Contribuição.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  dueDateInCurrentMonth,
  firstDueDate,
  isValidDueDay,
  monthKey,
  monthRefFor,
  monthRefFromDate,
  normalizeAmount,
  todayInBrasilia,
} from '../../shared/tuitionPlan.ts';

const DAY_MS = 24 * 60 * 60 * 1000;
const norm = (value) => String(value || '').trim().toLowerCase();

async function findProfile(base44, email) {
  const list = await base44.entities.StudentProfile.filter({ student_email: email }, '-created_date', 5);
  return list[0] || null;
}

async function findTuition(base44, email, monthRef) {
  const list = await base44.entities.Tuition.filter({ student_email: email, month_ref: monthRef }, '-created_date', 5);
  return list[0] || null;
}

async function courseFor(base44, email) {
  const codes = await base44.entities.AccessCode.filter({ student_email: email }, '-created_date', 10);
  return codes.find((code) => code.is_active !== false)?.course || 'tcc';
}

async function grantDiamond(base44, tuition, email) {
  const dedupeKey = `tuition:${tuition.id}`;
  const prior = await base44.entities.Achievement.filter({ dedupe_key: dedupeKey }, '-created_date', 1);
  if (prior.length) return { diamond: false, achievement: prior[0] };

  const occurredAt = new Date().toISOString();
  const achievement = await base44.entities.Achievement.create({
    dedupe_key: dedupeKey,
    student_email: email,
    course: await courseFor(base44, email),
    kind: 'tuition',
    title: 'Diamante da Contribuição',
    message: 'confirmou sua contribuição mensal e conquistou o Diamante da Contribuição. 💎',
    mentioned_emails: [email],
    source_id: tuition.id,
    occurred_at: occurredAt,
    student_feature_until: new Date(Date.parse(occurredAt) + 15 * DAY_MS).toISOString(),
    wall_highlight_until: new Date(Date.parse(occurredAt) + 7 * DAY_MS).toISOString(),
  });
  return { diamond: true, achievement };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (user.role === 'admin') {
      return Response.json({ error: 'A contribuição mensal é preenchida pelo próprio aluno.' }, { status: 403 });
    }

    const email = norm(user.email);
    if (!email) return Response.json({ error: 'Sessão sem email de aluno.' }, { status: 400 });

    const payload = await req.json().catch(() => ({}));
    const action = String(payload.action || '');

    if (action === 'save_plan') {
      const amount = normalizeAmount(payload.amount);
      const dueDay = Number(payload.due_day);
      if (!amount) return Response.json({ error: 'Informe o valor da sua contribuição.' }, { status: 400 });
      if (!isValidDueDay(dueDay)) return Response.json({ error: 'Escolha um dia de vencimento entre 1 e 28.' }, { status: 400 });

      const profile = await findProfile(base44, email);
      const planData = {
        tuition_amount: amount,
        tuition_due_day: dueDay,
        tuition_setup_at: profile?.tuition_setup_at || new Date().toISOString(),
      };
      if (profile) await base44.entities.StudentProfile.update(profile.id, planData);
      else await base44.entities.StudentProfile.create({ student_email: email, ...planData });

      const dueDate = firstDueDate(dueDay);
      const monthRef = monthRefFromDate(dueDate);
      const existing = await findTuition(base44, email, monthRef);
      let tuition = existing;
      if (!existing) {
        tuition = await base44.entities.Tuition.create({
          student_email: email,
          student_name: user.full_name || '',
          month_ref: monthRef,
          amount,
          due_date: dueDate,
          status: 'pending',
        });
      } else if (existing.status !== 'paid') {
        tuition = await base44.entities.Tuition.update(existing.id, { amount, due_date: dueDate });
      }

      return Response.json({ success: true, plan: { amount, dueDay }, tuition, month_ref: monthRef, due_date: dueDate });
    }

    if (action === 'confirm_payment') {
      const amount = normalizeAmount(payload.amount);
      if (!amount) return Response.json({ error: 'Informe o valor que você contribuiu.' }, { status: 400 });
      const paidDate = /^\d{4}-\d{2}-\d{2}$/.test(String(payload.paid_date || ''))
        ? String(payload.paid_date)
        : todayInBrasilia();

      const paidThisMonth = (await base44.entities.Tuition.filter({ student_email: email, status: 'paid' }, '-paid_date', 20))
        .some((tuition) => String(tuition.paid_date || '').slice(0, 7) === monthKey());
      if (paidThisMonth) {
        return Response.json({ error: 'Sua contribuição deste mês já foi confirmada. 💎' }, { status: 409 });
      }

      const openTuitions = (await base44.entities.Tuition.filter({ student_email: email }, 'due_date', 40))
        .filter((tuition) => tuition.status !== 'paid');
      let tuition = openTuitions[0];

      if (!tuition) {
        const profile = await findProfile(base44, email);
        const dueDay = Number(profile?.tuition_due_day);
        if (!isValidDueDay(dueDay)) {
          return Response.json({ error: 'Defina antes o valor e o dia do vencimento da sua mensalidade.' }, { status: 409 });
        }
        const monthRef = monthRefFor();
        const existing = await findTuition(base44, email, monthRef);
        if (existing?.status === 'paid') {
          return Response.json({ error: 'A mensalidade deste mês já foi confirmada. 💎' }, { status: 409 });
        }
        tuition = existing || await base44.entities.Tuition.create({
          student_email: email,
          student_name: user.full_name || '',
          month_ref: monthRef,
          amount: Number(profile?.tuition_amount) || amount,
          due_date: dueDateInCurrentMonth(dueDay),
          status: 'pending',
        });
      }

      const updated = await base44.entities.Tuition.update(tuition.id, {
        status: 'paid',
        paid_date: paidDate,
        paid_amount: amount,
        wall_shared: true,
      });
      const award = await grantDiamond(base44, updated, email);

      return Response.json({
        success: true,
        tuition: updated,
        month_ref: updated.month_ref,
        diamond: award.diamond,
        achievement: award.achievement,
      });
    }

    return Response.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}