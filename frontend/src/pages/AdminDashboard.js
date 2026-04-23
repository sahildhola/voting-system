import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { formatDate, truncateAddress, truncateTxHash, getElectionStatus, statusBadgeClass, statusLabel } from "../utils/helpers";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/admin/dashboard")
      .then((r) => setData(r.data))
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner" /><span>Loading...</span></div>;

  const { stats, blockchain, recentElections = [], recentVotes = [] } = data || {};

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">Manage elections, voters, and blockchain state</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate("/admin/elections/new")}>
            + New Election
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon cyan">◎</div>
          <div><div className="stat-value text-cyan">{stats?.totalUsers ?? 0}</div><div className="stat-label">Total Users</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">🗳</div>
          <div><div className="stat-value text-green">{stats?.totalElections ?? 0}</div><div className="stat-label">Elections</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber">✓</div>
          <div><div className="stat-value text-amber">{stats?.totalVotes ?? 0}</div><div className="stat-label">Votes Cast</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">⬡</div>
          <div><div className="stat-value text-green">{stats?.activeElections ?? 0}</div><div className="stat-label">Active Elections</div></div>
        </div>
      </div>

      {/* Blockchain Panel */}
      {blockchain && (
        <div className="card mb-24" style={{ borderLeft: "3px solid var(--accent-cyan)" }}>
          <div className="card-header">
            <div className="flex gap-8" style={{ alignItems: "center" }}>
              <span style={{ color: "var(--accent-cyan)" }}>⛓</span>
              <span className="font-display" style={{ fontWeight: 700 }}>Blockchain Status</span>
            </div>
            <div className="flex gap-8" style={{ alignItems: "center" }}>
              <span className="dot-live" />
              <span className="font-mono" style={{ fontSize: 11, color: "var(--accent-green)" }}>LIVE</span>
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
              {[
                { label: "Chain ID", value: blockchain.chainId },
                { label: "Block Number", value: `#${blockchain.blockNumber}` },
                { label: "Elections On-Chain", value: blockchain.electionCount },
                { label: "Candidates On-Chain", value: blockchain.candidateCount },
                { label: "Contract", value: truncateAddress(blockchain.contractAddress) },
                { label: "RPC URL", value: blockchain.rpcUrl },
              ].map((item) => (
                <div key={item.label} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{item.label}</div>
                  <div className="font-mono" style={{ fontSize: 13, color: "var(--text-primary)" }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Recent Elections */}
        <div className="card">
          <div className="card-header">
            <span className="font-display" style={{ fontWeight: 700, fontSize: 15 }}>Recent Elections</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate("/elections")}>View all</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead><tr><th>Title</th><th>Status</th><th>Votes</th></tr></thead>
              <tbody>
                {recentElections.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: "center", color: "var(--text-muted)" }}>No elections yet</td></tr>
                ) : recentElections.map((e) => {
                  const s = getElectionStatus(e);
                  return (
                    <tr key={e._id} style={{ cursor: "pointer" }} onClick={() => navigate(`/elections/${e._id}`)}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{e.title}</div>
                        {e.blockchainId && <div className="font-mono text-cyan" style={{ fontSize: 10 }}>#{e.blockchainId}</div>}
                      </td>
                      <td><span className={statusBadgeClass(s)}>{statusLabel(s)}</span></td>
                      <td className="font-mono text-cyan">{e.totalVotes ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Votes */}
        <div className="card">
          <div className="card-header">
            <span className="font-display" style={{ fontWeight: 700, fontSize: 15 }}>Recent Votes</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead><tr><th>Voter</th><th>Candidate</th><th>Tx</th></tr></thead>
              <tbody>
                {recentVotes.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: "center", color: "var(--text-muted)" }}>No votes yet</td></tr>
                ) : recentVotes.map((v) => (
                  <tr key={v._id}>
                    <td style={{ fontSize: 13 }}>{v.voter?.name || "—"}</td>
                    <td style={{ color: "var(--accent-cyan)", fontSize: 13 }}>{v.candidateName}</td>
                    <td>
                      <span className="tx-hash" onClick={() => { navigator.clipboard.writeText(v.txHash); toast.success("Copied!"); }}>
                        {truncateTxHash(v.txHash)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card mt-16">
        <div className="card-header">
          <span className="font-display" style={{ fontWeight: 700, fontSize: 15 }}>Quick Actions</span>
        </div>
        <div className="card-body">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={() => navigate("/admin/elections/new")}>+ New Election</button>
            <button className="btn btn-secondary" onClick={() => navigate("/admin/users")}>Manage Users</button>
            <button className="btn btn-secondary" onClick={() => navigate("/blockchain")}>Blockchain Explorer</button>
          </div>
        </div>
      </div>
    </div>
  );
}
