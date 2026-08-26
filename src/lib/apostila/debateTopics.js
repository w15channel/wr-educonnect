import { MOD1 } from '@/lib/apostila/mod1';
import { MOD2 } from '@/lib/apostila/mod2';
import { MOD3 } from '@/lib/apostila/mod3';
import { MOD4 } from '@/lib/apostila/mod4';
import { MOD5 } from '@/lib/apostila/mod5';
import { MOD6 } from '@/lib/apostila/mod6';
import { MOD7 } from '@/lib/apostila/mod7';
import { MOD8 } from '@/lib/apostila/mod8';
import { MOD9 } from '@/lib/apostila/mod9';
import { MOD10 } from '@/lib/apostila/mod10';

/**
 * Temas de debate espelhando a apostila: cada módulo vira um grupo e cada
 * aula do módulo vira um tema numerado como está na apostila (ex: "3.2 ...").
 */
const CHAPTERS = [MOD1, MOD2, MOD3, MOD4, MOD5, MOD6, MOD7, MOD8, MOD9, MOD10];

export const FREE_TOPIC = 'Tema livre (proposto por alunos)';

export const DEBATE_TOPIC_GROUPS = CHAPTERS.map((chapter, chapterIndex) => ({
  moduleNumber: chapterIndex + 1,
  label: `Módulo ${chapterIndex + 1} — ${String(chapter.title || '').replace(/^Módulo \d+\s*[—-]\s*/, '')}`,
  topics: (chapter.lessons || []).map((lesson, lessonIndex) => `${chapterIndex + 1}.${lessonIndex + 1} ${lesson.title}`),
}));

export const DEBATE_TOPICS = [...DEBATE_TOPIC_GROUPS.flatMap((g) => g.topics), FREE_TOPIC];

export const topicModuleNumber = (topic = '') => {
  const match = String(topic).match(/^(\d+)\./);
  return match ? Number(match[1]) : null;
};