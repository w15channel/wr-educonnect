import { Toaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { CustomAuthProvider, useCustomAuth } from '@/lib/CustomAuthContext';
// REQUIRED platform imports — do NOT remove
import { AuthProvider } from '@/lib/AuthContext';

import LandingPage from './pages/LayoutPreview2';
import WRTec from './pages/WRTec';
import CourseLobby from './pages/CourseLobby';
import PoliticaDeTrabalho from './pages/PoliticaDeTrabalho';
import TermosDeUso from './pages/TermosDeUso';
import PoliticaDePrivacidade from './pages/PoliticaDePrivacidade';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Lessons from './pages/Lessons';
import LiveSessions from './pages/LiveSessions';
import Tasks from './pages/Tasks';
import Forum from './pages/Forum';
import Students from './pages/Students';
import Announcements from './pages/Announcements';
import Profile from './pages/Profile';
import Calendar from './pages/Calendar';
import Tuitions from './pages/Tuitions';
import TutorDigital from './pages/TutorDigital';
import ScoreControl from './pages/ScoreControl';
import Certificadora from './pages/Certificadora';
import RankingGeral from './pages/RankingGeral';
import Monitores from './pages/Monitores';
import TerapeutaDaSemana from './pages/TerapeutaDaSemana';
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

const COURSE_TO_SLUG = { tcc: 'tcc', psicanalise: 'psi', sexologia: 'sex' };

function buildScopedRedirect(session, sub) {
  if (!session?.course) return '/lobby';
  const r = session.role === 'admin' ? 'adm' : 'student';
  const slug = COURSE_TO_SLUG[session.course] || 'tcc';
  return `/${r}/${slug}${sub}`;
}

// All scoped routes used by both /student/:slug/* and /adm/:slug/*
function ScopedRoutesTree() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="lessons" element={<Lessons />} />
        <Route path="live" element={<LiveSessions />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="tasks/quiz/:id" element={<TaskQuizView />} />
        <Route path="tasks/builder/:id" element={<TaskExamBuilder />} />
        <Route path="forum" element={<Forum />} />
        <Route path="chat" element={<ClassChat />} />
        <Route path="students" element={<Students />} />
        <Route path="students/:id" element={<StudentDetail />} />
        <Route path="keys" element={<Keys />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="profile" element={<Profile />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="tuitions" element={<Tuitions />} />
        <Route path="tutor" element={<TutorDigital />} />
        <Route path="scorecontrol" element={<ScoreControl />} />
        <Route path="scores" element={<Navigate to="../scorecontrol" replace />} />
        <Route path="certificadora" element={<Certificadora />} />
        <Route path="ranking" element={<RankingGeral />} />
        <Route path="monitores" element={<Monitores />} />
        <Route path="terapeuta" element={<TerapeutaDaSemana />} />
        <Route path="bestseller" element={<MeuBestSeller />} />
        <Route path="historico" element={<HistoricoAcademico />} />
        <Route path="dm/:email" element={<DirectMessage />} />
        <Route path="classe" element={<Classe />} />
        <Route path="ring" element={<Notifications />} />
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
      <div className="fixed inset-0 flex items-center justify-center bg-[#080b14]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#5b5ef4]/30 border-t-[#5b5ef4] rounded-full animate-spin"></div>
          <p className="text-sm text-white/40 font-medium">Carregando WR-EDU...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    if (pathname === '/politica') return <PoliticaDeTrabalho />;
    if (pathname === '/termos') return <TermosDeUso />;
    if (pathname === '/privacidade') return <PoliticaDePrivacidade />;
    if (pathname === '/wr-tec') return <WRTec />;
    return <LandingPage onLogin={handleLogin} />;
  }

  // Lobby for course selection (legacy + scoped)
  if (pathname === '/lobby' || pathname === '/student/lobby' || pathname === '/adm/lobby') {
    return <CourseLobby />;
  }

  const redirectTo = (sub) => <Navigate to={buildScopedRedirect(session, sub)} replace />;

  return (
    <Routes>
      {/* Scoped student routes */}
      <Route path="/student/:courseSlug/*" element={<ScopedRoutesTree />} />
      {/* Scoped admin routes */}
      <Route path="/adm/:courseSlug/*" element={<ScopedRoutesTree />} />

      {/* Legacy/root paths redirect to scoped layout */}
      <Route path="/" element={redirectTo('/dashboard')} />
      <Route path="/dashboard" element={redirectTo('/dashboard')} />
      <Route path="/lessons" element={redirectTo('/lessons')} />
      <Route path="/live" element={redirectTo('/live')} />
      <Route path="/tasks" element={redirectTo('/tasks')} />
      <Route path="/forum" element={redirectTo('/forum')} />
      <Route path="/chat" element={redirectTo('/chat')} />
      <Route path="/students" element={redirectTo('/students')} />
      <Route path="/keys" element={redirectTo('/keys')} />
      <Route path="/announcements" element={redirectTo('/announcements')} />
      <Route path="/profile" element={redirectTo('/profile')} />
      <Route path="/calendar" element={redirectTo('/calendar')} />
      <Route path="/tuitions" element={redirectTo('/tuitions')} />
      <Route path="/tutor" element={redirectTo('/tutor')} />
      <Route path="/scores" element={redirectTo('/scorecontrol')} />
      <Route path="/certificadora" element={redirectTo('/certificadora')} />
      <Route path="/ranking" element={redirectTo('/ranking')} />
      <Route path="/monitores" element={redirectTo('/monitores')} />
      <Route path="/terapeuta" element={redirectTo('/terapeuta')} />
      <Route path="/bestseller" element={redirectTo('/bestseller')} />
      <Route path="/historico" element={redirectTo('/historico')} />
      <Route path="/classe" element={redirectTo('/classe')} />

      <Route path="/politica" element={<PoliticaDeTrabalho />} />
      <Route path="/wr-tec" element={<WRTec />} />
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