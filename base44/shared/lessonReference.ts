const APOSTILA_PREFIX = 'apostila:';
const PODCAST_PREFIX = 'podcast:';

/**
 * Converts a LessonProgress reference into the entity query needed to resolve
 * its title. Recorded lessons use their Base44 entity id, while apostila
 * lessons use the stable `apostila:<chapter_id>:<lesson_id>` composite key.
 */
export function parseLessonReference(value = '') {
  const lessonId = String(value || '').trim();
  if (lessonId.startsWith(PODCAST_PREFIX)) {
    const podcastId = lessonId.slice(PODCAST_PREFIX.length).trim();
    return podcastId ? { kind: 'podcast', lessonId, podcastId } : null;
  }
  if (!lessonId.startsWith(APOSTILA_PREFIX)) {
    return lessonId ? { kind: 'recorded', lessonId } : null;
  }

  const parts = lessonId.split(':');
  if (parts.length !== 3 || !parts[1] || !parts[2]) return null;

  return {
    kind: 'apostila',
    lessonId,
    chapterId: parts[1],
    apostilaLessonId: parts[2],
  };
}

export function lessonReferenceTitle(reference, record) {
  if (reference?.kind === 'apostila') {
    return record?.lesson_title || record?.title || 'Aula da apostila';
  }
  if (reference?.kind === 'podcast') {
    return record?.title ? `Podcast: ${record.title}` : 'Episódio de Podcast';
  }
  return record?.title || 'Aula assistida';
}