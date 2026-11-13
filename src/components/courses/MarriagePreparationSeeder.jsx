import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import courseWorkbookChapters from '@/components/courses/courseWorkbookChapters';
import { toast } from 'sonner';

const COURSE_ID = 'preparacao-casamento';
const BOOK_ID = `apostila-${COURSE_ID}`;

export default function MarriagePreparationSeeder() {
  const { session } = useCustomAuth();
  const queryClient = useQueryClient();
  const started = useRef(false);

  useEffect(() => {
    if (session?.role !== 'admin' || session?.course !== COURSE_ID || started.current) return;
    started.current = true;

    const chapters = courseWorkbookChapters(COURSE_ID);
    const seedRecords = chapters.flatMap((chapter, chapterIndex) => chapter.lessons.map((lesson, lessonIndex) => ({
      book_id: BOOK_ID,
      book_title: 'Apostila — Preparação para o Casamento',
      author_email: session.email || 'apostila@wr-edu.local',
      course: COURSE_ID,
      chapter_id: chapter.id,
      chapter_title: `${chapter.title} — ${chapter.subtitle}`,
      lesson_id: lesson.id,
      lesson_title: lesson.title,
      title: lesson.title,
      content: lesson.content,
      content_storage: 'inline',
      order: (chapterIndex * 100) + lessonIndex + 1,
    })));

    base44.functions.invoke('adminSave', {
      action: 'syncBookChapters',
      entity: 'BookChapter',
      admin_email: session.email,
      data: { chapters: seedRecords, createOnly: true },
    })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['apostila-lessons', BOOK_ID] });
        toast.success('A estrutura da apostila Preparação para o Casamento foi preparada.');
      })
      .catch((error) => {
        started.current = false;
        toast.error(error?.response?.data?.error || error?.message || 'Não foi possível preparar a apostila.');
      });
  }, [session?.course, session?.email, session?.role, queryClient]);

  return null;
}
