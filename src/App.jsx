import { Toaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { CustomAuthProvider, useCustomAuth } from '@/lib/CustomAuthContext';
// REQUIRED platform imports — do NOT remove
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

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
import TaskQuizView from './pages/TaskQuizView';
import TaskExamBuilder from './pages/TaskExamBuilder';
import DirectMessage from './pages/DirectMessage';
import Classe from './pages/Classe';

const AuthenticatedApp = () => {
  const { session, loading, login } = useCustomAuth();
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

  // Show CourseLobby right after login if student hasn't chosen platform access yet
  if (!session) {
    if (window.location.pathname === '/politica') {
      return <PoliticaDeTrabalho />;
    }
    if (window.location.pathname === '/termos') {
      return <TermosDeUso />;
    }
    if (window.location.pathname === '/privacidade') {
      return <PoliticaDePrivacidade />;
    }
    if (window.location.pathname === '/wr-tec') {
      return <WRTec />;
    }
    return <LandingPage onLogin={handleLogin} />;
  }

  // Lobby for student course selection
  if (session?.role === 'student' && window.location.pathname === '/lobby') {
    return <CourseLobby />;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/lessons" element={<Lessons />} />
        <Route path="/live" element={<LiveSessions />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/tasks/quiz/:id" element={<TaskQuizView />} />
        <Route path="/tasks/builder/:id" element={<TaskExamBuilder />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/chat" element={<ClassChat />} />
        <Route path="/students" element={<Students />} />
        <Route path="/students/:id" element={<StudentDetail />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/tuitions" element={<Tuitions />} />
        <Route path="/tutor" element={<TutorDigital />} />
        <Route path="/scores" element={<ScoreControl />} />
        <Route path="/certificadora" element={<Certificadora />} />
        <Route path="/ranking" element={<RankingGeral />} />
        <Route path="/monitores" element={<Monitores />} />
        <Route path="/terapeuta" element={<TerapeutaDaSemana />} />
        <Route path="/bestseller" element={<MeuBestSeller />} />
        <Route path="/historico" element={<HistoricoAcademico />} />
        <Route path="/dm/:email" element={<DirectMessage />} />
        <Route path="/classe" element={<Classe />} />
      </Route>

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