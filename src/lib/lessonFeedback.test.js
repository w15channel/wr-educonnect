import { describe, expect, it } from 'vitest';
import { LESSON_FEEDBACK_OPTIONS, randomLessonFeedback } from './lessonFeedback';

describe('lesson feedback suggestions', () => {
  it('provides the ten approved messages', () => {
    expect(LESSON_FEEDBACK_OPTIONS).toHaveLength(10);
    expect(new Set(LESSON_FEEDBACK_OPTIONS).size).toBe(10);
  });

  it('selects suggestions across the full random range', () => {
    expect(randomLessonFeedback(() => 0)).toBe(LESSON_FEEDBACK_OPTIONS[0]);
    expect(randomLessonFeedback(() => 0.999999)).toBe(LESSON_FEEDBACK_OPTIONS[9]);
  });
});
