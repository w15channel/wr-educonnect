import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSession, clearSession } from '@/lib/customAuth';

const CustomAuthContext = createContext();

export function CustomAuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = getSession();
    setSession(s);
    setLoading(false);
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