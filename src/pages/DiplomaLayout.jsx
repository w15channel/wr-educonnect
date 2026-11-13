import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { User, DollarSign, GraduationCap, History, LogOut, ChevronRight, ChevronDown, Menu, X, ClipboardCheck, LayoutDashboard, CalendarDays, Users, BookOpen, FileText, ClipboardList, Headphones } from 'lucide-react';
import { WR_PRIMARY_LOGO, BRAND_LEGAL_NAME, BRAND_SHORT_NAME } from '@/lib/brand';
import ChecklistReturnBar from '@/components/checklist/ChecklistReturnBar';
import MyCoursesLink from '@/components/courses/MyCoursesLink';
import CourseWorkspaceNotice from '@/components/courses/CourseWorkspaceNotice';
import { PORTAL_COURSES } from '@/components/courses/portalCourses';


const DIPLOMA_GROUPS = [
  { label: 'Conteúdo', items: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: ClipboardCheck, label: 'Trilha do módulo', path: '/checklist' },
    { icon: BookOpen, label: 'Apostila', path: '/apostila' },
    { icon: FileText, label: 'Tarefas', path: '/tasks' },
    { icon: ClipboardList, label: 'Provas', path: '/exams' },
    { icon: Headphones, label: 'Podcast', path: '/podcasts' },
  ] },
  { label: 'Ferramentas', items: [
    { icon: CalendarDays, label: 'Calendário', path: '/calendar' },
    { icon: DollarSign, label: 'Mensalidades', path: '/tuitions' },
    { icon: History, label: 'Histórico acadêmico', path: '/historico' },
    { icon: GraduationCap, label: 'Certificação', path: '/certificadora' },
  ] },
];
const DIPLOMA_STANDALONE = [
  { icon: Users, label: 'Classe', path: '/classe' },
  { icon: User, label: 'Meu Perfil', path: '/profile' },
];
const DIPLOMA_MENU = [...DIPLOMA_GROUPS.flatMap(group => group.items), ...DIPLOMA_STANDALONE];

function NavItem({ item, active, prefix, onNavigate }) {
  return (
    <Link
      to={prefix + item.path}
      onClick={onNavigate}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
        active
          ? 'border border-[#d4b96a]/25 bg-gradient-to-r from-[#d4b96a]/14 via-[#d4b96a]/05 to-transparent text-[#f2e8d1]'
          : 'border border-transparent text-white/45 hover:bg-white/[0.04] hover:text-white/80'
      }`}
    >
      {active && <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-[#d4b96a]" />}
      <item.icon size={16} className={active ? 'text-[#d4b96a]' : 'text-white/35 transition-colors group-hover:text-white/70'} />
      <span className="flex-1 text-[12.5px] font-medium tracking-[0.01em]">{item.label}</span>
      {active && <ChevronRight size={12} className="text-[#d4b96a]/70" />}
    </Link>
  );
}

export default function DiplomaLayout() {
  const location = useLocation();
  const { logout, session } = useCustomAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [openGroups, setOpenGroups] = React.useState(() => ({ Conteúdo: true, Ferramentas: true }));

  const prefix = `/degree/student`;

  const isActive = (path) => {
    const target = prefix + path;
    if (path === '/') return location.pathname === prefix || location.pathname === `${prefix}/dashboard`;
    return location.pathname === target;
  };

  const initials = session?.name
    ? session.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';
  const avatarBg = session?.avatarColor || '#7c3aed';
  const currentPage = DIPLOMA_MENU.find((item) => isActive(item.path))?.label || BRAND_LEGAL_NAME;
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className={`course-workspace ${PORTAL_COURSES.find(c => c.id === session?.course)?.theme || 'course-tcc'} flex h-[100dvh] w-full overflow-hidden app-shell-bg`}>
      {/* Sidebar — diploma */}
      {mobileOpen && <button type="button" aria-label="Fechar menu" className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm md:hidden" onClick={closeMobile} />}
      <aside className={`${mobileOpen ? 'flex' : 'hidden'} fixed inset-y-0 left-0 z-50 md:relative md:flex w-[17rem] md:w-[15.5rem] shrink-0 flex-col h-full border-r border-white/[0.06] bg-[#06070c] md:bg-[#06070c]/95 md:backdrop-blur-xl`}>
        <span className="pointer-events-none absolute inset-y-0 right-0 hidden w-px md:block" style={{ background: 'linear-gradient(180deg, transparent, rgba(212,185,106,0.28), transparent)' }} />

        {/* Marca */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-4">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center border border-[#d4b96a]/25 bg-gradient-to-br from-[#d4b96a]/12 to-transparent">
            <img src={WR_PRIMARY_LOGO} alt="WR" className="h-7 w-7 object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-light uppercase tracking-[0.28em] text-[#f2e8d1]">{BRAND_SHORT_NAME}</p>
            <p className="mt-0.5 truncate text-[8px] font-light uppercase tracking-[0.16em] text-[#c8bfa8]/40">Instituto de Desenvolvimento Humano</p>
          </div>
          <button type="button" className="ml-auto rounded-lg p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white/80 md:hidden" onClick={closeMobile} aria-label="Fechar menu"><X size={18} /></button>
        </div>

        {/* Navegação */}
        <nav className="scrollbar-invisible flex-1 overflow-y-auto px-3 py-4">
          <MyCoursesLink onClick={closeMobile} />
          {DIPLOMA_GROUPS.map((group) => <div key={group.label} className="mb-4">
            <button type="button" onClick={() => setOpenGroups(current => ({ ...current, [group.label]: !current[group.label] }))} aria-expanded={openGroups[group.label]} className="mb-1.5 flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[8.5px] font-semibold uppercase tracking-[0.24em] text-white/30 transition-colors hover:text-[#d4b96a]/80">
              <span className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-[#d4b96a]/70" />
                {group.label}
              </span>
              <ChevronDown size={12} className={`transition-transform duration-300 ${openGroups[group.label] ? 'rotate-180' : ''}`} />
            </button>
            {openGroups[group.label] && <div className="space-y-1">{group.items.map((item) => (
              <NavItem key={item.path} item={item} active={isActive(item.path)} prefix={prefix} onNavigate={closeMobile} />
            ))}</div>}
          </div>)}

          <div className="my-3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="space-y-1">
            {DIPLOMA_STANDALONE.map((item) => (
              <NavItem key={item.path} item={item} active={isActive(item.path)} prefix={prefix} onNavigate={closeMobile} />
            ))}
          </div>
        </nav>

        {/* Rodapé do usuário */}
        <div className="border-t border-white/[0.06] p-3">
          <div className="mb-2 flex items-center gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] p-2.5">
            {session?.photoUrl ? (
              <img src={session.photoUrl} alt="Avatar" className="h-9 w-9 rounded-full object-cover ring-1 ring-[#d4b96a]/30" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-light text-white ring-1 ring-[#d4b96a]/30" style={{ backgroundColor: avatarBg }}>
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium text-[#f2e8d1]/85">{session?.name || 'Usuário'}</p>
              <p className="text-[8.5px] font-light uppercase tracking-[0.16em] text-[#c8bfa8]/40">Estudante</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[10.5px] font-light text-[#c8bfa8]/35 transition-colors hover:bg-red-500/10 hover:text-red-300/80"
          >
            <LogOut size={13} /> Sair da conta
          </button>
        </div>
      </aside>

      {/* Barra superior mobile */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-3 border-b border-white/[0.06] bg-[#06070c]/92 px-4 backdrop-blur-xl md:hidden" style={{ paddingTop: 'calc(0.65rem + env(safe-area-inset-top, 0px))', paddingBottom: '0.65rem' }}>
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#d4b96a]/25">
            <img src={WR_PRIMARY_LOGO} alt="WR" className="h-5 w-5 object-contain" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium leading-tight text-[#f2e8d1]">{currentPage}</p>
            <p className="text-[8px] font-light uppercase tracking-[0.18em] text-[#c8bfa8]/40">{BRAND_SHORT_NAME}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="hidden text-[8px] font-medium uppercase tracking-[0.16em] text-white/20 sm:inline">{BRAND_LEGAL_NAME}</span>
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/5 hover:text-white" aria-label="Abrir menu lateral">
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <main className="mt-[calc(58px_+_env(safe-area-inset-top,0px))] flex-1 overflow-y-auto overflow-x-hidden md:mt-0">
        <CourseWorkspaceNotice session={session} />
        <Outlet context={{ user: session, course: session?.course, isDiplomaMode: true }} />
        <ChecklistReturnBar />
      </main>

    </div>
  );
}