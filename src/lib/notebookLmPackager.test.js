import { describe, it, expect } from 'vitest';
import { MOD1 } from './apostila/mod1';
import { MOD2 } from './apostila/mod2';
import { MOD10 } from './apostila/mod10';
import {
  generateStructuredSource,
  generatePodcastPrompt,
  generateVideoLessonScript,
  generateSlideDeckOutline,
} from './notebookLmPackager';

describe('notebookLmPackager tests', () => {
  it('formats structured source correctly for MOD1 Lesson 1', () => {
    const lesson = MOD1.lessons[0];
    const source = generateStructuredSource(MOD1, lesson);

    expect(source).toContain('AULA 1');
    expect(source).toContain('Prof. William Ribeiro | WR-EDU®');
    expect(source).toContain('RESUMO E OBJETIVOS DE APRENDIZAGEM');
    expect(source).toContain('CONTEÚDO INTEGRAL DA AULA');
    expect(source).toContain('PERGUNTAS REFLEXIVAS PARA DISCUSSÃO CLÍNICA');
  });

  it('generates podcast prompt with dual personas and clinical focus', () => {
    const lesson = MOD1.lessons[0];
    const prompt = generatePodcastPrompt(MOD1, lesson);

    expect(prompt).toContain('Host 1 (Especialista em Fundamentos Clínicos)');
    expect(prompt).toContain('Host 2 (Terapeuta Sênior de Campo)');
    expect(prompt).toContain('AUDIO OVERVIEW (PODCAST DE 10 A 15 MINUTOS)');
    expect(prompt).toContain('TEMA: "Aula 1');
  });

  it('generates pedagogical 3-block video lesson script', () => {
    const lesson = MOD2.lessons[0];
    const script = generateVideoLessonScript(MOD2, lesson);

    expect(script).toContain('ROTEIRO DE GRAVAÇÃO DE VIDEOAULA');
    expect(script).toContain('BLOCO 0: GANCHO INICIAL');
    expect(script).toContain('BLOCO 1: FUNDAMENTAÇÃO E CONCEITO');
    expect(script).toContain('BLOCO 2: ANÁLISE CLÍNICA E DEMONSTRAÇÃO');
    expect(script).toContain('BLOCO 3: ARMADILHAS COMUNS E COMO EVITAR');
    expect(script).toContain('BLOCO 4: DESAFIO PRÁTICO E ENCERRAMENTO');
  });

  it('generates 10-slide PowerPoint structure with speaker notes', () => {
    const lesson = MOD10.lessons[0];
    const slides = generateSlideDeckOutline(MOD10, lesson);

    expect(slides).toContain('ESTRUTURA DE SLIDES DE APRESENTAÇÃO');
    expect(slides).toContain('SLIDE 1: Capa Oficial');
    expect(slides).toContain('SLIDE 5: Estudo de Caso Clínico');
    expect(slides).toContain('SLIDE 9: Resumo Executivo');
    expect(slides).toContain('SLIDE 10: Fechamento e Próximos Passos');
    expect(slides).toContain('Notas do Orador:');
  });
});
