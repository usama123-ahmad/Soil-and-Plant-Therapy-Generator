import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
// Remove all sidebar imports
// import { SidebarProvider, Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
// import { Home, FileText } from 'lucide-react';
// import { Link, useLocation } from 'react-router-dom';

interface AppLayoutProps {
  children?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { sidebarOpen, toggleSidebar } = useAppContext();
  const isMobile = useIsMobile();
  // Remove location

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <main className="w-full max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-12 flex-1 pt-0 mt-0">
        {children}
      </main>
      <footer className="w-full text-center py-4 text-gray-600 text-sm font-semibold mt-auto" style={{ color: 'var(--primary)' }}>
        Powered by NTS G.R.O.W
      </footer>
    </div>
  );
};

export default AppLayout;