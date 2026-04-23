import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const NAV_VOTER = [
  { to: "/dashboard", icon: "⬡", label: "Dashboard" },
  { to: "/elections", icon: "🗳", label: "Elections" },
  { to: "/my-votes", icon: "✓", label: "My Votes" },
  { to: "/profile", icon: "◎", label: "Profile" },
];

const NAV_ADMIN = [
  { to: "/admin", icon: "⬡", label: "Dashboard" },
  { to: "/elections", icon: "🗳", label: "Elections" },
  { to: "/admin/elections/new", icon: "+", label: "New Election" },
  { to: "/admin/users", icon: "◉", label: "Manage Users" },
  { to: "/blockchain", icon: "⛓", label: "Blockchain" },
];

export default function Sidebar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/login");
  };

  const navItems = isAdmin ? NAV_ADMIN : NAV_VOTER;
  const initials = user?.name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-text">
          <div className="sidebar-logo-icon">⛓</div>
          VoteChain
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <div className="nav-section-label" style={{ marginTop: 16 }}>Account</div>
        <button className="nav-item" onClick={handleLogout}>
          <span className="nav-icon">→</span>
          Logout
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name truncate">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
