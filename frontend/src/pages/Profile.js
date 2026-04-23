import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { formatDate, truncateAddress, copyToClipboard } from "../utils/helpers";
import toast from "react-hot-toast";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "" });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/auth/profile", form);
      await refreshUser();
      toast.success("Profile updated!");
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Your voter identity and blockchain wallet</p>
      </div>

      {/* Avatar */}
      <div className="card mb-24">
        <div className="card-body" style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 26, color: "white", flexShrink: 0
          }}>
            {initials}
          </div>
          <div>
            <div className="font-display" style={{ fontSize: 22, fontWeight: 700 }}>{user?.name}</div>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 2 }}>{user?.email}</div>
            <span className={`badge mt-8 ${user?.role === "admin" ? "badge-admin" : "badge-voter"}`}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Profile */}
      <div className="card mb-24">
        <div className="card-header">
          <span className="font-display" style={{ fontWeight: 700 }}>Personal Info</span>
        </div>
        <div className="card-body">
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                value={form.name}
                onChange={(e) => setForm({ name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" value={user?.email} disabled style={{ opacity: 0.6 }} />
              <div className="form-hint">Email cannot be changed.</div>
            </div>
            {user?.nationalId && (
              <div className="form-group">
                <label className="form-label">National ID</label>
                <input className="form-input font-mono" value={user.nationalId} disabled style={{ opacity: 0.6 }} />
              </div>
            )}
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : "Save Changes"}
            </button>
          </form>
        </div>
      </div>

      {/* Wallet */}
      <div className="card mb-24">
        <div className="card-header">
          <span className="font-display" style={{ fontWeight: 700 }}>Blockchain Wallet</span>
          {user?.walletAddress && <span className="badge badge-active"><span className="badge-dot" />Connected</span>}
        </div>
        <div className="card-body">
          {user?.walletAddress ? (
            <>
              <div style={{ marginBottom: 16 }}>
                <div className="form-label">Wallet Address</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <code className="font-mono" style={{ fontSize: 13, color: "var(--accent-cyan)", wordBreak: "break-all" }}>
                    {user.walletAddress}
                  </code>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => { copyToClipboard(user.walletAddress); toast.success("Copied!"); }}
                    style={{ flexShrink: 0 }}
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div style={{
                background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)",
                borderRadius: "var(--radius-md)", padding: "12px 14px", fontSize: 12, color: "var(--text-secondary)"
              }}>
                ⚠️ Your private key was shown only at registration. Keep it safe — you need it to cast votes on the blockchain.
              </div>
            </>
          ) : (
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>No wallet connected to this account.</div>
          )}
        </div>
      </div>

      {/* Voting Activity */}
      <div className="card">
        <div className="card-header">
          <span className="font-display" style={{ fontWeight: 700 }}>Voting Activity</span>
        </div>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div style={{ textAlign: "center", background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", padding: 16 }}>
              <div className="font-display text-cyan" style={{ fontSize: 28, fontWeight: 800 }}>
                {user?.registeredElections?.length || 0}
              </div>
              <div className="text-secondary" style={{ fontSize: 12, marginTop: 4 }}>Registered</div>
            </div>
            <div style={{ textAlign: "center", background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", padding: 16 }}>
              <div className="font-display text-green" style={{ fontSize: 28, fontWeight: 800 }}>
                {user?.registeredElections?.filter((e) => e.hasVoted).length || 0}
              </div>
              <div className="text-secondary" style={{ fontSize: 12, marginTop: 4 }}>Voted</div>
            </div>
            <div style={{ textAlign: "center", background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", padding: 16 }}>
              <div className="font-display text-amber" style={{ fontSize: 28, fontWeight: 800 }}>
                {(user?.registeredElections?.length || 0) > 0
                  ? Math.round(((user?.registeredElections?.filter((e) => e.hasVoted).length || 0) / user.registeredElections.length) * 100)
                  : 0}%
              </div>
              <div className="text-secondary" style={{ fontSize: 12, marginTop: 4 }}>Participation</div>
            </div>
          </div>
          <div className="form-hint mt-8" style={{ textAlign: "center" }}>
            Member since {user?.createdAt ? formatDate(user.createdAt) : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
