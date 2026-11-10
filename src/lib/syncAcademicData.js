import { buildVerifiedChecklist, normalizeIdentity } from '../../base44/shared/checklistVerification.ts';
import { roundScore, capScore, isOfensivaScoreItem, isTherapistScoreItem } from './scoreUtils.js';

const STUDY_POINTS = { lesson: 2, task: 5, quiz: 50, exam: 50 };
const THERAPIST_POINTS = 10;
const MENTORSHIP_POINTS = 2;

function scoreKey(studentEmail, category, refId) {
  return `${studentEmail}|${category}|${refId}`;
}

export async function runReconcileChecklists(store, { adminEmail = '', allStudents = true } = {}) {
  const codes = await store.AccessCode.list('-created_date', 500);
  const profiles = await store.StudentProfile.list('-updated_date', 500);

  // Monta lista única de estudantes com seus aliases
  const roster = codes
    .filter(c => c.is_active !== false && (!c.profile_category || c.profile_category === 'student'))
    .map(code => {
      const linked = profiles.filter(p =>
        p.code_id === code.id ||
        (!p.code_id && normalizeIdentity(p.student_email) === normalizeIdentity(code.student_email || code.code))
      );
      const aliases = [...new Set([
        code.student_email,
        code.code,
        ...linked.flatMap(p => [p.student_email, p.email])
      ].map(normalizeIdentity).filter(Boolean))];

      return {
        key: `code:${code.id}`,
        code_id: code.id,
        email: code.student_email || code.code,
        course: code.course || 'tcc',
        aliases
      };
    });

  for (const profile of profiles) {
    if (profile.code_id || !profile.student_email) continue;
    const norm = normalizeIdentity(profile.student_email);
    if (codes.some(c => normalizeIdentity(c.student_email || c.code) === norm)) continue;
    const course = profile.dashboard_course || 'tcc';
    if (!roster.some(s => s.course === course && s.aliases.includes(norm))) {
      roster.push({
        key: `profile:${profile.id}`,
        email: profile.student_email,
        course,
        aliases: [norm]
      });
    }
  }

  // Prepara as fontes de dados para a auditoria
  const [
    tasks,
    exams,
    forumPosts,
    forumReplies,
    dailyChallenges,
    dailyResponses,
    moduleSchedules,
    lessonProgresses,
    taskSubmissions,
    examSubmissions,
    moduleUnlocks,
  ] = await Promise.all([
    store.Task.list('-created_date', 1000),
    store.Exam.list('-created_date', 500),
    store.ForumPost.list('-created_date', 1000),
    store.ForumReply.list('-created_date', 2000),
    store.DailyChallenge.list('-created_date', 500),
    store.DailyChallengeResponse.list('-created_date', 2000),
    store.ModuleReleaseSchedule.list('module_number', 50),
    store.LessonProgress.list('-created_date', 2000),
    store.TaskSubmission.list('-created_date', 2000),
    store.ExamSubmission.list('-submitted_at', 500),
    store.StudentModuleUnlock.list('-unlocked_at', 500),
  ]);

  const data = {
    Task: tasks,
    Exam: exams,
    ForumPost: forumPosts,
    ForumReply: forumReplies,
    DailyChallenge: dailyChallenges,
    DailyChallengeResponse: dailyResponses,
    ModuleReleaseSchedule: moduleSchedules,
    LessonProgress: lessonProgresses,
    TaskSubmission: taskSubmissions,
    ExamSubmission: examSubmissions,
    StudentModuleUnlock: moduleUnlocks,
  };

  const now = new Date().toISOString();
  let completedItems = 0;
  let newlyRecognizedItems = 0;
  let created = 0;
  let refreshed = 0;

  const existingVerifications = await store.ChecklistVerification.list('-verified_at', 500);
  const existingMap = new Map();
  existingVerifications.forEach(v => {
    const k = `${v.student_key || v.student_email}|${v.course || 'tcc'}`;
    existingMap.set(k, v);
  });

  for (const student of roster) {
    if (!student.aliases.length) continue;
    const result = buildVerifiedChecklist(student, data, now);
    const prevKey = `${student.key}|${student.course}`;
    const prevEmailKey = `${student.email}|${student.course}`;
    const previous = existingMap.get(prevKey) || existingMap.get(prevEmailKey);

    for (const mod of result.modules) {
      const oldMod = previous?.modules?.find(m => m.moduleNumber === mod.moduleNumber);
      for (const it of mod.items.filter(i => i.done)) {
        completedItems++;
        if (!oldMod?.items?.some(i => i.key === it.key && i.done)) {
          newlyRecognizedItems++;
        }
      }
    }

    if (previous) {
      await store.ChecklistVerification.update(previous.id, {
        ...result,
        updated_date: now
      });
      refreshed++;
    } else {
      await store.ChecklistVerification.create({
        ...result,
        created_date: now,
        updated_date: now
      });
      created++;
    }
  }

  return {
    success: true,
    checked: roster.length,
    completed_items: completedItems,
    newly_recognized_items: newlyRecognizedItems,
    created,
    refreshed,
    has_more: false,
    verified_at: now
  };
}

export async function runRecalculateScores(store, { adminEmail = '' } = {}) {
  const [
    accessCodes,
    lessons,
    progresses,
    tasks,
    submissions,
    exams,
    examSubmissions,
    forumPosts,
    forumReplies,
    pairings,
    challengeResponses,
    mentorships,
    existingScoreItems,
    studentProfiles,
  ] = await Promise.all([
    store.AccessCode.list('-created_date', 500),
    store.RecordedLesson.list('order', 500),
    store.LessonProgress.list('-created_date', 2000),
    store.Task.list('-created_date', 500),
    store.TaskSubmission.list('-created_date', 2000),
    store.Exam.list('-created_date', 200),
    store.ExamSubmission.list('-submitted_at', 500),
    store.ForumPost.list('-created_date', 1000),
    store.ForumReply.list('-created_date', 2000),
    store.TherapistPairing.list('-pairing_date', 500),
    store.DailyChallengeResponse.list('-created_date', 2000),
    store.Mentorship.list('-date', 200),
    store.ScoreItem.list('-created_date', 10000),
    store.StudentProfile.list('-updated_date', 500),
  ]);

  const existingMap = new Map();
  for (const item of existingScoreItems) {
    if (item.student_email && item.category && item.ref_id) {
      const k = scoreKey(item.student_email, item.category, item.ref_id);
      existingMap.set(k, item);
    }
  }

  const lessonMap = new Map(lessons.map(l => [l.id, l]));
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const examMap = new Map(exams.map(e => [e.id, e]));
  const postMap = new Map(forumPosts.map(p => [p.id, p]));

  let createdScores = 0;
  let updatedScores = 0;
  const now = new Date().toISOString();
  const todayStr = now.split('T')[0];

  // 0. Auto-geração do Desafio da Ofensiva Diária
  const dailyChallenges = await store.DailyChallenge.list('-created_date', 500);
  if (!dailyChallenges.some(c => c.date === todayStr)) {
    await store.DailyChallenge.create({
      date: todayStr,
      course: 'tcc',
      title: `Ofensiva Prática — ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}`,
      question: 'Descreva como você aplicaria o modelo de reestruturação cognitiva e modulação vetorial para um paciente em crise de ansiedade.',
      points: 5,
      created_date: now
    });
  }

  // 0.1 Auto-correção e feedback para Tarefas pendentes
  const taskMapTemp = new Map(tasks.map(t => [t.id, t]));
  for (const sub of submissions) {
    if (sub.status === 'submitted' || sub.status === 'pending' || sub.grade == null) {
      const task = taskMapTemp.get(sub.task_id);
      const isQuiz = task?.type === 'quiz';
      const maxPts = isQuiz ? STUDY_POINTS.quiz : STUDY_POINTS.task;
      const targetGrade = sub.grade !== undefined && sub.grade !== null && sub.grade !== '' ? sub.grade : maxPts;
      await store.TaskSubmission.update(sub.id, {
        status: 'graded',
        grade: targetGrade,
        feedback: sub.feedback || 'Excelente aplicação técnica! Atividade corrigida e pontuada pelo Professor William Ribeiro.',
        graded_at: now
      });
      sub.status = 'graded';
      sub.grade = targetGrade;
    }
  }

  // 0.2 Auto-correção e aprovação de Provas pendentes
  for (const examSub of examSubmissions) {
    if (examSub.status === 'submitted' || examSub.status === 'pending' || examSub.grade == null) {
      const targetGrade = examSub.grade !== undefined && examSub.grade !== null && examSub.grade !== '' ? examSub.grade : 10.0;
      await store.ExamSubmission.update(examSub.id, {
        status: 'graded',
        grade: targetGrade,
        feedback: examSub.feedback || 'Prova de módulo avaliada com êxito! Requisitos teóricos e práticos preenchidos.',
        graded_at: now
      });
      examSub.status = 'graded';
      examSub.grade = targetGrade;
    }
  }

  // 0.3 Auto-pontuação de Ofensivas Diárias respondidas
  for (const resp of challengeResponses) {
    if (!resp.points_earned) {
      await store.DailyChallengeResponse.update(resp.id, {
        points_earned: 5,
        feedback: resp.feedback || 'Ofensiva diária validada! Pontos somados ao perfil acadêmico.',
        evaluated_at: now
      });
      resp.points_earned = 5;
    }
  }

  // 0.4 Liberação automática de módulos e provas para alunos ativos
  const existingUnlocks = await store.StudentModuleUnlock.list('-unlocked_at', 500);
  const unlockMap = new Set(existingUnlocks.map(u => `${(u.student_email || '').toLowerCase()}|${u.module_number}`));
  for (const code of accessCodes) {
    const email = (code.student_email || '').toLowerCase();
    if (!email) continue;
    for (let m = 1; m <= 10; m++) {
      const k = `${email}|${m}`;
      if (!unlockMap.has(k)) {
        await store.StudentModuleUnlock.create({
          student_email: code.student_email,
          module_number: m,
          unlocked_at: now,
          unlocked_by: 'academic_automation'
        });
        unlockMap.add(k);
      }
    }
  }

  // Helper para salvar ou atualizar item de pontuação
  const syncScoreItem = async ({ studentEmail, category, refId, refTitle, score, maxScore, notes, moduleNumber }) => {
    if (!studentEmail || !refId) return;
    const normScore = roundScore(score);
    const normMax = roundScore(maxScore || score);
    const k = scoreKey(studentEmail, category, refId);
    const existing = existingMap.get(k);

    const data = {
      student_email: studentEmail,
      category,
      ref_id: refId,
      ref_title: refTitle || '',
      score: normScore,
      max_score: normMax,
      verified: true,
      notes: notes || '',
      ...(Number(moduleNumber) ? { module_number: Number(moduleNumber) } : {})
    };

    if (existing) {
      const changed =
        roundScore(existing.score) !== normScore ||
        existing.verified !== true ||
        (Number(moduleNumber) && Number(existing.module_number) !== Number(moduleNumber));

      if (changed) {
        await store.ScoreItem.update(existing.id, data);
        updatedScores++;
      }
    } else {
      const created = await store.ScoreItem.create(data);
      existingMap.set(k, created);
      createdScores++;
    }
  };

  // 1. Aulas assistidas (+2 pts)
  for (const prog of progresses) {
    if (prog.watched && prog.student_email && lessonMap.has(prog.lesson_id)) {
      const lesson = lessonMap.get(prog.lesson_id);
      await syncScoreItem({
        studentEmail: prog.student_email,
        category: 'lesson',
        refId: prog.lesson_id,
        refTitle: lesson?.title || 'Aula Gravada',
        score: STUDY_POINTS.lesson,
        maxScore: STUDY_POINTS.lesson,
        notes: 'Aula assistida e concluída na plataforma.',
        moduleNumber: lesson?.module_number
      });
    }
  }

  // 2. Tarefas entregues (+5 pts)
  for (const sub of submissions) {
    if (sub.student_email && taskMap.has(sub.task_id) && ['submitted', 'graded'].includes(sub.status)) {
      const task = taskMap.get(sub.task_id);
      const isQuiz = task?.type === 'quiz';
      const pts = isQuiz ? STUDY_POINTS.quiz : STUDY_POINTS.task;
      await syncScoreItem({
        studentEmail: sub.student_email,
        category: isQuiz ? 'quiz' : 'task',
        refId: sub.task_id,
        refTitle: task?.title || 'Tarefa',
        score: sub.grade !== undefined && sub.grade !== null && sub.grade !== '' ? roundScore(sub.grade) : pts,
        maxScore: pts,
        notes: sub.feedback || 'Tarefa entregue e validada.',
        moduleNumber: task?.module_number
      });
    }
  }

  // 3. Provas realizadas (+50 pts)
  for (const examSub of examSubmissions) {
    if (examSub.student_email && examMap.has(examSub.exam_id)) {
      const exam = examMap.get(examSub.exam_id);
      const pts = STUDY_POINTS.exam;
      const refId = `exam:${examSub.exam_id}`;
      await syncScoreItem({
        studentEmail: examSub.student_email,
        category: 'exam',
        refId,
        refTitle: exam?.title || 'Prova de Módulo',
        score: examSub.grade !== undefined && examSub.grade !== null && examSub.grade !== '' ? roundScore(examSub.grade) : pts,
        maxScore: pts,
        notes: examSub.feedback || 'Prova do módulo concluída com aproveitamento.',
        moduleNumber: exam?.module_ref?.match(/\d+/)?.[0]
      });
    }
  }

  // 4. Fórum e Debates (+0.1 pts)
  for (const post of forumPosts) {
    if (post.author_email) {
      await syncScoreItem({
        studentEmail: post.author_email,
        category: 'forum',
        refId: post.id,
        refTitle: post.topic || 'Tópico de Debate',
        score: 0.1,
        maxScore: 0.1,
        notes: 'Participação com criação de tópico nos debates.'
      });
    }
  }

  for (const reply of forumReplies) {
    if (reply.author_email && postMap.has(reply.post_id)) {
      const parent = postMap.get(reply.post_id);
      if (parent.author_email !== reply.author_email) {
        await syncScoreItem({
          studentEmail: reply.author_email,
          category: 'forum',
          refId: reply.id,
          refTitle: `Comentário em: ${parent.topic || 'Debate'}`,
          score: 0.1,
          maxScore: 0.1,
          notes: 'Comentário colaborativo no fórum de debates.'
        });
      }
    }
  }

  // 5. Terapeuta da Semana (+10 pts)
  for (const pairing of pairings) {
    if (pairing.therapist_email && pairing.therapist_submitted) {
      await syncScoreItem({
        studentEmail: pairing.therapist_email,
        category: 'therapist',
        refId: `therapist_pairing:${pairing.id}:therapist`,
        refTitle: 'Atendimento Prático — Terapeuta',
        score: THERAPIST_POINTS,
        maxScore: THERAPIST_POINTS,
        notes: 'Sessão como terapeuta devidamente relatada e validada.',
        moduleNumber: pairing.module_number
      });
    }
    if (pairing.patient_email && pairing.patient_submitted) {
      await syncScoreItem({
        studentEmail: pairing.patient_email,
        category: 'therapist',
        refId: `therapist_pairing:${pairing.id}:patient`,
        refTitle: 'Atendimento Prático — Paciente',
        score: THERAPIST_POINTS,
        maxScore: THERAPIST_POINTS,
        notes: 'Participação como paciente relatada e confirmada.',
        moduleNumber: pairing.module_number
      });
    }
  }

  // 6. Ofensiva Diária (pontos da ofensiva)
  for (const resp of challengeResponses) {
    if (resp.student_email && resp.points_earned) {
      await syncScoreItem({
        studentEmail: resp.student_email,
        category: 'ofensiva',
        refId: `ofensiva:${resp.id || resp.challenge_id || resp.date}`,
        refTitle: `Ofensiva Diária (${resp.date || 'Desafio'})`,
        score: roundScore(resp.points_earned),
        maxScore: roundScore(resp.points_earned),
        notes: 'Desafio diário da ofensiva concluído.'
      });
    }
  }

  // 7. Mentorias (+2 pts)
  for (const m of mentorships) {
    for (const email of (m.participant_emails || [])) {
      if (email) {
        await syncScoreItem({
          studentEmail: email,
          category: 'mentorship',
          refId: `mentorship:${m.id}`,
          refTitle: m.theme || 'Mentoria ao Vivo',
          score: MENTORSHIP_POINTS,
          maxScore: MENTORSHIP_POINTS,
          notes: 'Presença confirmada na mentoria temática.',
          moduleNumber: m.module_number
        });
      }
    }
  }

  // 8. Totalização por aluno em StudentProfile e AccessCode
  const allUpdatedItems = await store.ScoreItem.list('-created_date', 10000);
  const itemsByStudent = new Map();
  for (const item of allUpdatedItems) {
    if (!item.student_email || !item.verified) continue;
    const email = item.student_email.toLowerCase();
    if (!itemsByStudent.has(email)) itemsByStudent.set(email, []);
    itemsByStudent.get(email).push(item);
  }

  let profilesUpdated = 0;
  for (const code of accessCodes) {
    const email = (code.student_email || '').toLowerCase();
    if (!email) continue;
    const items = itemsByStudent.get(email) || [];

    const studyScore = roundScore(
      items
        .filter(i => ['lesson', 'task', 'quiz', 'exam'].includes(i.category))
        .reduce((sum, i) => sum + (Number(i.score) || 0), 0)
    );

    const totalRaw = roundScore(
      items.reduce((sum, i) => sum + (Number(i.score) || 0), 0)
    );
    const totalScore = capScore(totalRaw);

    // Atualiza AccessCode
    await store.AccessCode.update(code.id, {
      pontuacao_total: totalScore,
      pontuacao_estudos: studyScore
    });

    // Atualiza ou cria StudentProfile correspondente
    const profile = studentProfiles.find(p => (p.student_email || '').toLowerCase() === email);
    if (profile) {
      await store.StudentProfile.update(profile.id, {
        points: totalScore,
        pontuacao_total: totalScore,
        pontuacao_estudos: studyScore,
        updated_date: now
      });
      profilesUpdated++;
    } else {
      await store.StudentProfile.create({
        student_email: code.student_email,
        full_name: code.profile_name || code.student_name || email,
        points: totalScore,
        pontuacao_total: totalScore,
        pontuacao_estudos: studyScore,
        dashboard_course: code.course || 'tcc',
        code_id: code.id,
        created_date: now,
        updated_date: now
      });
      profilesUpdated++;
    }
  }

  return {
    success: true,
    createdScores,
    updatedScores,
    profilesUpdated
  };
}
