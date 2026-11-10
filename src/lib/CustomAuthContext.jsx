import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSession, setSession as persistSession, clearSession } from '@/lib/customAuth';
import { base44 } from '@/api/base44Client';

const CustomAuthContext = createContext();

/**
 * Link de acesso direto: /?acesso=EDU-XXXX-XXXX
 * O aluno clica no atalho enviado pela coordenação e cai direto na dashboard,
 * já com o acesso lembrado neste dispositivo (a caixinha "Lembrar acesso"
 * aparece marcada com o código dele caso saia da conta).
 *
 * Parâmetro opcional redirect: /?acesso=EDU-XXXX-XXXX&redirect=/checklist
 * Quando presente, o aluno é levado direto para a página indicada após o login,
 * em vez de passar pelo lobby.
 */
async function loginFromAccessLink() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('acesso') || params.get('code');
  if (!raw) return null;

  const code = raw.trim().toUpperCase().replace(/\s+/g, '');
  const redirect = params.get('redirect') || params.get('ir');
  try {
    const response = await base44.functions.invoke('siteLogin', { mode: 'student', code });
    const session = response.data.session;
    persistSession(session, { remember: true });
    localStorage.setItem('wr_remember_student_code', 'yes');
    localStorage.setItem('wr_saved_student_code', code);
    // Redireciona para a página solicitada ou para o lobby se não houver redirect
    const target = redirect ? `/${redirect.replace(/^\/+/, '')}` : '/lobby';
    window.history.replaceState({}, '', target);
    return session;
  } catch {
    // Código inválido/desativado — segue para a tela de login normal.
    window.history.replaceState({}, '', '/');
    return null;
  }
}

/**
 * Verifica se o usuário retornou do fluxo de Google OAuth do Base44.
 * Se autenticado via Google, valida o email contra AdminCredential via
 * siteLogin (mode: 'admin_google') e cria a sessão admin.
 *
 * Esta função só é chamada quando NÃO há sessão existente — portanto
 * não afeta alunos que já estão logados via código de acesso.
 */
async function checkGoogleAuth() {
  try {
    const user = await base44.auth.me();
    if (!user || !user.email) return null;

    const response = await base44.functions.invoke('siteLogin', { mode: 'admin_google' });
    if (response?.data?.session) {
      persistSession(response.data.session, { remember: true });
      return response.data.session;
    }
  } catch {
    // Não autenticado via Google OAuth — segue fluxo normal
  }
  return null;
}

export function CustomAuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // 1. Verifica link de acesso direto (?acesso=EDU-XXXX)
      const fromLink = await loginFromAccessLink();
      if (fromLink) {
        setSession(fromLink);
        setLoading(false);
        return;
      }

      // 2. Verifica sessão existente (localStorage/sessionStorage)
      const existing = getSession();
      if (existing) {
        setSession(existing);
        setLoading(false);
        return;
      }

      // 3. Sem sessão — verifica se retornou do Google OAuth (admin)
      const googleSession = await checkGoogleAuth();
      setSession(googleSession);
      setLoading(false);
    })();
  }, []);

  const login = () => {
    setSession(getSession());
  };

  const logout = () => {
    clearSession();
    setSession(null);
  };

  return (
    <CustomAuthContext.Provider value={{ session, loading, login, logout, isAdmin: session?.role === 'admin', isStudent: session?.role !== 'admin' }}>
      {children}
    </CustomAuthContext.Provider>
  );
}

export function useCustomAuth() {
  return useContext(CustomAuthContext);
}