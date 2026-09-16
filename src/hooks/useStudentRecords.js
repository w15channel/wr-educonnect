import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// A mesma consulta individual abastece apostila, tarefas e checklist.
export default function useStudentRecords(entityName, session, enabled = true) {
  const identifiers = [...new Set([session?.email, session?.code]
    .filter(Boolean).flatMap(value => {
      const original = String(value).trim();
      return [original, original.toLowerCase(), ...(original.includes('@') ? [] : [original.toUpperCase()])];
    }))].sort();
  return useQuery({
    queryKey: ['student-learning-records', entityName, identifiers],
    queryFn: async () => {
      const records = [];
      const limit = 500;
      for (let skip = 0; ; skip += limit) {
        const page = await base44.entities[entityName].filter(
          { student_email: { $in: identifiers } }, '-created_date', limit, skip,
        );
        records.push(...page);
        if (page.length < limit) break;
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      return records;
    },
    enabled: enabled && identifiers.length > 0,
    placeholderData: undefined,
  });
}