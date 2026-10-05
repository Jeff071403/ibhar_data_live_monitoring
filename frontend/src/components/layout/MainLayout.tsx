import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

export const MainLayout: React.FC = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Desktop Floating Sidebar */}
      <Sidebar isExpanded={isSidebarExpanded} setIsExpanded={setIsSidebarExpanded} />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 pb-16 lg:pb-0 transition-all duration-300 ${
        isSidebarExpanded ? 'lg:pl-[272px]' : 'lg:pl-[96px]'
      }`}>
        <Header />
        <main className="flex-1 p-2 sm:p-3 lg:p-4 w-full max-w-full space-y-4">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Bar */}
      <BottomNav />
    </div>
  );
};
