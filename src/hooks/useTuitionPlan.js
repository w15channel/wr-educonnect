import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Valor e dia de vencimento escolhidos pelo aluno + a mensalidade aberta do período.
 */
export default function useTuitionPlan(session) {
  const email = session?.email || '';
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['tuition-plan-profile', email],
    queryFn: async () => {
      const profiles = await base44.entities.StudentProfile.filter({ student_email: email }, '-created_date', 5);
      return profiles[0] || null;
    },
    enabled: !!email,
  });

  const tuitionsQuery = useQuery({
    queryKey: ['tuition-plan-tuitions', email],
    queryFn: () => base44.entities.Tuition.filter({ student_email: email }, 'due_date', 24),
    enabled: !!email,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['tuition-plan-profile', email] });
    queryClient.invalidateQueries({ queryKey: ['tuition-plan-tuitions', email] });
    queryClient.invalidateQueries({ queryKey: ['tuitions'] });
    queryClient.invalidateQueries({ queryKey: ['overcoming-wall-achievements'] });
  };

  const savePlan = useMutation({
    mutationFn: ({ amount, dueDay }) => base44.functions.invoke('tuitionPlan', { action: 'save_plan', amount, due_day: dueDay }),
    onSuccess: refresh,
  });

  const confirmPayment = useMutation({
    mutationFn: ({ amount, paidDate }) => base44.functions.invoke('tuitionPlan', {
      action: 'confirm_payment',
      amount,
      paid_date: paidDate,
    }),
    onSuccess: refresh,
  });

  const profile = profileQuery.data || null;
  const tuitions = tuitionsQuery.data || [];
  const plan = profile?.tuition_amount && profile?.tuition_due_day
    ? { amount: Number(profile.tuition_amount), dueDay: Number(profile.tuition_due_day) }
    : null;
  const openTuition = tuitions
    .filter((tuition) => tuition.status !== 'paid')
    .sort((a, b) => String(a.due_date || '').localeCompare(String(b.due_date || '')))[0] || null;

  return {
    loading: profileQuery.isLoading || tuitionsQuery.isLoading,
    plan,
    tuitions,
    openTuition,
    savePlan,
    confirmPayment,
  };
}