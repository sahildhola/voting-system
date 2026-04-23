import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { truncateAddress } from "../utils/helpers";
import toast from "react-hot-toast";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", nationalId: "" });
  const [loading, setLoading] = useState(false);
  const [walletInfo, setWalletInfo] = useState(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const result = await register(form);
      setWalletInfo(result.wallet);
      toast.success("Account created! Save your wallet key.");
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (walletInfo) {
    return (
      <div className="auth-page">
        <div className="auth-bg-grid" />
        <div className="auth-card" style={{ maxWidth: 520 }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
            <h2 className="auth-title">Account Created!</h2>
            <p className="auth-subtitle">Your blockchain wallet has been generated</p>
          </div>

          <div style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "var(--radius-md)", padding: 16, marginBottom: 20
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-red)", marginBottom: 8 }}>
              ⚠️ SAVE YOUR PRIVATE KEY — Shown Only Once
            </div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
              You need this key to sign blockchain transactions and cast votes.
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Wallet Address</label>
            <input className="form-input font-mono" readOnly value={walletInfo.address} style={{ fontSize: 12 }} />
          </div>

          <div className="form-group">
            <label className="form-label">Private Key</label>
            <input
              className="form-input font-mono"
              readOnly
              value={walletInfo.privateKey}
              style={{ fontSize: 11, color: "var(--accent-amber)" }}
            />
            <div className="form-hint">Store this securely — never share it with anyone.</div>
          </div>

          <button
            className="btn btn-primary btn-full"
            onClick={() => {
              navigator.clipboard.writeText(walletInfo.privateKey);
              toast.success("Private key copied!");
            }}
            style={{ marginBottom: 12 }}
          >
            Copy Private Key
          </button>
          <button className="btn btn-secondary btn-full" onClick={() => navigate("/dashboard")}>
            Continue to Dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-grid" />
      <div className="auth-bg-glow" />

      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">⛓</div>
          <span className="auth-logo-text">VoteChain</span>
        </div>

        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Register as a voter on the blockchain</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

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
            <label className="form-label">National ID (optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Your national identification number"
              value={form.nationalId}
              onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Min 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <div style={{
            background: "var(--accent-cyan-dim)", border: "1px solid rgba(0,212,255,0.15)",
            borderRadius: "var(--radius-md)", padding: "12px 14px", marginBottom: 20, fontSize: 12,
            color: "var(--text-secondary)", lineHeight: 1.6
          }}>
            ⛓ A blockchain wallet will be automatically created for you. Save the private key shown after registration.
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? (
              <><div className="spinner" style={{ width: 16, height: 16 }} />Creating Account...</>
            ) : "Create Voter Account →"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--text-secondary)" }}>
          Already have an account?{" "}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
