// Each new course has independent authoring slots; never copy TC material.
export default function courseWorkbookChapters(course) {
  return Array.from({ length: 10 }, (_, index) => ({
    id: `${course}-mod${index + 1}`,
    title: `Módulo ${index + 1}`,
    subtitle: 'Conteúdo em preparação',
    colorLight: 'text-course',
    bgLight: 'bg-course/10',
    lessons: [{ id: `${course}-aula${index + 1}`, title: `Conteúdo do módulo ${index + 1}`, content: '' }],
  }));
}