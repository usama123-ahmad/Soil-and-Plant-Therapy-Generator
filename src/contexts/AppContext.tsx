import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/components/ui/use-toast';

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  ntsGeneralCommentsHtml: { [key: string]: string };
  setNtsGeneralCommentsHtml: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
}

const defaultAppContext: AppContextType = {
  sidebarOpen: false,
  toggleSidebar: () => {},
  ntsGeneralCommentsHtml: {},
  setNtsGeneralCommentsHtml: () => {},
};

const AppContext = createContext<AppContextType>(defaultAppContext);

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ntsGeneralCommentsHtml, setNtsGeneralCommentsHtml] = useState<{ [key: string]: string }>({});

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        ntsGeneralCommentsHtml,
        setNtsGeneralCommentsHtml,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
