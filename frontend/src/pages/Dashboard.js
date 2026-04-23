import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import ElectionCard from "../components/ElectionCard";
import { truncateAddress, formatDate } from "../utils/helpers";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [elections, setElections] = useState([]);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [elRes, voteRes] = await Promise.all([
          api.get("/elections?limit=6"),
          api.get("/votes/history"),
        ]);
        setElections(elRes.data.elections);
        setVotes(voteRes.data.votes);
      } catch (err) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  const activeElections = elections.filter((e) => {
    const now = new Date();
    return new Date(e.startTime) <= now && new Date(e.endTime) >= now;
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1 className="page-title">Welcome back, {user?.name?.split(" ")[0]} 👋</h1>
            <p className="page-subtitle">Your blockchain voting dashboard</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate("/elections")}>
            View Elections →
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon cyan">🗳</div>
          <div>
            <div className="stat-value text-cyan">{votes.length}</div>
            <div className="stat-label">Votes Cast</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">✓</div>
          <div>
            <div className="stat-value text-green">{activeElections.length}</div>
            <div className="stat-label">Active Elections</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber">◎</div>
          <div>
            <div className="stat-value text-amber">{user?.registeredElections?.length || 0}</div>
            <div className="stat-label">Registered In</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cyan">⛓</div>
          <div>
            <div className="stat-value" style={{ fontSize: 14, fontFamily: "var(--font-mono)" }}>
              {truncateAddress(user?.walletAddress) || "—"}
            </div>
            <div className="stat-label">Wallet Address</div>
          </div>
        </div>
      </div>

      {/* Active Elections */}
      <div className="card mb-24">
        <div className="card-header">
          <h2 className="font-display" style={{ fontSize: 16, fontWeight: 700 }}>
            Active Elections
          </h2>
          <span className="badge badge-active">
            <span className="badge-dot" />
            {activeElections.length} live
          </span>
        </div>
        <div className="card-body">
          {activeElections.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)" }}>
              No active elections right now.
            </div>
          ) : (
            <div className="election-grid">
              {activeElections.map((e) => (
                <ElectionCard key={e._id} election={e} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Vote History */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-display" style={{ fontSize: 16, fontWeight: 700 }}>
            My Vote History
          </h2>
        </div>
        {votes.length === 0 ? (
          <div className="card-body" style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)" }}>
            No votes cast yet. Join an election to get started.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Election</th>
                  <th>Candidate</th>
                  <th>Tx Hash</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {votes.map((v) => (
                  <tr key={v._id}>
                    <td>{v.election?.title || "—"}</td>
                    <td style={{ color: "var(--accent-cyan)" }}>{v.candidateName}</td>
                    <td>
                      <span
                        className="tx-hash"
                        onClick={() => {
                          navigator.clipboard.writeText(v.txHash);
                          toast.success("Copied!");
                        }}
                      >
                        {v.txHash?.slice(0, 10)}...
                      </span>
                    </td>
                    <td className="text-secondary" style={{ fontSize: 12 }}>
                      {formatDate(v.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
