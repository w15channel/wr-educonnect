import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;
const client = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl,
});

const COURSE_CHAPTER_ENTITIES = {
  tc: 'TCBookChapter',
  tcc: 'TCBookChapter', // legacy course key; display name is TC
  'aconselhamento-familiar': 'FamilyBookChapter',
  psicanalise: 'PsychoanalysisBookChapter',
  sexologia: 'SexologyBookChapter',
  'preparacao-casamento': 'MarriagePreparationBookChapter',
};

function chapterEntityFor(query = {}) {
  const explicitCourse = String(query.course || '').trim().toLowerCase();
  if (COURSE_CHAPTER_ENTITIES[explicitCourse]) return COURSE_CHAPTER_ENTITIES[explicitCourse];
  const bookId = String(query.book_id || '').trim().toLowerCase();
  if (!bookId.startsWith('apostila-')) return null;
  const course = bookId.slice('apostila-'.length);
  return COURSE_CHAPTER_ENTITIES[course] || null;
}

function lessonKey(record) {
  return `${record?.book_id || ''}|${record?.chapter_id || ''}|${record?.lesson_id || record?.id || ''}`;
}

function sortChapterRecords(records, sortBy = 'order', limit) {
  const sort = String(sortBy || 'order');
  const descending = sort.startsWith('-');
  const field = descending ? sort.slice(1) : sort;
  records.sort((left, right) => {
    const a = left?.[field];
    const b = right?.[field];
    if (a === b) return 0;
    if (a === undefined || a === null) return 1;
    if (b === undefined || b === null) return -1;
    const comparison = typeof a === 'number' && typeof b === 'number'
      ? a - b
      : String(a).localeCompare(String(b));
    return descending ? -comparison : comparison;
  });
  const count = Number(limit);
  return Number.isFinite(count) && count > 0 ? records.slice(0, count) : records;
}

const entitiesProxy = new Proxy(client.entities, {
  get(target, property, receiver) {
    const entity = Reflect.get(target, property, receiver);
    if (property !== 'BookChapter' || !entity) return entity;

    return new Proxy(entity, {
      get(chapterStore, method, storeReceiver) {
        const original = Reflect.get(chapterStore, method, storeReceiver);
        if (method !== 'filter' || typeof original !== 'function') {
          return typeof original === 'function' ? original.bind(chapterStore) : original;
        }

        return async (...args) => {
          const [query = {}, sortBy = 'order', limit] = args;
          const specificEntityName = chapterEntityFor(query);
          if (!specificEntityName) return original.apply(chapterStore, args);

          const specificStore = Reflect.get(target, specificEntityName, target);
          const legacyPromise = original.apply(chapterStore, args).catch(() => []);
          const specificPromise = specificStore?.filter
            ? specificStore.filter(...args).catch(() => [])
            : Promise.resolve([]);
          const [legacyRecords, specificRecords] = await Promise.all([legacyPromise, specificPromise]);

          // Keep legacy records readable while course-specific records take precedence.
          const merged = new Map();
          for (const record of legacyRecords || []) merged.set(lessonKey(record), record);
          for (const record of specificRecords || []) merged.set(lessonKey(record), record);
          return sortChapterRecords([...merged.values()], sortBy, limit);
        };
      },
    });
  },
});

export const base44 = new Proxy(client, {
  get(target, property, receiver) {
    if (property === 'entities') return entitiesProxy;
    const value = Reflect.get(target, property, receiver);
    return typeof value === 'function' ? value.bind(target) : value;
  },
});
