import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Components
import Sidebar from "./components/Sidebar";
import BlockchainBar from "./components/BlockchainBar";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Elections from "./pages/Elections";
import ElectionDetail from "./pages/ElectionDetail";
import MyVotes from "./pages/MyVotes";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCreateElection from "./pages/AdminCreateElection";
import AdminUsers from "./pages/AdminUsers";
import BlockchainExplorer from "./pages/BlockchainExplorer";

// ─── Protected Route ──────────────────────────────────────────────────────────
function Protected({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;

  return children;
}

// ─── App Layout (Sidebar + Content) ──────────────────────────────────────────
function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <BlockchainBar />
        {children}
      </div>
    </div>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────
function AppRoutes() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />}
      />

      {/* Voter routes */}
      <Route
        path="/dashboard"
        element={
          <Protected>
            <AppLayout><Dashboard /></AppLayout>
          </Protected>
        }
      />
      <Route
        path="/elections"
        element={
          <Protected>
            <AppLayout><Elections /></AppLayout>
          </Protected>
        }
      />
      <Route
        path="/elections/:id"
        element={
          <Protected>
            <AppLayout><ElectionDetail /></AppLayout>
          </Protected>
        }
      />
      <Route
        path="/my-votes"
        element={
          <Protected>
            <AppLayout><MyVotes /></AppLayout>
          </Protected>
        }
      />
      <Route
        path="/profile"
        element={
          <Protected>
            <AppLayout><Profile /></AppLayout>
          </Protected>
        }
      />
      <Route
        path="/blockchain"
        element={
          <Protected>
            <AppLayout><BlockchainExplorer /></AppLayout>
          </Protected>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <Protected adminOnly>
            <AppLayout><AdminDashboard /></AppLayout>
          </Protected>
        }
      />
      <Route
        path="/admin/elections/new"
        element={
          <Protected adminOnly>
            <AppLayout><AdminCreateElection /></AppLayout>
          </Protected>
        }
      />
      <Route
        path="/admin/users"
        element={
          <Protected adminOnly>
            <AppLayout><AdminUsers /></AppLayout>
          </Protected>
        }
      />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

// ─── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
            },
            success: {
              iconTheme: { primary: "var(--accent-green)", secondary: "var(--bg-elevated)" },
            },
            error: {
              iconTheme: { primary: "var(--accent-red)", secondary: "var(--bg-elevated)" },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
