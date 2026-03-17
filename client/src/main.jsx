import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProjectsPage from "./pages/ProjectsPage";
import BuildDetails from "./pages/BuildDetails";
import ControlPanel from "./pages/ControlPanel";
import SettingsPage from "./pages/SettingsPage";

import ProtectedRoute from "./components/ProtectedRoute";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>

        {/* Login Page */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="control" element={<ControlPanel />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<BuildDetails />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="builds" element={<Navigate to="/projects" replace />} />
        </Route>

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);