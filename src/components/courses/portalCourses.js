import { Brain, HeartHandshake, Heart, House } from 'lucide-react';

// Courses remain unpublished for students while staff prepares their content.
export function canPrepareCourses(session) {
  return session?.role === 'admin'
    || session?.codeId === '6a8efa310faf6bfd6c2954a7'
    || session?.profileCategory === 'teacher'
    || (session?.role === 'teacher' && !session?.profileCategory);
}
export const PORTAL_COURSES = [
  { id: 'tcc', title: 'TC — Terapia Comportamental', qualification: 'Formação de Terapeuta em TC', description: 'Estude o comportamento humano e suas aplicações na prática clínica, com apostila, atividades e provas.', icon: Brain, theme: 'course-tcc', available: true, video: 'https://media.base44.com/videos/public/69f55577840a3c93cee191be/9adbe6196_generated_video.mp4' },
  { id: 'aconselhamento-familiar', title: 'Aconselhamento Familiar', qualification: 'Formação Profissional em Aconselhamento Familiar', description: 'Uma formação voltada ao acolhimento das famílias, à comunicação e ao fortalecimento dos vínculos familiares.', icon: House, theme: 'course-family', available: false, video: 'https://media.base44.com/videos/public/69f55577840a3c93cee191be/ada8c7d22_Aconselhamento_Familiar.mp4' },
  { id: 'psicanalise', title: 'Psicanálise', qualification: 'Formação em Psicanálise', description: 'Um percurso de aprofundamento na escuta, no inconsciente e na compreensão da experiência humana.', icon: HeartHandshake, theme: 'course-analysis', available: false, video: 'https://media.base44.com/videos/public/69f55577840a3c93cee191be/8e0642354_Psicanlise.mp4' },
  { id: 'sexologia', title: 'Sexologia', qualification: 'Formação em Sexologia', description: 'Um olhar integrativo sobre a sexualidade humana, os relacionamentos e o cuidado com as pessoas.', icon: Heart, theme: 'course-sexology', available: false, video: 'https://media.base44.com/videos/public/69f55577840a3c93cee191be/415d9738a_Sexologia.mp4' },
];

export function portalStudyPath(session) {
  return session?.role === 'admin' ? '/adm' : session?.study_mode === 'interativa' ? '/student' : '/degree/student';
}
