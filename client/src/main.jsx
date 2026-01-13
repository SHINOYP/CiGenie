import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import BuildsPage from './pages/BuildsPage';
import BuildDetails from './pages/BuildDetails';
import './index.css';

const Settings = () => <div className="text-center pt-20 text-gray-500">Settings Coming Soon</div>;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="builds" element={<BuildsPage />} />
          <Route path="builds/:id" element={<BuildDetails />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
