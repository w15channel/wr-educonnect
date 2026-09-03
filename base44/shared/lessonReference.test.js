import { describe, expect, it } from 'vitest';
import { lessonReferenceTitle, parseLessonReference } from './lessonReference.ts';

describe('parseLessonReference', () => {
  it('keeps a RecordedLesson id as an entity reference', () => {
    expect(parseLessonReference('67f12c9a1234567890abcdef')).toEqual({
      kind: 'recorded',
      lessonId: '67f12c9a1234567890abcdef',
    });
  });

  it('parses an apostila composite key without treating it as an entity id', () => {
    expect(parseLessonReference('apostila:mod1:mod1-a5')).toEqual({
      kind: 'apostila',
      lessonId: 'apostila:mod1:mod1-a5',
      chapterId: 'mod1',
      apostilaLessonId: 'mod1-a5',
    });
  });

  it('rejects incomplete apostila references', () => {
    expect(parseLessonReference('apostila:mod1')).toBeNull();
    expect(parseLessonReference('apostila::a5')).toBeNull();
  });
});

describe('lessonReferenceTitle', () => {
  it('prefers the apostila lesson title and has a safe fallback', () => {
    const reference = parseLessonReference('apostila:mod1:mod1-a5');
    expect(lessonReferenceTitle(reference, { lesson_title: 'Técnicas cognitivas', title: 'Módulo 1' }))
      .toBe('Técnicas cognitivas');
    expect(lessonReferenceTitle(reference)).toBe('Aula da apostila');
  });
});
