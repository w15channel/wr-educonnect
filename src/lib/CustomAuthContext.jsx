import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSession, setSession as persistSession, clearSession } from '@/lib/customAuth';
import { base44 } from '@/api/base44Client';

const CustomAuthContext = createContext();

/**
 * Link de acesso direto: /?acesso=EDU-XXXX-XXXX
 * O aluno clica no atalho enviado pela coordenação e cai direto na dashboard,
 * já com o acesso lembrado neste dispositivo (a caixinha "Lembrar acesso"
 * aparece marcada com o código dele caso saia da conta).
 */
async function loginFromAccessLink() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('acesso') || params.get('code');
  if (!raw) return null;

  const code = raw.trim().toUpperCase().replace(/\s+/g, '');
  try {
    const response = await base44.functions.invoke('siteLogin', { mode: 'student', code });
    const session = response.data.session;
    persistSession(session, { remember: true });
    localStorage.setItem('wr_remember_student_code', 'yes');
    localStorage.setItem('wr_saved_student_code', code);
    // O aluno passa primeiro pelo lobby, onde vê os tutoriais antes de entrar.
    window.history.replaceState({}, '', '/lobby');
    return session;
  } catch {
    // Código inválido/desativado — segue para a tela de login normal.
    window.history.replaceState({}, '', '/');
    return null;
  }
}

export function CustomAuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const fromLink = await loginFromAccessLink();
      setSession(fromLink || getSession());
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