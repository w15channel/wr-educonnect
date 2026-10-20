// Distribui as atividades "de janela" (debates e ofensivas) entre os módulos
// em ordem: cada registro conta para um único módulo — o primeiro que ainda
// precisa dele e que já estava aberto quando foi feito. Assim uma atividade
// feita com atraso continua valendo e o aluno nunca repete etapas já cumpridas.

const norm = (value) => String(value || '').trim().toLowerCase();
const time = (value) => { const t = new Date(value).getTime(); return Number.isFinite(t) ? t : 0; };

export function allocateWindowActivities({ moduleCount, identities, unlockDateByModule, debatePosts, debateReplies, challengeResponses, course }) {
  const mine = (email) => identities.has(norm(email));
  const myPosts = debatePosts.filter((p) => mine(p.author_email)).sort((a, b) => time(a.created_date) - time(b.created_date));
  const otherPosts = debatePosts.filter((p) => !mine(p.author_email));
  const otherIds = new Set(otherPosts.map((p) => p.id));
  const myReplies = debateReplies.filter((r) => mine(r.author_email) && otherIds.has(r.post_id)).sort((a, b) => time(a.created_date) - time(b.created_date));
  const days = [...new Set(challengeResponses.filter((r) => mine(r.student_email) && (r.course || 'tcc') === course).map((r) => r.date).filter(Boolean))].sort();

  const usedPosts = new Set(); const usedReplies = new Set(); const usedDays = new Set();
  const take = (list, used, key, start, count) => {
    const picked = list.filter((item) => !used.has(key(item)) && (!start || time(item.created_date ?? `${item}T23:59:59`) >= time(start))).slice(0, count);
    picked.forEach((item) => used.add(key(item)));
    return picked;
  };

  const result = new Map();
  for (let n = 1; n <= moduleCount; n += 1) {
    const start = unlockDateByModule.get(n) || null;
    const posts = take(myPosts, usedPosts, (p) => p.id, start, 1);
    const replies = take(myReplies, usedReplies, (r) => r.id, start, 1);
    const ofensiva = take(days, usedDays, (d) => d, start, 3);
    result.set(n, { posts, replies, days: ofensiva });
  }
  return { result, otherPosts };
}