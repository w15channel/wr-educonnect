import { describe, it, expect, vi } from 'vitest';
vi.mock('@tanstack/react-query', () => ({ useQuery: options => options }));
vi.mock('@/api/base44Client', () => ({ base44: { entities: { LessonProgress: { filter: vi.fn() } } } }));
import { base44 } from '@/api/base44Client';
import useStudentRecords from '@/hooks/useStudentRecords';

describe('consulta individual do histórico', () => {
  it('inclui e-mail e código antigos sem reutilizar dados de outro aluno', async () => {
    base44.entities.LessonProgress.filter.mockResolvedValueOnce([{ id: 'saved', watched: true }]);
    const query = useStudentRecords('LessonProgress', { email: 'Student@test.local', code: 'EDU-ABC' });
    expect(query.placeholderData).toBeUndefined();
    expect(await query.queryFn()).toEqual([{ id: 'saved', watched: true }]);
    expect(base44.entities.LessonProgress.filter).toHaveBeenLastCalledWith({ student_email: { $in: ['EDU-ABC', 'Student@test.local', 'edu-abc', 'student@test.local'] } }, '-created_date', 500, 0);
    expect(query.queryKey).not.toEqual(useStudentRecords('LessonProgress', { email: 'other@test.local' }).queryKey);
  });
  it('busca a próxima página sem descartar registros mais antigos', async () => {
    base44.entities.LessonProgress.filter.mockResolvedValueOnce(Array.from({ length: 500 }, (_, i) => ({ id: i }))).mockResolvedValueOnce([{ id: 'old' }]);
    const query = useStudentRecords('LessonProgress', { email: 'student@test.local' });
    expect(await query.queryFn()).toHaveLength(501);
    expect(base44.entities.LessonProgress.filter).toHaveBeenLastCalledWith(expect.any(Object), '-created_date', 500, 500);
  });
  it('não consulta todos os alunos na ausência de identificação', () => {
    expect(useStudentRecords('LessonProgress', {}).enabled).toBe(false);
  });
  it('propaga falhas, em vez de transformar o histórico em uma lista vazia', async () => {
    base44.entities.LessonProgress.filter.mockRejectedValueOnce(new Error('indisponível'));
    await expect(useStudentRecords('LessonProgress', { email: 'student@test.local' }).queryFn()).rejects.toThrow('indisponível');
  });
});