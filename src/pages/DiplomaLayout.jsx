import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { User, DollarSign, GraduationCap, History, LogOut, ChevronRight, ChevronDown, Menu, X, ClipboardCheck, LayoutDashboard, CalendarDays, Users } from 'lucide-react';
import { WR_PRIMARY_LOGO, BRAND_LEGAL_NAME, BRAND_SHORT_NAME } from '@/lib/brand';


const DIPLOMA_GROUPS = [
  { label: 'Conteúdo', items: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', color: 'text-amber-400' },
    { icon: ClipboardCheck, label: 'Trilha do módulo', path: '/checklist', color: 'text-blue-400' },
  ] },
  { label: 'Ferramentas', items: [
    { icon: CalendarDays, label: 'Calendário', path: '/calendar', color: 'text-cyan-400' },
    { icon: DollarSign, label: 'Mensalidades', path: '/tuitions', color: 'text-teal-400' },
    { icon: History, label: 'Histórico acadêmico', path: '/historico', color: 'text-cyan-400' },
    { icon: GraduationCap, label: 'Certificação', path: '/certificadora', color: 'text-yellow-400' },
  ] },
];
const DIPLOMA_STANDALONE = [
  { icon: Users, label: 'Classe', path: '/classe', color: 'text-sky-400' },
  { icon: User, label: 'Meu Perfil', path: '/profile', color: 'text-indigo-400' },
];
const DIPLOMA_MENU = [...DIPLOMA_GROUPS.flatMap(group => group.items), ...DIPLOMA_STANDALONE];

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

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden app-shell-bg">
      {/* Sidebar estreita — diploma only */}
      {mobileOpen && <button type="button" aria-label="Fechar menu" className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={`${mobileOpen ? 'flex' : 'hidden'} fixed inset-y-0 left-0 z-50 md:static md:flex flex-col w-72 md:w-52 shrink-0 bg-[#07080f] border-r border-[#151c30] h-full`}>
        {/* Logo */}
        <div className="p-5 flex items-center gap-3 border-b border-[#151c30]">
          <div className="w-8 h-8 flex items-center justify-center">
            <img src={WR_PRIMARY_LOGO} alt="WR" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-[12px] font-light uppercase tracking-[0.2em] text-[#e8dfc8]">{BRAND_SHORT_NAME}</p>
            <p className="text-[8px] text-[#c8bfa8]/45 font-light tracking-wide">Instituto de Desenvolvimento Humano</p>
          </div>
          <button type="button" className="ml-auto p-2 text-white/50 md:hidden" onClick={() => setMobileOpen(false)} aria-label="Fechar menu"><X size={18} /></button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto scrollbar-invisible">
          {DIPLOMA_GROUPS.map((group) => <div key={group.label} className="mb-2">
            <button type="button" onClick={() => setOpenGroups(current => ({ ...current, [group.label]: !current[group.label] }))} aria-expanded={openGroups[group.label]} className="flex w-full items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#c8bfa8]/45 hover:text-[#e8dfc8]">
              {group.label}<ChevronDown size={13} className={`transition-transform ${openGroups[group.label] ? 'rotate-180' : ''}`} />
            </button>
            {openGroups[group.label] && <div className="space-y-0.5">{group.items.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={prefix + item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative ${
                  active
                    ? 'bg-[#161c32] text-[#e8dfc8]'
                    : 'text-white/45 hover:bg-white/5 hover:text-white/75'
                }`}
              >
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#d4b96a]" />}
                <item.icon size={16} className={active ? 'text-[#d4b96a]' : item.color} />
                <span className="text-[13px] font-medium flex-1">{item.label}</span>
                {active && <ChevronRight size={12} className="text-[#d4b96a] opacity-60" />}
              </Link>
            );
            })}</div>}
          </div>)}
          <div className="my-2 border-t border-[#151c30]" />
          {DIPLOMA_STANDALONE.map((item) => {
            const active = isActive(item.path);
            return <Link key={item.path} to={prefix + item.path} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative ${active ? 'bg-[#161c32] text-[#e8dfc8]' : 'text-white/45 hover:bg-white/5 hover:text-white/75'}`}>
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#d4b96a]" />}
              <item.icon size={16} className={active ? 'text-[#d4b96a]' : item.color} /><span className="text-[13px] font-medium flex-1">{item.label}</span>{active && <ChevronRight size={12} className="text-[#d4b96a] opacity-60" />}
            </Link>;
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[#151c30]">
          <div className="flex items-center gap-3 p-2 mb-1">
            {session?.photoUrl ? (
              <img src={session.photoUrl} alt="Avatar" className="w-8 h-8 object-cover rounded-full ring-1 ring-[#d4b96a]/20" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-light text-white ring-1 ring-[#d4b96a]/20"
                style={{ backgroundColor: avatarBg }}>
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-light text-[#e8dfc8]/80 truncate">{session?.name || 'Usuário'}</p>
              <p className="text-[9px] text-[#c8bfa8]/45 font-light">Estudante</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-[#c8bfa8]/25 hover:text-red-400/70 w-full px-3 py-2 transition-colors text-[11px] font-light"
          >
            <LogOut size={13} /> Sair da conta
          </button>
        </div>
      </aside>

      {/* Mobile top bar: a mesma navegacao lateral do desktop abre como drawer. */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 py-3 bg-[#07080f] border-b border-[#151c30]">
        <div className="flex items-center gap-2">
          <img src={WR_PRIMARY_LOGO} alt="WR" className="w-6 h-6 object-contain" />
          <span className="text-sm font-bold text-[#e8dfc8]">{currentPage}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-[9px] font-bold uppercase tracking-widest text-[#c8bfa8]/40 sm:inline">{BRAND_LEGAL_NAME}</span>
          <button onClick={() => setMobileOpen(true)} className="text-white/70 hover:text-white transition-colors p-2" aria-label="Abrir menu lateral">
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pt-0 md:pt-0 mt-[48px] md:mt-0">
        <Outlet context={{ user: session, course: session?.course, isDiplomaMode: true }} />
      </main>

    </div>
  );
}
