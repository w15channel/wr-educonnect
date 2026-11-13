import familyCurriculum from '@/components/courses/familyCurriculum';
import psychoanalysisCurriculum from '@/components/courses/psychoanalysisCurriculum';
import sexualityCurriculum from '@/components/courses/sexualityCurriculum';

const curricula = {
  'aconselhamento-familiar': familyCurriculum,
  psicanalise: psychoanalysisCurriculum,
  sexologia: sexualityCurriculum,
};

export default function courseWorkbookChapters(course) {
  return (curricula[course] || []).map(([subtitle, lessons], index) => ({
    id: `${course}-mod${index + 1}`,
    title: `Módulo ${index + 1}`,
    subtitle,
    colorLight: 'text-course',
    bgLight: 'bg-course/10',
    lessons: lessons.map(([title, content], lessonIndex) => ({
      id: lessonIndex === 0 ? `${course}-aula${index + 1}` : `${course}-mod${index + 1}-aula${lessonIndex + 1}`,
      title,
      content,
    })),
  }));
}