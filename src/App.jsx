import { Toaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { CustomAuthProvider, useCustomAuth } from '@/lib/CustomAuthContext';
// REQUIRED platform imports — do NOT remove
import { AuthProvider } from '@/lib/AuthContext';

import LandingPage from './pages/LayoutPreview2';
import CourseSyllabus from './pages/CourseSyllabus';
import WRTec from './pages/WRTec';
import CourseLobby from './pages/CourseLobby';
import PoliticaDeTrabalho from './pages/PoliticaDeTrabalho';
import TermosDeUso from './pages/TermosDeUso';
import PoliticaDePrivacidade from './pages/PoliticaDePrivacidade';
import AppLayout from './components/layout/AppLayout';
import DiplomaLayout from './pages/DiplomaLayout';
import DiplomaDashboard from './pages/DiplomaDashboard';
import Dashboard from './pages/Dashboard';
import Lessons from './pages/Lessons';
import LessonAnswers from './pages/LessonAnswers';
import TaskAnswers from './pages/TaskAnswers';
import Tasks from './pages/Tasks';
import Tests from './pages/Tests';
import Support from './pages/Support';
import SalaDebates from './pages/SalaDebates';
import Students from './pages/Students';
import Announcements from './pages/Announcements';
import Profile from './pages/Profile';
import StudyProfile from './pages/StudyProfile';
import Calendar from './pages/Calendar';
import Tuitions from './pages/Tuitions';
import TutorDigital from './pages/TutorDigital';
import ScoreControl from './pages/ScoreControl';
import Certificadora from './pages/Certificadora';
import Monitores from './pages/Monitores';
import TerapeutaDaSemana from './pages/TerapeutaDaSemana';
import Ofensivas from './pages/Ofensivas';
import Apostila from './pages/Apostila';
import Exams from './pages/Exams';
import Checklist from './pages/Checklist';
import ExamReleaseControl from './pages/ExamReleaseControl';
import ExamQuizView from './pages/ExamQuizView';

import MeuBestSeller from './pages/MeuBestSeller';
import ClassChat from './pages/ClassChat';
import HistoricoAcademico from './pages/HistoricoAcademico';
import StudentDetail from './pages/StudentDetail';
import Keys from './pages/Keys';
import TaskQuizView from './pages/TaskQuizView';
import TaskExamBuilder from './pages/TaskExamBuilder';
import DirectMessage from './pages/DirectMessage';
import Classe from './pages/Classe';
import Notifications from './pages/Notifications';
import MonitorCertificate from './pages/MonitorCertificate';
import MeuCertificado from './pages/MeuCertificado';
import AdminCertificateGenerator from './pages/AdminCertificateGenerator';
import AtendimentoSocial from './pages/AtendimentoSocial';
import Practice from './pages/Practice';
import CertificateVerifier from './pages/CertificateVerifier';
import { BRAND_LEGAL_NAME } from '@/lib/brand';

// Guard: admin-only pages redirect non-admins (teacher/student) to their dashboard
function AdminOnly({ children }) {
  const { session } = useCustomAuth();
  if (session?.role !== 'admin') {
    const base = session?.role === 'admin' ? '/adm' : '/student';
    return <Navigate to={`${base}/dashboard`} replace />;
  }
  return children;
}

// All app routes — no courseSlug in URL, course comes from session
function AppRoutesTree() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="lessons" element={<Lessons />} />
        <Route path="lessons/answer" element={<AdminOnly><LessonAnswers /></AdminOnly>} />
        <Route path="live" element={<Navigate to="../apostila" replace />} />
        <Route path="tasks" element={<Tasks mode="tasks" />} />
        <Route path="tasks/answer" element={<AdminOnly><TaskAnswers /></AdminOnly>} />
        <Route path="tests" element={<Tests />} />
        <Route path="exams" element={<Exams />} />
        <Route path="checklist" element={<Checklist />} />
        <Route path="exam-release" element={<AdminOnly><ExamReleaseControl /></AdminOnly>} />
        <Route path="exams/quiz/:id" element={<ExamQuizView />} />
        <Route path="tasks/quiz/:id" element={<TaskQuizView />} />
        <Route path="tasks/builder/:id" element={<TaskExamBuilder />} />
        <Route path="forum" element={<Support />} />
        <Route path="suporte" element={<Support />} />
        <Route path="debates" element={<SalaDebates />} />
        <Route path="chat" element={<ClassChat />} />
        <Route path="students" element={<Students />} />
        <Route path="students/:id" element={<StudentDetail />} />
        <Route path="keys" element={<Keys />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="profile" element={<Profile />} />
        <Route path="study-profile" element={<StudyProfile />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="tuitions" element={<Tuitions />} />
        <Route path="tutor" element={<TutorDigital />} />
        <Route path="scorecontrol" element={<ScoreControl />} />
        <Route path="scorecontrol/detail" element={<ScoreControl />} />
        <Route path="pontuacao-geral" element={<ScoreControl />} />
        <Route path="pontuacao-geral/detail" element={<ScoreControl />} />
        <Route path="scores" element={<Navigate to="../scorecontrol" replace />} />
        <Route path="certificadora" element={<Certificadora />} />
        <Route path="meu-certificado" element={<MeuCertificado />} />
        <Route path="gerar-certificado" element={<AdminOnly><AdminCertificateGenerator /></AdminOnly>} />
        <Route path="monitores" element={<Monitores />} />
        <Route path="monitor-certificate/:id" element={<MonitorCertificate />} />
        <Route path="terapeuta" element={<TerapeutaDaSemana />} />
        <Route path="bestseller" element={<MeuBestSeller />} />
        <Route path="historico" element={<HistoricoAcademico />} />
        <Route path="dm/:email" element={<DirectMessage />} />
        <Route path="classe" element={<Classe />} />
        <Route path="ofensivas" element={<Ofensivas />} />
        <Route path="apostila" element={<Apostila />} />
        <Route path="ring" element={<Notifications />} />
        <Route path="practice" element={<Practice />} />
      </Route>
    </Routes>
  );
}

const AuthenticatedApp = () => {
  const { session, loading, login } = useCustomAuth();
  const location = useLocation();
  const pathname = location.pathname;

  const handleLogin = (redirect) => {
    login();
    if (redirect && window.location.pathname !== '/' + redirect) {
      window.location.href = '/' + redirect;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 app-shell-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#5b5ef4]/30 border-t-[#5b5ef4] rounded-full animate-spin"></div>
          <p className="text-sm text-white/40 font-medium">Carregando {BRAND_LEGAL_NAME}...</p>
        </div>
      </div>
    );
  }

  // Public pages — no auth required
  if (!session) {
    if (pathname === '/politica') return <PoliticaDeTrabalho />;
    if (pathname === '/ementa-cursos') return <CourseSyllabus />;
    if (pathname === '/termos') return <TermosDeUso />;
    if (pathname === '/privacidade') return <PoliticaDePrivacidade />;
    if (pathname === '/wr-tec') return <WRTec />;
    if (pathname === '/atendimento-social') return <AtendimentoSocial />;
    if (pathname === '/validar-certificado') return <CertificateVerifier />;
    return <LandingPage onLogin={handleLogin} />;
  }

  if (pathname === '/lobby') return <CourseLobby />;

  const isAdmin = session.role === 'admin';
  const base = isAdmin ? '/adm' : '/student';

  return (
    <Routes>
      {/* Diploma isolated shell */}
      <Route path="/degree/student/*" element={<DiplomaLayout />}>
        <Route index element={<DiplomaDashboard />} />
        <Route path="dashboard" element={<DiplomaDashboard />} />
        <Route path="lessons" element={<Lessons />} />
        <Route path="tasks" element={<Tasks mode="tasks" />} />
        <Route path="tasks/quiz/:id" element={<TaskQuizView />} />
        <Route path="tuitions" element={<Tuitions />} />
        <Route path="historico" element={<HistoricoAcademico />} />
        <Route path="certificadora" element={<Certificadora />} />
        <Route path="apostila" element={<Apostila />} />
        <Route path="profile" element={<Profile />} />
        <Route path="study-profile" element={<StudyProfile />} />
      </Route>

      {/* Main student routes */}
      <Route path="/student/*" element={<AppRoutesTree />} />

      {/* Main admin routes */}
      <Route path="/adm/*" element={<AppRoutesTree />} />

      {/* Root & legacy redirects → flat paths */}
      <Route path="/" element={<Navigate to={`${base}/dashboard`} replace />} />
      <Route path="/dashboard" element={<Navigate to={`${base}/dashboard`} replace />} />
      <Route path="/lessons" element={<Navigate to={`${base}/lessons`} replace />} />
      <Route path="/live" element={<Navigate to={`${base}/apostila`} replace />} />
      <Route path="/tasks" element={<Navigate to={`${base}/tasks`} replace />} />
      <Route path="/tests" element={<Navigate to={`${base}/exams`} replace />} />
      <Route path="/exams" element={<Navigate to={`${base}/exams`} replace />} />
      <Route path="/exams" element={<Navigate to={`${base}/exams`} replace />} />
      <Route path="/forum" element={<Navigate to={`${base}/forum`} replace />} />
      <Route path="/debates" element={<Navigate to={`${base}/debates`} replace />} />
      <Route path="/chat" element={<Navigate to={`${base}/chat`} replace />} />
      <Route path="/students" element={<Navigate to={`${base}/students`} replace />} />
      <Route path="/keys" element={<Navigate to={`${base}/keys`} replace />} />
      <Route path="/announcements" element={<Navigate to={`${base}/announcements`} replace />} />
      <Route path="/profile" element={<Navigate to={`${base}/profile`} replace />} />
      <Route path="/study-profile" element={<Navigate to={`${base}/study-profile`} replace />} />
      <Route path="/calendar" element={<Navigate to={`${base}/calendar`} replace />} />
      <Route path="/tuitions" element={<Navigate to={`${base}/tuitions`} replace />} />
      <Route path="/tutor" element={<Navigate to={`${base}/tutor`} replace />} />
      <Route path="/scores" element={<Navigate to={`${base}/scorecontrol`} replace />} />
      <Route path="/scorecontrol" element={<Navigate to={`${base}/scorecontrol`} replace />} />
      <Route path="/pontuacao-geral" element={<Navigate to={`${base}/pontuacao-geral`} replace />} />
      <Route path="/certificadora" element={<Navigate to={`${base}/certificadora`} replace />} />
      <Route path="/gerar-certificado" element={<Navigate to={`${base}/gerar-certificado`} replace />} />
      <Route path="/monitores" element={<Navigate to={`${base}/monitores`} replace />} />
      <Route path="/terapeuta" element={<Navigate to={`${base}/terapeuta`} replace />} />
      <Route path="/bestseller" element={<Navigate to={`${base}/bestseller`} replace />} />
      <Route path="/historico" element={<Navigate to={`${base}/historico`} replace />} />
      <Route path="/classe" element={<Navigate to={`${base}/classe`} replace />} />
      <Route path="/ofensivas" element={<Navigate to={`${base}/ofensivas`} replace />} />
      <Route path="/apostila" element={<Navigate to={`${base}/apostila`} replace />} />
      <Route path="/practice" element={<Navigate to={`${base}/practice`} replace />} />

      {/* Old scoped paths with courseSlug → strip slug */}
      <Route path="/student/tcc/*" element={<Navigate to="/student/*" replace />} />
      <Route path="/adm/tcc/*" element={<Navigate to="/adm/*" replace />} />
      <Route path="/student/psi/*" element={<Navigate to="/student/*" replace />} />
      <Route path="/adm/psi/*" element={<Navigate to="/adm/*" replace />} />
      <Route path="/student/sex/*" element={<Navigate to="/student/*" replace />} />
      <Route path="/adm/sex/*" element={<Navigate to="/adm/*" replace />} />

      {/* Public pages */}
      <Route path="/politica" element={<PoliticaDeTrabalho />} />
      <Route path="/ementa-cursos" element={<CourseSyllabus />} />
      <Route path="/wr-tec" element={<WRTec />} />
      <Route path="/atendimento-social" element={<AtendimentoSocial />} />
      <Route path="/validar-certificado" element={<CertificateVerifier />} />
      <Route path="/termos" element={<TermosDeUso />} />
      <Route path="/privacidade" element={<PoliticaDePrivacidade />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <CustomAuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </CustomAuthProvider>
    </AuthProvider>
  )
}

export default App