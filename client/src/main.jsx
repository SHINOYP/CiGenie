import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ProjectsPage from "./pages/ProjectsPage";
import BuildDetails from "./pages/BuildDetails";
import ControlPanel from "./pages/ControlPanel";
import "./index.css";

import SettingsPage from "./pages/SettingsPage";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="control" element={<ControlPanel />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<BuildDetails />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="builds" element={<Navigate to="/projects" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
