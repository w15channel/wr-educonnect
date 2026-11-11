import { Brain, HeartHandshake, Heart, House } from 'lucide-react';

// Preview-only courses never change the session or load academic records.
export const PORTAL_COURSES = [
  { id: 'tcc', title: 'Terapia Comportamental', qualification: 'Formação de Terapeuta em TC', description: 'Estude o comportamento humano e suas aplicações na prática clínica, com apostila, atividades e provas.', icon: Brain, theme: 'course-tcc', available: true, video: 'https://media.base44.com/videos/public/69f55577840a3c93cee191be/9adbe6196_generated_video.mp4' },
  { id: 'aconselhamento-familiar', title: 'Aconselhamento Familiar', qualification: 'Formação Profissional em Aconselhamento Familiar', description: 'Uma formação voltada ao acolhimento das famílias, à comunicação e ao fortalecimento dos vínculos familiares.', icon: House, theme: 'course-family', available: false },
  { id: 'psicanalise', title: 'Psicanálise', qualification: 'Formação em Psicanálise', description: 'Um percurso de aprofundamento na escuta, no inconsciente e na compreensão da experiência humana.', icon: HeartHandshake, theme: 'course-analysis', available: false },
  { id: 'sexologia', title: 'Sexologia', qualification: 'Formação em Sexologia', description: 'Um olhar integrativo sobre a sexualidade humana, os relacionamentos e o cuidado com as pessoas.', icon: Heart, theme: 'course-sexology', available: false },
];

export function portalStudyPath(session) {
  return session?.role === 'admin' ? '/adm' : session?.study_mode === 'interativa' ? '/student' : '/degree/student';
}