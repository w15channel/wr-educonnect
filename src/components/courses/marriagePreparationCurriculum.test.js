import { describe, expect, it } from 'vitest';
import curriculum from './marriagePreparationCurriculum';

describe('apostila de Preparação para o Casamento', () => {
  it('mantém cinco módulos com cinco aulas cada', () => {
    expect(curriculum).toHaveLength(5);
    curriculum.forEach(([, lessons]) => expect(lessons).toHaveLength(5));
  });

  it('inclui uma aula de conversa sobre filhos, carreira e moradia', () => {
    const titles = curriculum.flatMap(([, lessons]) => lessons.map(([title]) => title));
    expect(titles).toContain('Conversa do casal sobre filhos, carreira e local de moradia');
  });
});
