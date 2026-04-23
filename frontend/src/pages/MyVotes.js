import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { formatDate, truncateTxHash, copyToClipboard } from "../utils/helpers";
import toast from "react-hot-toast";

export default function MyVotes() {
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/votes/history")
      .then((r) => setVotes(r.data.votes))
      .catch(() => toast.error("Failed to load vote history"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner" /><span>Loading votes...</span></div>;

  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      <div className="page-header">
        <h1 className="page-title">My Vote History</h1>
        <p className="page-subtitle">All your blockchain-recorded votes</p>
      </div>

      {votes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🗳</div>
          <div className="font-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No votes yet</div>
          <p className="text-secondary" style={{ marginBottom: 24 }}>Join an election and cast your first blockchain vote.</p>
          <button className="btn btn-primary" onClick={() => navigate("/elections")}>Browse Elections →</button>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
            {votes.length} vote{votes.length !== 1 ? "s" : ""} recorded
          </div>
          {votes.map((v) => (
            <div key={v._id} className="card mb-24" style={{ padding: 0, overflow: "hidden" }}>
              {/* Header */}
              <div style={{
                padding: "16px 20px",
                background: "linear-gradient(135deg, var(--bg-elevated), var(--bg-card))",
                borderBottom: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8
              }}>
                <div>
                  <div className="font-display" style={{ fontWeight: 700, fontSize: 15 }}>
                    {v.election?.title || "Election"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {formatDate(v.timestamp)}
                  </div>
                </div>
                <span className="badge badge-finalized">✓ Verified</span>
              </div>

              {/* Body */}
              <div style={{ padding: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", padding: "12px 16px" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                      Voted For
                    </div>
                    <div style={{ fontWeight: 700, color: "var(--accent-cyan)", fontSize: 16 }}>{v.candidateName}</div>
                  </div>
                  <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", padding: "12px 16px" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                      Block Number
                    </div>
                    <div className="font-mono" style={{ fontSize: 15, color: "var(--text-primary)" }}>
                      {v.blockNumber ? `#${v.blockNumber}` : "Pending"}
                    </div>
                  </div>
                </div>

                {/* Transaction Hash */}
                <div style={{
                  background: "var(--bg-elevated)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)", padding: "12px 16px"
                }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                    Transaction Hash (Blockchain Proof)
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <code className="font-mono text-cyan" style={{ fontSize: 12, wordBreak: "break-all", flex: 1 }}>
                      {v.txHash}
                    </code>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={async () => {
                        const ok = await copyToClipboard(v.txHash);
                        if (ok) toast.success("Tx hash copied!");
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate(`/elections/${v.election?._id}`)}
                  >
                    View Election Results →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
