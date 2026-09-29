import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { BookOpen, FileText, User, DollarSign, GraduationCap, History, LogOut, ChevronRight, ScrollText, Menu, X, ClipboardCheck } from 'lucide-react';
import { WR_PRIMARY_LOGO, BRAND_SHORT_NAME } from '@/lib/brand';


const G = '#d4b96a';

const DIPLOMA_MENU = [
  { icon: BookOpen, label: 'Aulas',              path: '/lessons',      color: 'text-purple-400' },
  { icon: FileText, label: 'Tarefas',             path: '/tasks',        color: 'text-orange-400' },
  { icon: ScrollText, label: 'Apostila TCC',      path: '/apostila',     color: 'text-emerald-400' },
  { icon: ClipboardCheck, label: 'Trilha do módulo', path: '/checklist', color: 'text-blue-400' },
  { icon: GraduationCap, label: 'Provas',         path: '/exams',        color: 'text-violet-400' },
  { icon: DollarSign, label: 'Mensalidades',      path: '/tuitions',     color: 'text-teal-400' },
  { icon: History, label: 'Histórico Acadêmico',  path: '/historico',    color: 'text-cyan-400' },
  { icon: GraduationCap, label: 'Certificação',   path: '/certificadora',color: 'text-yellow-400' },
  { icon: User, label: 'Meu Perfil',              path: '/profile',      color: 'text-indigo-400' },
];

export default function DiplomaLayout() {
  const location = useLocation();
  const { logout, session } = useCustomAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);

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
            <p className="text-[8px] text-[#c8bfa8]/30 font-light uppercase tracking-[0.15em]">Formação Certificado</p>
          </div>
          <button type="button" className="ml-auto p-2 text-white/50 md:hidden" onClick={() => setMobileOpen(false)} aria-label="Fechar menu"><X size={18} /></button>
        </div>

        {/* Badge modo */}
        <div className="mx-3 mt-3 mb-1 border px-3 py-2 text-[9px] font-light uppercase tracking-[0.18em] text-center"
          style={{ borderColor: `${G}25`, color: `${G}80`, background: `${G}06` }}>
          Modalidade · Somente Certificado
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto scrollbar-invisible">
          {DIPLOMA_MENU.map((item) => {
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
              <p className="text-[9px] text-[#c8bfa8]/30 uppercase tracking-[0.15em] font-light">Estudante · Certificado</p>
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
          <span className="text-[11px] font-light uppercase tracking-[0.2em] text-[#e8dfc8]">{BRAND_SHORT_NAME} · Certificado</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="text-white/70 hover:text-white transition-colors p-2" aria-label="Abrir menu lateral">
          <Menu size={20} />
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pt-0 md:pt-0 mt-[48px] md:mt-0">
        <Outlet context={{ user: session, course: session?.course, isDiplomaMode: true }} />
      </main>

    </div>
  );
}
