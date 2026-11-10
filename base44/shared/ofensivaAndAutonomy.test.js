import { describe, it, expect } from 'vitest';
import {
  buildDailyChallengeData,
  runCreateDailyChallenge,
  getTodayDateBRT,
  AUTOMATION_SCHEDULE_LABEL,
} from '../../src/lib/ofensivaEngine.js';
import {
  getCollection,
  invokeLocalFunction,
} from '../../src/lib/localBase44Storage.js';
import {
  GEMINI_READER_VOICE,
  normalizeSpeechText,
} from '../../src/lib/base44Voice.js';

describe('Autonomia, Ofensivas e Voz Gemini Eclipse', () => {
  it('Gemini reader voice is configured to Eclipse and normalizes HTML text', () => {
    expect(GEMINI_READER_VOICE).toBe('Eclipse');
    const cleaned = normalizeSpeechText('<p>Olá, <strong>terapeuta</strong>!   Bem-vindo.</p>');
    expect(cleaned).toBe('Olá, terapeuta ! Bem-vindo.');
  });

  it('buildDailyChallengeData generates 8 thematic trail questions with hints', () => {
    const challenge = buildDailyChallengeData({
      course: 'tcc',
      moduleNumber: 1,
      date: '2026-05-10',
    });
    expect(challenge.course).toBe('tcc');
    expect(challenge.module_number).toBe(1);
    expect(challenge.date).toBe('2026-05-10');
    expect(challenge.generated_by).toBe(AUTOMATION_SCHEDULE_LABEL);
    expect(Array.isArray(challenge.questions)).toBe(true);
    expect(challenge.questions.length).toBe(8);
    expect(challenge.questions.map((q) => q.id)).toEqual(
      ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8']
    );
    for (const q of challenge.questions) {
      expect(q.text && q.text.length > 20).toBeTruthy();
      expect(q.hint && q.hint.length > 10).toBeTruthy();
    }
  });

  it('runCreateDailyChallenge supports multi-day period generation and daily automation', () => {
    const store = [];
    const res = runCreateDailyChallenge({
      getCollection: () => store,
      createRecord: (_entity, data) => {
        const rec = { ...data, id: `dc_${store.length + 1}` };
        store.push(rec);
        return rec;
      },
      updateRecord: (_entity, id, patch) => {
        const idx = store.findIndex((i) => i.id === id);
        store[idx] = { ...store[idx], ...patch };
        return store[idx];
      },
      payload: {
        course: 'tcc',
        module_id: 'mod2',
        lesson_id: 'mod2-a1',
        duration_days: 3,
        date: '2026-05-10',
      },
    });
    expect(res.success).toBe(true);
    expect(res.created).toBe(3);
    expect(store.length).toBe(3);
    expect(store[0].module_number).toBe(2);
  });

  it('localBase44Storage defaults students to simplified study_mode (diploma) and persists interaction points', async () => {
    const codes = getCollection('AccessCode');
    const firstStudentCode = codes.find((c) => c.profile_category === 'student' && c.is_active !== false);
    expect(firstStudentCode).toBeTruthy();

    const loginRes = await invokeLocalFunction('siteLogin', {
      mode: 'student',
      code: firstStudentCode.code,
    });
    expect(loginRes.data.session.study_mode).toBe('diploma');

    const studentEmail = firstStudentCode.student_email;
    const profilesBefore = getCollection('StudentProfile');
    const profBefore = profilesBefore.find(
      (p) => String(p.student_email || p.email).toLowerCase() === studentEmail.toLowerCase()
    );
    const initialTotal = Number(profBefore?.pontuacao_total ?? profBefore?.points ?? 0);

    const uniqueLessonId = `book__apostila-tcc__mod1__test_${Date.now()}`;
    const upsertRes = await invokeLocalFunction('saveStudentRecord', {
      action: 'lessonProgressUpsert',
      lesson_id: uniqueLessonId,
      student_email: studentEmail,
      student_name: firstStudentCode.student_name,
    });
    expect(upsertRes.data.alreadyCounted).toBe(false);
    expect(upsertRes.data.record.watched).toBe(true);

    const profilesAfter = getCollection('StudentProfile');
    const profAfter = profilesAfter.find(
      (p) => String(p.student_email || p.email).toLowerCase() === studentEmail.toLowerCase()
    );
    const afterTotal = Number(profAfter?.pontuacao_total ?? profAfter?.points ?? 0);
    expect(afterTotal).toBe(initialTotal + 5);

    const today = getTodayDateBRT();
    const challengesToday = getCollection('DailyChallenge').filter(
      (c) => c.date === today && c.course === 'tcc'
    );
    expect(challengesToday.length >= 10).toBe(true);
  });
});
