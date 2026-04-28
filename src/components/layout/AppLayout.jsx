import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { base44 } from '@/api/base44Client';

export default function AppLayout() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const me = await base44.auth.me();
      setUser(me);
    };
    loadUser();
  }, []);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar user={user} />
      <main className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <div className="flex-1 overflow-auto">
          <Outlet context={{ user }} />
        </div>
      </main>
    </div>
  );
}