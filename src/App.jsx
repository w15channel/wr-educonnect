import { useState } from 'react';
import { Toaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { CustomAuthProvider, useCustomAuth } from '@/lib/CustomAuthContext';

import LoginScreen from './components/auth/LoginScreen';
import LandingPage from './pages/LandingPage';
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
  const [showLogin, setShowLogin] = useState(false);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: '#111827' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-400 font-medium">Carregando WR-EDU...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    if (showLogin) return <LoginScreen onLogin={login} />;
    return <LandingPage onLoginClick={() => setShowLogin(true)} />;
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