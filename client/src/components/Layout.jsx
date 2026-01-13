import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="flex bg-background min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
