import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useCustomAuth } from '@/lib/CustomAuthContext';

export default function AppLayout() {
  const { session } = useCustomAuth();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar session={session} />
      <main className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <div className="flex-1 overflow-auto">
          <Outlet context={{ user: session, isAdmin: session?.role === 'admin', isStudent: session?.role === 'student' }} />
        </div>
      </main>
    </div>
  );
}