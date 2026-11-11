import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import { WR_PRIMARY_LOGO, BRAND_SHORT_NAME } from '@/lib/brand';

export default function PortalHeader() {
  const { logout } = useCustomAuth();
  return <header className="border-b border-portal-muted/20 px-5 py-5">
    <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
      <Link to="/lobby" className="flex items-center gap-3 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-course">
        <img src={WR_PRIMARY_LOGO} alt={BRAND_SHORT_NAME} className="h-10 w-10 object-contain" />
        <div><p className="text-sm font-semibold tracking-widest">{BRAND_SHORT_NAME}</p><p className="text-xs text-portal-muted">Portal de formações</p></div>
      </Link>
      <button onClick={logout} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-portal-muted/25 px-4 text-sm text-portal-muted hover:text-portal-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-course"><LogOut size={16} /> Sair</button>
    </div>
  </header>;
}