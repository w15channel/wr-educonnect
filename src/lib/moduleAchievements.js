import { parseModuleNumber } from '@/lib/examChecklistRules';

export const MODULE_TROPHIES = [
  { module: 1, color: 'text-amber-500', surface: 'bg-amber-500/15 border-amber-500/30' },
  { module: 2, color: 'text-slate-400', surface: 'bg-slate-400/15 border-slate-400/30' },
  { module: 3, color: 'text-orange-600', surface: 'bg-orange-600/15 border-orange-600/30' },
  { module: 4, color: 'text-emerald-500', surface: 'bg-emerald-500/15 border-emerald-500/30' },
  { module: 5, color: 'text-sky-500', surface: 'bg-sky-500/15 border-sky-500/30' },
  { module: 6, color: 'text-violet-500', surface: 'bg-violet-500/15 border-violet-500/30' },
  { module: 7, color: 'text-rose-500', surface: 'bg-rose-500/15 border-rose-500/30' },
  { module: 8, color: 'text-cyan-500', surface: 'bg-cyan-500/15 border-cyan-500/30' },
  { module: 9, color: 'text-fuchsia-500', surface: 'bg-fuchsia-500/15 border-fuchsia-500/30' },
  { module: 10, color: 'text-yellow-500', surface: 'bg-yellow-500/15 border-yellow-500/30' },
];

export const trophyForModule = (moduleNumber) => MODULE_TROPHIES[Number(moduleNumber) - 1] || MODULE_TROPHIES[0];

export function buildModuleCompletions(exams = [], submissions = []) {
  const examModules = new Map(exams.map((exam) => [exam.id, parseModuleNumber(exam.module_ref)]));
  return submissions.map((submission) => ({
    ...submission,
    moduleNumber: examModules.get(submission.exam_id),
  })).filter((item) => item.moduleNumber);
}