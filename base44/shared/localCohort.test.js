import { describe, expect, it } from 'npm:vitest@4.1.11';
import { LESSON_KNOWLEDGE } from '../functions/createDailyChallenge/lessonKnowledge.ts';
import { buildCohortQuestions } from '../functions/createDailyChallenge/lunaCohortGenerator.ts';

describe('Ofensiva por código, sem IA externa', () => {
  it('gera oito questões completas para cada aula do banco', () => {
    for (const module of LESSON_KNOWLEDGE) {
      for (const lesson of module.lessons) {
        const questions = buildCohortQuestions(lesson, '2026-10-19', 'tcc');
        expect(questions).toHaveLength(8);
        questions.forEach((question, index) => {
          expect(question.id).toBe(`q${index + 1}`);
          expect(question.text.length).toBeGreaterThan(20);
          expect(question.hint.length).toBeGreaterThan(5);
          expect(Object.keys(question).sort()).toEqual(['hint', 'id', 'text']);
        });
      }
    }
  });
  it('é reproduzível e varia com o dia', () => {
    const lesson = LESSON_KNOWLEDGE[0].lessons[0];
    const questions = buildCohortQuestions(lesson, '2026-10-19', 'tcc');
    expect(buildCohortQuestions(lesson, '2026-10-19', 'tcc')).toEqual(questions);
    expect(buildCohortQuestions(lesson, '2026-10-20', 'tcc')).not.toEqual(questions);
  });
});