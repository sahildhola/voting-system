import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-grid" />
      <div className="auth-bg-glow" />

      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">⛓</div>
          <span className="auth-logo-text">VoteChain</span>
        </div>

        <h1 className="auth-title">Sign in</h1>
        <p className="auth-subtitle">Access your blockchain voting account</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16 }} />
                Signing in...
              </>
            ) : "Sign In →"}
          </button>
        </form>

        <div className="auth-divider" style={{ marginTop: 24 }}>
          <span>Demo Credentials</span>
        </div>
        <div style={{
          background: "var(--bg-elevated)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)", padding: "14px 16px", fontSize: 12,
          fontFamily: "var(--font-mono)", color: "var(--text-secondary)", lineHeight: 1.8
        }}>
          <div>Admin: <span className="text-cyan">admin@votechain.io</span> / <span className="text-cyan">Admin@1234</span></div>
          <div>Voter: <span className="text-cyan">alice@example.com</span> / <span className="text-cyan">Voter@1234</span></div>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--text-secondary)" }}>
          New voter?{" "}
          <Link to="/register" className="auth-link">Create account</Link>
        </p>
      </div>
    </div>
  );
}
