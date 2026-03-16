import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import BuildRoadmap from './BuildRoadmap';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
const Layout = () => {
  const [activeExecutionId, setActiveExecutionId] = useState(null);
  const [activeAction, setActiveAction] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const startTracking = (id, action) => {
    setActiveExecutionId(id);
    setActiveAction(action);
  };

  return (
    <div className="flex bg-background min-h-screen relative overflow-x-hidden">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-surface border-b border-slate-700 flex items-center justify-between px-6 z-30 lg:hidden">
        <h1 className="text-lg font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
          CiGenie
        </h1>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-gray-400 hover:text-white"
        >
          <Menu size={24} />
        </button>
      </header>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto h-screen mt-16 lg:mt-0">
        <Outlet context={{ startTracking, activeExecutionId }} />
      </main>

      {/* Persistent Roadmap Portal */}
      {activeExecutionId && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-40 lg:bottom-6 lg:right-6 lg:left-auto lg:w-96 lg:p-0 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
           <BuildRoadmap 
              executionId={activeExecutionId} 
              action={activeAction} 
              onClose={() => {
                setActiveExecutionId(null);
                setActiveAction(null);
              }}
           />
        </div>
      )}
    </div>
  );
};

export default Layout;
