import { getMasterAdminKey, getAdminGoogleEmail, nowBRT } from './customAuth';
import { SEED_STUDENT_PROFILES, SEED_STUDENT_ACCESS_CODES } from '../data/seedStudents';
import { SEED_ACHIEVEMENTS } from '../data/seedAchievements';
import seedDeliveries from '../data/seedDeliveries.json';
import { runReconcileChecklists, runRecalculateScores } from './syncAcademicData';
import {
  buildDailyChallengeData,
  getTodayDateBRT,
  OFENSIVA_COURSES,
  OFENSIVA_MODULES,
  runCreateDailyChallenge,
  startDailyOfensivaAutomation,
} from './ofensivaEngine';

const STORAGE_PREFIX = 'wr_entity_';
const DELETED_STUDENTS_STORAGE_KEY = 'wr_deleted_student_identifiers';
const inMemoryStore = new Map();

function sanitizePhotoUrl(url) {
  if (!url || typeof url !== 'string') return '';
  if (url.includes('base44.app/api/apps/')) return '';
  return url;
}

export function getDeletedStudentIdentifiers() {
  const set = new Set();
  try {
    const raw = localStorage.getItem(DELETED_STUDENTS_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      arr.forEach((i) => set.add(String(i).toLowerCase().trim()));
    }
  } catch {}
  return set;
}

export function saveDeletedStudentIdentifiers(set) {
  try {
    localStorage.setItem(DELETED_STUDENTS_STORAGE_KEY, JSON.stringify([...set]));
  } catch {}
}

export function isOlwOrDeletedStudent(record) {
  if (!record) return false;
  const deletedSet = getDeletedStudentIdentifiers();

  const fields = [
    record.code,
    record.student_email,
    record.email,
    record.student_name,
    record.profile_name,
    record.id,
    record.code_id,
    record.author_email,
    record.sender_email,
    record.recipient_email,
    record.therapist_email,
    record.patient_email,
  ]
    .map((s) => String(s || '').toLowerCase().trim())
    .filter(Boolean);

  for (const field of fields) {
    if (
      field.startsWith('olw') ||
      field.includes(' olw') ||
      field.includes('olw-') ||
      field.includes('olw_')
    ) {
      return true;
    }
    if (deletedSet.has(field)) {
      return true;
    }
  }
  return false;
}

export function purgeDeletedAndOlwStudents() {
  const collectionsToClean = [
    'AccessCode',
    'StudentProfile',
    'LessonProgress',
    'TaskSubmission',
    'ExamSubmission',
    'DailyChallengeResponse',
    'ScoreItem',
    'StudentModuleUnlock',
    'TherapistPairing',
    'ChecklistVerification',
    'Achievement',
    'StudentWallPost',
    'ChatMessage',
    'Notification',
    'Tuition',
    'CertificateRecord',
    'WallReadReceipt',
    'ForumPost',
    'ForumReply',
  ];

  for (const entityName of collectionsToClean) {
    let items = null;
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${entityName}`);
      if (raw) items = JSON.parse(raw);
    } catch {}

    if (!items || !Array.isArray(items)) continue;

    const filtered = items.filter((item) => !isOlwOrDeletedStudent(item));
    if (filtered.length !== items.length) {
      saveCollection(entityName, filtered);
    }
  }
}

export function getCollection(entityName) {
  let stored = null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${entityName}`);
    if (raw) stored = JSON.parse(raw);
  } catch {
    // fallback to inMemoryStore
    if (inMemoryStore.has(entityName)) {
      stored = inMemoryStore.get(entityName);
    }
  }

  if (stored && Array.isArray(stored)) {
    stored = stored.filter((item) => !isOlwOrDeletedStudent(item));
    const seenIdSet = new Set();
    const dedupedList = [];
    for (const item of stored) {
      if (item && item.id) {
        if (seenIdSet.has(item.id)) continue;
        seenIdSet.add(item.id);
      }
      dedupedList.push(item);
    }
    stored = dedupedList;
  }

  // Seed / merge student profiles while preserving user edits and points
  if (entityName === 'StudentProfile') {
    if (!stored || stored.length === 0) {
      const seeded = SEED_STUDENT_PROFILES.map((p) => ({
        ...p,
        photo_url: sanitizePhotoUrl(p.photo_url),
        study_mode: 'diploma',
      }));
      saveCollection('StudentProfile', seeded);
      return seeded;
    }

    const storedEmailMap = new Map();
    const storedIdMap = new Map();
    stored.forEach((p, idx) => {
      const email = String(p.student_email || p.email || '').toLowerCase().trim();
      if (email) storedEmailMap.set(email, idx);
      if (p.id) storedIdMap.set(String(p.id).trim(), idx);
    });

    let modified = false;
    for (const seed of SEED_STUDENT_PROFILES) {
      const email = String(seed.student_email || seed.email || '').toLowerCase().trim();
      const seedId = seed.id ? String(seed.id).trim() : null;

      let matchIdx = -1;
      if (seedId && storedIdMap.has(seedId)) {
        matchIdx = storedIdMap.get(seedId);
      } else if (email && storedEmailMap.has(email)) {
        matchIdx = storedEmailMap.get(email);
      }

      if (matchIdx !== -1) {
        const current = stored[matchIdx];
        const cleanedPhoto = sanitizePhotoUrl(current.photo_url || seed.photo_url);
        const nextStudyMode = current.study_mode || 'diploma';
        stored[matchIdx] = {
          ...seed,
          ...current,
          code_id: current.code_id || seed.code_id,
          full_name: current.full_name || seed.full_name,
          bio: current.bio ?? seed.bio,
          photo_url: cleanedPhoto,
          avatar_color: current.avatar_color || seed.avatar_color,
          avatar_emoji: current.avatar_emoji || seed.avatar_emoji,
          points: current.points !== undefined ? current.points : seed.points,
          pontuacao_total:
            current.pontuacao_total !== undefined
              ? current.pontuacao_total
              : seed.pontuacao_total,
          pontuacao_estudos:
            current.pontuacao_estudos !== undefined
              ? current.pontuacao_estudos
              : seed.pontuacao_estudos,
          study_mode: nextStudyMode,
        };
        modified = true;
      } else {
        stored.push({
          ...seed,
          photo_url: sanitizePhotoUrl(seed.photo_url),
          study_mode: 'diploma',
        });
        const newIdx = stored.length - 1;
        if (email) storedEmailMap.set(email, newIdx);
        if (seedId) storedIdMap.set(seedId, newIdx);
        modified = true;
      }
    }

    const seenProfileIds = new Set();
    const uniqueProfiles = [];
    for (const p of stored) {
      const idKey = p.id ? String(p.id).trim() : null;
      if (idKey && seenProfileIds.has(idKey)) {
        modified = true;
        continue;
      }
      if (idKey) seenProfileIds.add(idKey);
      uniqueProfiles.push(p);
    }
    stored = uniqueProfiles;

    if (modified) {
      saveCollection('StudentProfile', stored);
    }
    return stored;
  }

  // Seed / merge access codes while preserving user edits and simplified study_mode
  if (entityName === 'AccessCode') {
    const adminKey = getMasterAdminKey();
    const adminEmail = getAdminGoogleEmail();
    const adminCodeRecord = {
      id: 'admin_code_master',
      code: adminKey,
      student_name: 'Professor William',
      student_email: adminEmail,
      profile_category: 'admin',
      is_active: true,
      course: 'tcc',
      created_date: nowBRT(),
    };

    if (!stored || stored.length === 0) {
      const allCodes = [
        adminCodeRecord,
        ...SEED_STUDENT_ACCESS_CODES.map((c) => ({
          ...c,
          profile_photo_url: sanitizePhotoUrl(c.profile_photo_url),
          study_mode: 'diploma',
        })),
      ];
      saveCollection('AccessCode', allCodes);
      return allCodes;
    }

    let modified = false;
    const adminIdx = stored.findIndex(
      (c) =>
        c.id === 'admin_code_master' ||
        c.profile_category === 'admin' ||
        c.code === adminKey
    );
    if (adminIdx === -1) {
      stored.unshift(adminCodeRecord);
      modified = true;
    } else if (stored[adminIdx].code !== adminKey) {
      stored[adminIdx] = {
        ...stored[adminIdx],
        code: adminKey,
        student_email: adminEmail,
        profile_category: 'admin',
      };
      modified = true;
    }

    const storedEmailMap = new Map();
    const storedIdMap = new Map();
    const storedCodeMap = new Map();
    stored.forEach((c, idx) => {
      const email = String(c.student_email || '').toLowerCase().trim();
      if (email) storedEmailMap.set(email, idx);
      if (c.id) storedIdMap.set(String(c.id).trim(), idx);
      if (c.code) storedCodeMap.set(String(c.code).trim().toUpperCase(), idx);
    });

    for (const seed of SEED_STUDENT_ACCESS_CODES) {
      const email = String(seed.student_email || '').toLowerCase().trim();
      const seedId = seed.id ? String(seed.id).trim() : null;
      const seedCode = seed.code ? String(seed.code).trim().toUpperCase() : null;

      let matchIdx = -1;
      if (seedId && storedIdMap.has(seedId)) {
        matchIdx = storedIdMap.get(seedId);
      } else if (seedCode && storedCodeMap.has(seedCode)) {
        matchIdx = storedCodeMap.get(seedCode);
      } else if (email && storedEmailMap.has(email)) {
        matchIdx = storedEmailMap.get(email);
      }

      if (matchIdx !== -1) {
        const current = stored[matchIdx];
        const cleanedPhoto = sanitizePhotoUrl(
          current.profile_photo_url ?? seed.profile_photo_url
        );
        const nextStudyMode = current.study_mode || 'diploma';
        stored[matchIdx] = {
          ...seed,
          ...current,
          profile_photo_url: cleanedPhoto,
          study_mode: nextStudyMode,
        };
        modified = true;
      } else {
        stored.push({
          ...seed,
          profile_photo_url: sanitizePhotoUrl(seed.profile_photo_url),
          study_mode: 'diploma',
        });
        const newIdx = stored.length - 1;
        if (email) storedEmailMap.set(email, newIdx);
        if (seedId) storedIdMap.set(seedId, newIdx);
        if (seedCode) storedCodeMap.set(seedCode, newIdx);
        modified = true;
      }
    }

    // Strictly deduplicate by ID and code to guarantee uniqueness
    const seenIds = new Set();
    const seenCodes = new Set();
    const uniqueCodes = [];
    for (const c of stored) {
      const idKey = c.id ? String(c.id).trim() : null;
      const codeKey = c.code ? String(c.code).trim().toUpperCase() : null;
      if (idKey && seenIds.has(idKey)) {
        modified = true;
        continue;
      }
      if (codeKey && seenCodes.has(codeKey)) {
        modified = true;
        continue;
      }
      if (idKey) seenIds.add(idKey);
      if (codeKey) seenCodes.add(codeKey);
      uniqueCodes.push(c);
    }
    stored = uniqueCodes;

    if (modified) {
      saveCollection('AccessCode', stored);
    }
    return stored;
  }

  if (entityName === 'AdminCredential') {
    const initialCreds = [
      {
        id: 'admin_cred_1',
        email: getAdminGoogleEmail(),
        password_hash: '',
        is_configured: true,
        created_date: nowBRT(),
      },
    ];
    if (!stored || stored.length === 0) {
      saveCollection(entityName, initialCreds);
      return initialCreds;
    }
    return stored;
  }

  if (entityName === 'Achievement') {
    if (!stored || stored.length === 0) {
      saveCollection('Achievement', SEED_ACHIEVEMENTS);
      return SEED_ACHIEVEMENTS;
    }

    const storedMap = new Map();
    stored.forEach((item, idx) => {
      const key = item.dedupe_key || item.id;
      if (key) storedMap.set(key, idx);
    });

    let modified = false;
    for (const seed of SEED_ACHIEVEMENTS) {
      const key = seed.dedupe_key || seed.id;
      if (!key) continue;
      if (!storedMap.has(key)) {
        stored.push(seed);
        storedMap.set(key, stored.length - 1);
        modified = true;
      }
    }

    if (modified) {
      saveCollection('Achievement', stored);
    }
    return stored;
  }

  // DailyChallenge: merge seedDeliveries AND ensure today's automated challenges exist for all modules & courses
  if (entityName === 'DailyChallenge') {
    let list = Array.isArray(stored) ? [...stored] : [];
    if (
      list.length === 0 &&
      seedDeliveries?.DailyChallenge &&
      Array.isArray(seedDeliveries.DailyChallenge)
    ) {
      list = [...seedDeliveries.DailyChallenge];
    }

    const today = getTodayDateBRT();
    let addedToday = false;

    for (const course of OFENSIVA_COURSES) {
      for (const modNum of OFENSIVA_MODULES) {
        const existingIdx = list.findIndex(
          (c) =>
            c.date === today &&
            String(c.course || 'tcc').toLowerCase() === course &&
            Number(c.module_number || 1) === modNum
        );
        const existing = existingIdx >= 0 ? list[existingIdx] : null;
        if (!existing || !Array.isArray(existing.questions) || existing.questions.length < 8) {
          const data = buildDailyChallengeData({
            course,
            moduleNumber: modNum,
            date: today,
          });
          const record = {
            ...(existing || {}),
            ...data,
            id: existing?.id || `dc_${today}_${course}_m${modNum}`,
            created_date: existing?.created_date || nowBRT(),
            updated_date: nowBRT(),
          };
          if (existingIdx >= 0) {
            list[existingIdx] = record;
          } else {
            list.unshift(record);
          }
          addedToday = true;
        }
      }
    }

    if (addedToday || !stored) {
      saveCollection('DailyChallenge', list);
    }
    inMemoryStore.set('DailyChallenge', list);
    return list;
  }

  if (stored && stored.length > 0) {
    if (
      seedDeliveries &&
      seedDeliveries[entityName] &&
      seedDeliveries[entityName].length > 0
    ) {
      const storedIds = new Set(stored.map((i) => i.id));
      let merged = false;
      for (const item of seedDeliveries[entityName]) {
        if (!storedIds.has(item.id)) {
          stored.push(item);
          storedIds.add(item.id);
          merged = true;
        }
      }
      if (merged) {
        saveCollection(entityName, stored);
      }
    }
    inMemoryStore.set(entityName, stored);
    return stored;
  }

  if (
    seedDeliveries &&
    seedDeliveries[entityName] &&
    seedDeliveries[entityName].length > 0
  ) {
    const list = [...seedDeliveries[entityName]];
    saveCollection(entityName, list);
    return list;
  }

  return stored || [];
}

export function saveCollection(entityName, items) {
  inMemoryStore.set(entityName, items);
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${entityName}`, JSON.stringify(items));
  } catch {
    // quota exceeded or SSR - safely handled by inMemoryStore
  }
}

function compareValues(a, b, desc = false) {
  if (a === b) return 0;
  if (a == null) return desc ? 1 : -1;
  if (b == null) return desc ? -1 : 1;
  const numA = Number(a);
  const numB = Number(b);
  if (!isNaN(numA) && !isNaN(numB)) {
    return desc ? numB - numA : numA - numB;
  }
  const strA = String(a).toLowerCase();
  const strB = String(b).toLowerCase();
  return desc ? strB.localeCompare(strA) : strA.localeCompare(strB);
}

function sortItems(items, sortField) {
  if (!sortField) return items;
  const isDesc = sortField.startsWith('-');
  const field = isDesc ? sortField.slice(1) : sortField;
  return [...items].sort((a, b) => compareValues(a?.[field], b?.[field], isDesc));
}

function matchesQuery(item, query = {}) {
  for (const [key, val] of Object.entries(query)) {
    if (val && typeof val === 'object' && '$in' in val) {
      const allowed = val.$in.map((v) => String(v).toLowerCase());
      const itemVal = String(item?.[key] || '').toLowerCase();
      if (!allowed.includes(itemVal)) return false;
    } else if (val !== undefined) {
      if (typeof val === 'string') {
        if (String(item?.[key] ?? '').toLowerCase() !== val.toLowerCase()) return false;
      } else if (typeof val === 'number') {
        const itemNum = Number(item?.[key]);
        if (itemNum !== val && String(item?.[key] ?? '') !== String(val)) return false;
      } else {
        if (item?.[key] !== val) return false;
      }
    }
  }
  return true;
}

export function createLocalEntityHandler(entityName) {
  return {
    async list(sort = '-created_date', limit = 100, skip = 0) {
      const items = getCollection(entityName);
      const sorted = sortItems(items, sort);
      return sorted.slice(skip, skip + limit);
    },

    async filter(query = {}, sort = '-created_date', limit = 100, skip = 0) {
      const items = getCollection(entityName);
      const filtered = items.filter((item) => matchesQuery(item, query));
      const sorted = sortItems(filtered, sort);
      return sorted.slice(skip, skip + limit);
    },

    async get(id) {
      const items = getCollection(entityName);
      return items.find((i) => i.id === id) || null;
    },

    async create(data) {
      const items = getCollection(entityName);
      if (entityName === 'Achievement' && data.dedupe_key) {
        const existingIdx = items.findIndex((i) => i.dedupe_key === data.dedupe_key);
        if (existingIdx !== -1) {
          items[existingIdx] = {
            ...items[existingIdx],
            ...data,
            updated_date: nowBRT(),
          };
          saveCollection(entityName, items);
          return items[existingIdx];
        }
      }
      const id =
        data.id || `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const record = {
        ...data,
        id,
        created_date: data.created_date || nowBRT(),
        updated_date: nowBRT(),
      };
      items.unshift(record);
      saveCollection(entityName, items);
      return record;
    },

    async bulkCreate(records = []) {
      const items = getCollection(entityName);
      const created = [];
      for (const data of records) {
        if (entityName === 'Achievement' && data.dedupe_key) {
          const existingIdx = items.findIndex((i) => i.dedupe_key === data.dedupe_key);
          if (existingIdx !== -1) {
            items[existingIdx] = {
              ...items[existingIdx],
              ...data,
              updated_date: nowBRT(),
            };
            created.push(items[existingIdx]);
            continue;
          }
        }
        const record = {
          ...data,
          id:
            data.id ||
            `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          created_date: data.created_date || nowBRT(),
          updated_date: nowBRT(),
        };
        items.unshift(record);
        created.push(record);
      }
      saveCollection(entityName, items);
      return created;
    },

    async update(id, patch) {
      const items = getCollection(entityName);
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) return null;
      items[idx] = {
        ...items[idx],
        ...patch,
        updated_date: nowBRT(),
      };
      saveCollection(entityName, items);
      return items[idx];
    },

    async bulkUpdate(records = []) {
      const items = getCollection(entityName);
      const updated = [];
      const itemMap = new Map(items.map((it, idx) => [it.id, idx]));
      for (const rec of records) {
        if (!rec.id) continue;
        const idx = itemMap.get(rec.id);
        if (idx !== undefined) {
          items[idx] = {
            ...items[idx],
            ...rec,
            updated_date: nowBRT(),
          };
          updated.push(items[idx]);
        }
      }
      saveCollection(entityName, items);
      return updated;
    },

    async delete(id) {
      const items = getCollection(entityName);
      const next = items.filter((i) => i.id !== id);
      saveCollection(entityName, next);
      return { success: true };
    },

    subscribe(_cb) {
      return () => {};
    },
  };
}

function addPointsToStudent({
  studentEmail,
  codeId,
  pointsDelta,
  category,
  title,
  sourceId,
  moduleNumber = null,
}) {
  const delta = Number(pointsDelta) || 0;
  if (!delta) return 0;

  const emailLower = String(studentEmail || '').toLowerCase().trim();
  const scoreItems = getCollection('ScoreItem');

  if (sourceId && emailLower) {
    const duplicate = scoreItems.find(
      (item) =>
        String(item.student_email || '').toLowerCase().trim() === emailLower &&
        item.category === category &&
        item.source_id === sourceId
    );
    if (duplicate) {
      return Number(duplicate.points || 0);
    }
  }

  if (emailLower) {
    scoreItems.unshift({
      id: `score_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      student_email: emailLower,
      category: category || 'activity',
      title: title || 'Atividade concluída',
      points: delta,
      source_id: sourceId || `src_${Date.now()}`,
      module_number: moduleNumber,
      awarded_at: nowBRT(),
      created_date: nowBRT(),
      updated_date: nowBRT(),
    });
    saveCollection('ScoreItem', scoreItems);
  }

  const profiles = getCollection('StudentProfile');
  let newTotal = 0;
  let profileUpdated = false;
  for (let i = 0; i < profiles.length; i += 1) {
    const p = profiles[i];
    const pEmail = String(p.student_email || p.email || '').toLowerCase().trim();
    if ((emailLower && pEmail === emailLower) || (codeId && p.code_id === codeId)) {
      const currentTotal = Number(p.pontuacao_total ?? p.points ?? 0);
      const currentStudy = Number(p.pontuacao_estudos ?? p.points ?? 0);
      newTotal = currentTotal + delta;
      profiles[i] = {
        ...p,
        points: newTotal,
        pontuacao_total: newTotal,
        pontuacao_estudos: currentStudy + delta,
        updated_date: nowBRT(),
      };
      profileUpdated = true;
    }
  }
  if (profileUpdated) saveCollection('StudentProfile', profiles);

  const codes = getCollection('AccessCode');
  let codeUpdated = false;
  for (let i = 0; i < codes.length; i += 1) {
    const c = codes[i];
    const cEmail = String(c.student_email || '').toLowerCase().trim();
    if ((emailLower && cEmail === emailLower) || (codeId && c.id === codeId)) {
      const currentTotal = Number(c.pontuacao_total ?? 0);
      const currentStudy = Number(c.pontuacao_estudos ?? 0);
      newTotal = Math.max(newTotal, currentTotal + delta);
      codes[i] = {
        ...c,
        pontuacao_total: currentTotal + delta,
        pontuacao_estudos: currentStudy + delta,
        updated_date: nowBRT(),
      };
      codeUpdated = true;
    }
  }
  if (codeUpdated) saveCollection('AccessCode', codes);

  return newTotal;
}

export async function invokeLocalFunction(name, payload = {}) {
  const masterAdminKey = getMasterAdminKey();
  const adminEmail = getAdminGoogleEmail();

  if (name === 'siteLogin') {
    const mode = payload?.mode;
    const rawCode = payload?.code ? String(payload.code).trim().toUpperCase() : '';

    if (rawCode && rawCode === masterAdminKey.trim().toUpperCase()) {
      return {
        data: {
          success: true,
          session: {
            role: 'admin',
            profileCategory: 'admin',
            codeId: 'admin_code_master',
            code: rawCode,
            name: 'Professor William',
            email: adminEmail,
            course: null,
          },
        },
      };
    }

    if (mode === 'admin_google') {
      return {
        data: {
          success: true,
          session: {
            role: 'admin',
            profileCategory: 'admin',
            name: 'Professor William',
            email: adminEmail,
            course: null,
          },
        },
      };
    }

    if (mode === 'student' || !mode) {
      if (!rawCode) {
        const err = new Error('Informe o código de acesso.');
        err.status = 400;
        err.response = { status: 400, data: { error: 'Informe o código de acesso.' } };
        throw err;
      }

      const codes = getCollection('AccessCode');
      const record = codes.find(
        (c) => String(c.code).trim().toUpperCase() === rawCode && c.is_active !== false
      );

      if (!record) {
        const err = new Error('Código inválido ou desativado.');
        err.status = 401;
        err.response = { status: 401, data: { error: 'Código inválido ou desativado.' } };
        throw err;
      }

      const accessCodeHandler = createLocalEntityHandler('AccessCode');
      await accessCodeHandler.update(record.id, {
        last_login: nowBRT(),
        study_mode: record.study_mode || 'diploma',
      });

      const profileCategory = record.profile_category || 'student';
      const role =
        profileCategory === 'admin'
          ? 'admin'
          : profileCategory === 'teacher'
          ? 'teacher'
          : 'student';

      return {
        data: {
          success: true,
          session: {
            role,
            profileCategory,
            codeId: record.id,
            code: record.code,
            name: record.profile_name || record.student_name || 'Aluno',
            email: record.student_email || '',
            bio: record.profile_bio || '',
            avatarColor: record.profile_avatar_color || '#5b5ef4',
            photoUrl: sanitizePhotoUrl(record.profile_photo_url || ''),
            course: record.course || 'tcc',
            study_mode: record.study_mode || 'diploma',
          },
        },
      };
    }

    if (mode === 'admin') {
      const email = String(payload?.email || '').trim().toLowerCase();
      if (email === adminEmail.toLowerCase() || email.includes('admin')) {
        return {
          data: {
            success: true,
            session: {
              role: 'admin',
              profileCategory: 'admin',
              name: 'Professor William',
              email: adminEmail,
              course: null,
            },
          },
        };
      }
    }
  }

  if (name === 'createDailyChallenge') {
    const handler = createLocalEntityHandler('DailyChallenge');
    const result = runCreateDailyChallenge({
      getCollection,
      createRecord: (entity, data) => {
        const items = getCollection(entity);
        const rec = {
          ...data,
          id:
            data.id ||
            `dc_${data.date || getTodayDateBRT()}_${data.course || 'tcc'}_m${data.module_number || 1}`,
          created_date: nowBRT(),
          updated_date: nowBRT(),
        };
        items.unshift(rec);
        saveCollection(entity, items);
        return rec;
      },
      updateRecord: (entity, id, patch) => {
        const items = getCollection(entity);
        const idx = items.findIndex((i) => i.id === id);
        if (idx === -1) return null;
        items[idx] = { ...items[idx], ...patch, updated_date: nowBRT() };
        saveCollection(entity, items);
        return items[idx];
      },
      payload,
    });
    void handler;
    return { data: result };
  }

  if (name === 'adminSave') {
    const entityName = payload?.entity;
    const action = payload?.action || (payload?.id ? 'update' : 'create');
    if (!entityName) {
      return { data: { success: true } };
    }
    const handler = createLocalEntityHandler(entityName);

    if (action === 'list') {
      const sort = payload?.sort || payload?.sort_by || '-created_date';
      const limit = Math.min(Number(payload?.limit) || 200, 1000);
      const rawFilter = payload?.query || payload?.filter;
      const query = rawFilter && typeof rawFilter === 'object' ? rawFilter : null;
      const records = query
        ? await handler.filter(query, sort, limit)
        : await handler.list(sort, limit);
      return { data: { success: true, records } };
    }

    if (action === 'delete' && payload?.id) {
      await handler.delete(payload.id);
      return { data: { success: true } };
    }

    if ((action === 'update' || payload?.id) && payload?.id) {
      const record = await handler.update(payload.id, payload.data || {});
      return { data: { success: true, record } };
    }

    if (payload?.data) {
      const record = await handler.create(payload.data);
      return { data: { success: true, record } };
    }

    return { data: { success: true } };
  }

  if (name === 'syncEduCodes' || name === 'restoreStudents') {
    const res = restoreSeedStudents(payload?.force ?? false);
    return { data: res };
  }

  if (name === 'deleteStudentData') {
    const codeId = payload?.code_id;
    const studentEmail = (payload?.student_email || payload?.email || '')
      .toLowerCase()
      .trim();
    const deletedSet = getDeletedStudentIdentifiers();

    const accessCodes = getCollection('AccessCode');
    const studentProfiles = getCollection('StudentProfile');

    const targetCode = accessCodes.find(
      (c) =>
        c.id === codeId ||
        c.code === codeId ||
        (studentEmail && (c.student_email || '').toLowerCase() === studentEmail)
    );
    const targetProfile = studentProfiles.find(
      (p) =>
        p.id === codeId ||
        p.code_id === codeId ||
        (studentEmail &&
          ((p.student_email || '').toLowerCase() === studentEmail ||
            (p.email || '').toLowerCase() === studentEmail))
    );

    if (codeId) deletedSet.add(String(codeId).toLowerCase().trim());
    if (studentEmail) deletedSet.add(studentEmail);

    if (targetCode) {
      if (targetCode.id) deletedSet.add(String(targetCode.id).toLowerCase().trim());
      if (targetCode.code) deletedSet.add(String(targetCode.code).toLowerCase().trim());
      if (targetCode.student_email)
        deletedSet.add(String(targetCode.student_email).toLowerCase().trim());
    }
    if (targetProfile) {
      if (targetProfile.id) deletedSet.add(String(targetProfile.id).toLowerCase().trim());
      if (targetProfile.code_id)
        deletedSet.add(String(targetProfile.code_id).toLowerCase().trim());
      if (targetProfile.student_email)
        deletedSet.add(String(targetProfile.student_email).toLowerCase().trim());
      if (targetProfile.email)
        deletedSet.add(String(targetProfile.email).toLowerCase().trim());
    }

    saveDeletedStudentIdentifiers(deletedSet);
    purgeDeletedAndOlwStudents();

    return { data: { success: true, deleted_count: deletedSet.size } };
  }

  if (name === 'reconcileStudentChecklists') {
    const storeProxy = new Proxy(
      {},
      {
        get(_target, prop) {
          return createLocalEntityHandler(String(prop));
        },
      }
    );
    const result = await runReconcileChecklists(storeProxy, payload);
    return { data: result };
  }

  if (
    name === 'recalculateScores' ||
    name === 'auditFixAllScores' ||
    name === 'auditAllStudentScores' ||
    name === 'populateScoreCache' ||
    name === 'syncOfensivaScore'
  ) {
    const storeProxy = new Proxy(
      {},
      {
        get(_target, prop) {
          return createLocalEntityHandler(String(prop));
        },
      }
    );
    const result = await runRecalculateScores(storeProxy, payload);
    return { data: { success: true, ...result } };
  }

  if (name === 'deduplicateScoreItems' || name === 'stampScoreModule') {
    return { data: { success: true, removed: 0, updated: 0 } };
  }

  if (name === 'syncDeliveriesAndChecklists') {
    const storeProxy = new Proxy(
      {},
      {
        get(_target, prop) {
          return createLocalEntityHandler(String(prop));
        },
      }
    );
    const checklistResult = await runReconcileChecklists(storeProxy, payload);
    const scoreResult = await runRecalculateScores(storeProxy, payload);
    return {
      data: {
        success: true,
        checklist: checklistResult,
        scores: scoreResult,
      },
    };
  }

  if (name === 'manageOvercomingWall') {
    const action = payload?.action;
    const activeCourse = payload?.course || 'tcc';
    const actorEmail = (payload?.actor_email || '').toLowerCase().trim();

    if (action === 'bootstrap') {
      const accessCodes = getCollection('AccessCode');
      const studentProfiles = getCollection('StudentProfile');
      const allMsgs = getCollection('ChatMessage');
      const messages = allMsgs.filter((m) => {
        if (!m.session_id) return false;
        if (
          m.session_id === `class_chat_${activeCourse}` ||
          m.session_id === 'class_chat'
        )
          return true;
        return false;
      });
      const activityRecords = {
        lessonProgresses: getCollection('LessonProgress'),
        taskSubmissions: getCollection('TaskSubmission'),
        examSubmissions: getCollection('ExamSubmission'),
        challengeResponses: getCollection('DailyChallengeResponse'),
        forumPosts: getCollection('ForumPost'),
        pairings: getCollection('TherapistPairing'),
        lessons: getCollection('RecordedLesson'),
        tasks: getCollection('Task'),
        exams: getCollection('Exam'),
      };
      const savedAchievements = getCollection('Achievement').filter(
        (a) => !a.course || a.course === activeCourse
      );
      const institutionalRecords = {
        shared: getCollection('WallPublication').filter(
          (p) => !p.course || p.course === activeCourse
        ),
        notices: getCollection('Announcement').filter(
          (n) => !n.course || n.course === activeCourse
        ),
        liveSessions: getCollection('LiveSession').filter(
          (l) => !l.course || l.course === activeCourse
        ),
        calendarEvents: getCollection('CalendarEvent'),
      };
      const reactions = getCollection('AchievementReaction');
      const notifications = actorEmail
        ? getCollection('Notification').filter(
            (n) => (n.recipient_email || '').toLowerCase() === actorEmail
          )
        : [];
      const personalPosts = actorEmail
        ? getCollection('StudentWallPost').filter(
            (p) => (p.student_email || '').toLowerCase() === actorEmail
          )
        : [];
      const readReceipts = getCollection('WallReadReceipt');
      const monitorHistory = getCollection('MonitorHistory').filter(
        (m) => !m.course || m.course === activeCourse
      );

      return {
        data: {
          accessCodes,
          studentProfiles,
          messages,
          activityRecords,
          savedAchievements,
          institutionalRecords,
          reactions,
          notifications,
          personalPosts,
          readReceipts,
          monitorHistory,
        },
      };
    }

    if (action === 'profiles') {
      const allProfiles = getCollection('StudentProfile');
      const allCodes = getCollection('AccessCode');
      const matched = [];
      allProfiles.forEach((p) => {
        const pEmail = (p.student_email || p.email || '').toLowerCase().trim();
        if (actorEmail && pEmail === actorEmail) matched.push(p);
      });
      if (matched.length === 0 && actorEmail) {
        const codeRec = allCodes.find(
          (c) => (c.student_email || '').toLowerCase().trim() === actorEmail
        );
        if (codeRec) {
          matched.push({
            id: codeRec.id,
            code_id: codeRec.id,
            student_email: codeRec.student_email,
            full_name: codeRec.profile_name || codeRec.student_name,
            nickname: (codeRec.profile_name || codeRec.student_name || '').split(' ')[0],
            birth_date: '1990-01-01',
            whatsapp: '0000000000',
            bio:
              codeRec.profile_bio ||
              'Aluno(a) do curso de Terapia / Psicanálise.',
            avatar_emoji: codeRec.profile_avatar_emoji || 'a01',
            avatar_color: codeRec.profile_avatar_color || '#5b5ef4',
            study_mode: codeRec.study_mode || 'diploma',
          });
        }
      }
      return { data: { records: matched } };
    }

    if (action === 'listReads') {
      return { data: { records: getCollection('WallReadReceipt') } };
    }

    if (action === 'markRead') {
      const handler = createLocalEntityHandler('WallReadReceipt');
      const receipts = getCollection('WallReadReceipt');
      const targetIds = Array.isArray(payload.target_ids)
        ? payload.target_ids
        : payload.target_id
        ? [payload.target_id]
        : [];
      for (const targetId of targetIds) {
        const exists = receipts.some(
          (r) =>
            r.target_id === targetId &&
            (r.reader_email || '').toLowerCase() === actorEmail
        );
        if (!exists && actorEmail) {
          await handler.create({
            target_id: targetId,
            reader_email: actorEmail,
            reader_name: payload.actor_name || 'Aluno',
            read_at: nowBRT(),
          });
        }
      }
      return { data: { success: true } };
    }

    if (action === 'react') {
      const handler = createLocalEntityHandler('AchievementReaction');
      const record = await handler.create({
        target_id: payload.target_id,
        target_type: payload.target_type,
        target_owner_email: payload.target_owner_email,
        actor_email: actorEmail,
        actor_name: payload.actor_name || 'Aluno',
        reaction: payload.reaction,
      });
      return { data: { success: true, record } };
    }

    if (action === 'reply') {
      const handler = createLocalEntityHandler('Notification');
      const record = await handler.create({
        recipient_email: payload.target_owner_email,
        sender_email: actorEmail,
        sender_name: payload.actor_name || 'Aluno',
        type: 'wall_reply',
        title: 'Resposta no Mural',
        message: payload.reply_text || payload.message || '',
        target_id: payload.target_id,
      });
      return { data: { success: true, record } };
    }

    if (action === 'adminDeleteMessage') {
      const handler = createLocalEntityHandler('ChatMessage');
      await handler.delete(payload.message_id);
      return { data: { success: true } };
    }

    if (action === 'adminPinMessage' || action === 'adminUnpinMessage') {
      const handler = createLocalEntityHandler('ChatMessage');
      const isPinned = action === 'adminPinMessage';
      const record = await handler.update(payload.message_id, {
        is_pinned: isPinned,
      });
      return { data: { success: true, record } };
    }

    if (action === 'publish') {
      const handler = createLocalEntityHandler('Achievement');
      const record = await handler.create({
        student_email: actorEmail,
        student_name: payload.actor_name || payload.student_name || 'Aluno',
        course: activeCourse,
        kind: payload.kind || 'achievement',
        title: payload.title || '',
        message: payload.message || payload.content || '',
        occurred_at: nowBRT(),
      });
      return { data: { success: true, record } };
    }

    return { data: { success: true } };
  }

  if (name === 'saveStudentRecord') {
    const action = payload?.action;

    if (action === 'listChatMessages') {
      const sessionId = payload?.session_id;
      const allMsgs = getCollection('ChatMessage');
      const filtered = allMsgs.filter((m) => {
        if (!sessionId) return true;
        if (m.session_id === sessionId) return true;
        if (
          sessionId.startsWith('class_chat_') &&
          (m.session_id === 'class_chat' || m.session_id === sessionId)
        )
          return true;
        return false;
      });
      return { data: { records: filtered } };
    }

    if (action === 'setPresence') {
      const codeId = payload?.code_id;
      if (codeId) {
        const handler = createLocalEntityHandler('AccessCode');
        await handler.update(codeId, { last_seen: nowBRT() });
      }
      return { data: { ok: true } };
    }

    if (action === 'certificateSearch') {
      const code = String(payload?.verification_code || '')
        .trim()
        .toUpperCase();
      const certs = getCollection('CertificateRecord');
      const record =
        certs.find(
          (c) => String(c.verification_code || '').trim().toUpperCase() === code
        ) || null;
      return { data: { record } };
    }

    if (action === 'certificateUpsert') {
      const certData = payload?.data || {};
      const handler = createLocalEntityHandler('CertificateRecord');
      const certs = getCollection('CertificateRecord');
      const existing = certs.find(
        (c) =>
          c.verification_code &&
          c.verification_code === certData.verification_code
      );
      const record = existing
        ? await handler.update(existing.id, certData)
        : await handler.create(certData);
      return { data: { record } };
    }

    if (action === 'lessonProgressUpsert') {
      const lessonId = String(payload?.lesson_id || '').trim();
      const studentEmail = String(payload?.student_email || '')
        .toLowerCase()
        .trim();
      const studentName = payload?.student_name || 'Aluno';
      const watchedAt = payload?.watched_at || nowBRT();

      const handler = createLocalEntityHandler('LessonProgress');
      const allProgress = getCollection('LessonProgress');
      const existing = allProgress.find(
        (p) =>
          String(p.student_email || '').toLowerCase().trim() === studentEmail &&
          p.lesson_id === lessonId
      );

      let record;
      const alreadyCounted = Boolean(existing?.watched);
      if (existing) {
        record = await handler.update(existing.id, {
          watched: true,
          watched_at: existing.watched_at || watchedAt,
          progress_percent: 100,
        });
      } else {
        record = await handler.create({
          student_email: studentEmail,
          student_name: studentName,
          lesson_id: lessonId,
          watched: true,
          watched_at: watchedAt,
          progress_percent: 100,
        });
      }

      if (!alreadyCounted && studentEmail && lessonId) {
        const isBook = lessonId.startsWith('book__') || lessonId.startsWith('apostila:');
        addPointsToStudent({
          studentEmail,
          pointsDelta: 5,
          category: isBook ? 'book_lesson' : 'lesson',
          title: isBook ? `Leitura da apostila (${lessonId})` : `Aula assistida (${lessonId})`,
          sourceId: lessonId,
        });
      }

      return { data: { record, alreadyCounted } };
    }

    if (action === 'creditOfensiva') {
      let pointsEarned = Number(payload?.points_earned || 0);
      let challengeId = payload?.challenge_id || `ofensiva_${getTodayDateBRT()}`;
      let studentEmail = String(payload?.student_email || '')
        .toLowerCase()
        .trim();
      const codeId = payload?.code_id;

      if (payload?.response_id) {
        const responses = getCollection('DailyChallengeResponse');
        const resp = responses.find((r) => r.id === payload.response_id);
        if (resp) {
          studentEmail =
            studentEmail ||
            String(resp.student_email || '').toLowerCase().trim();
          const ansCount = Array.isArray(resp.answers)
            ? resp.answers.length
            : Number(resp.questions_answered || 0);
          challengeId = `${resp.challenge_id || resp.date}_q${ansCount}`;
          const lastQ = Array.isArray(resp.answers)
            ? resp.answers[resp.answers.length - 1]?.question_id
            : null;
          const isChest = lastQ === 'q3' || lastQ === 'q6';
          pointsEarned = pointsEarned || (isChest ? 0.2 : 0.1);
        }
      }

      const newTotal = addPointsToStudent({
        studentEmail,
        codeId,
        pointsDelta: pointsEarned,
        category: 'daily_challenge',
        title: `Ofensiva Diária (${getTodayDateBRT()})`,
        sourceId: String(challengeId),
      });

      return { data: { ok: true, newTotal } };
    }

    if (action === 'updateForumReplyCount') {
      const postId = payload?.post_id;
      const repliesCount = Number(payload?.replies_count || 0);
      const handler = createLocalEntityHandler('ForumPost');
      const record = postId
        ? await handler.update(postId, { replies_count: repliesCount })
        : null;
      return { data: { record } };
    }

    if (action === 'list' && payload?.entity) {
      const handler = createLocalEntityHandler(payload.entity);
      const sort = payload?.sort || '-created_date';
      const limit = Math.min(Number(payload?.limit) || 200, 1000);
      const query =
        payload?.query && typeof payload.query === 'object' ? payload.query : null;
      const records = query
        ? await handler.filter(query, sort, limit)
        : await handler.list(sort, limit);
      return { data: { records, success: true } };
    }

    if (action === 'update' && payload?.entity && payload?.id) {
      const handler = createLocalEntityHandler(payload.entity);
      const record = await handler.update(payload.id, payload.data || {});
      return { data: { record, success: true } };
    }

    if (action === 'delete' && payload?.entity && payload?.id) {
      const handler = createLocalEntityHandler(payload.entity);
      await handler.delete(payload.id);
      return { data: { ok: true, success: true } };
    }

    if (action === 'create' && payload?.entity) {
      const handler = createLocalEntityHandler(payload.entity);
      const data = payload.data || {};
      const rec = await handler.create(data);

      const studentEmail = String(
        data.student_email || data.author_email || ''
      )
        .toLowerCase()
        .trim();
      if (payload.entity === 'ForumPost' && studentEmail) {
        addPointsToStudent({
          studentEmail,
          pointsDelta: 2,
          category: 'forum_post',
          title: `Tópico na Sala de Debates: ${data.title || ''}`,
          sourceId: rec.id,
        });
      } else if (payload.entity === 'ForumReply' && studentEmail) {
        addPointsToStudent({
          studentEmail,
          pointsDelta: 1,
          category: 'forum_reply',
          title: 'Resposta na Sala de Debates',
          sourceId: rec.id,
        });
      } else if (payload.entity === 'TaskSubmission' && studentEmail) {
        addPointsToStudent({
          studentEmail,
          pointsDelta: 5,
          category: 'task',
          title: `Entrega de Tarefa (${data.task_title || data.task_id || ''})`,
          sourceId: data.task_id || rec.id,
        });
      }

      return { data: { record: rec, success: true } };
    }

    return { data: { success: true } };
  }

  return { data: { success: true } };
}

export function restoreSeedStudents(force = false) {
  const adminKey = getMasterAdminKey();
  const adminEmail = getAdminGoogleEmail();
  const adminCodeRecord = {
    id: 'admin_code_master',
    code: adminKey,
    student_name: 'Professor William',
    student_email: adminEmail,
    profile_category: 'admin',
    is_active: true,
    course: 'tcc',
    created_date: nowBRT(),
  };

  if (force) {
    const cleanProfiles = SEED_STUDENT_PROFILES.filter(
      (p) => !isOlwOrDeletedStudent(p)
    ).map((p) => ({
      ...p,
      photo_url: sanitizePhotoUrl(p.photo_url),
      study_mode: 'diploma',
    }));
    const cleanCodes = [
      adminCodeRecord,
      ...SEED_STUDENT_ACCESS_CODES.map((c) => ({
        ...c,
        profile_photo_url: sanitizePhotoUrl(c.profile_photo_url),
        study_mode: 'diploma',
      })),
    ].filter((c) => !isOlwOrDeletedStudent(c));
    saveCollection('StudentProfile', cleanProfiles);
    saveCollection('AccessCode', cleanCodes);
    purgeDeletedAndOlwStudents();
    return { success: true, count: cleanProfiles.length };
  }

  const existingProfiles = getCollection('StudentProfile').filter(
    (p) => !isOlwOrDeletedStudent(p)
  );
  const existingCodes = getCollection('AccessCode').filter(
    (c) => !isOlwOrDeletedStudent(c)
  );
  return {
    success: true,
    count: existingProfiles.length,
    codesCount: existingCodes.length,
  };
}

// Start daily Ofensiva automation on module load
startDailyOfensivaAutomation({
  getCollection,
  createRecord: (entity, data) => {
    const items = getCollection(entity);
    const rec = {
      ...data,
      id:
        data.id ||
        `dc_${data.date || getTodayDateBRT()}_${data.course || 'tcc'}_m${data.module_number || 1}`,
      created_date: nowBRT(),
      updated_date: nowBRT(),
    };
    items.unshift(rec);
    saveCollection(entity, items);
    return rec;
  },
  updateRecord: (entity, id, patch) => {
    const items = getCollection(entity);
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...patch, updated_date: nowBRT() };
    saveCollection(entity, items);
    return items[idx];
  },
});
