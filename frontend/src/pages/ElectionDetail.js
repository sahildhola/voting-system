import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import Countdown from "../components/Countdown";
import {
  formatDate,
  getElectionStatus,
  statusBadgeClass,
  statusLabel,
  truncateTxHash,
  copyToClipboard,
} from "../utils/helpers";
import toast from "react-hot-toast";

export default function ElectionDetail() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [election, setElection] = useState(null);
  const [voterStatus, setVoterStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [privateKey, setPrivateKey] = useState("");
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [voting, setVoting] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState("vote");
  const [issuedWallet, setIssuedWallet] = useState(null); // one-time display of the election wallet

  const load = async () => {
    try {
      const [elRes, statusRes] = await Promise.all([
        api.get(`/elections/${id}`),
        isAuthenticated ? api.get(`/votes/status/${id}`).catch(() => null) : Promise.resolve(null),
      ]);
      setElection(elRes.data.election);
      if (statusRes) setVoterStatus(statusRes.data);
    } catch (err) {
      toast.error("Failed to load election");
      navigate("/elections");
    } finally {
      setLoading(false);
    }
  };

  const loadResults = async () => {
    try {
      const res = await api.get(`/elections/${id}/results`);
      setResults(res.data);
    } catch {}
  };

  useEffect(() => {
    load();
    loadResults();
  }, [id]);

  const handleRegister = async () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    setRegistering(true);
    try {
      const res = await api.post("/votes/register", { electionId: id });
      toast.success("Successfully registered to vote!");
      if (res.data?.wallet?.privateKey) {
        setIssuedWallet(res.data.wallet);
      }
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  const handleVote = async () => {
    if (!selectedCandidate) { toast.error("Select a candidate"); return; }
    if (!privateKey.trim()) { toast.error("Private key required"); return; }
    setVoting(true);
    try {
      const res = await api.post("/votes/cast", {
        electionId: id,
        candidateBlockchainId: selectedCandidate.blockchainId,
        voterPrivateKey: privateKey.trim(),
      });
      setShowVoteModal(false);
      setPrivateKey("");
      toast.success("🗳 Vote cast on the blockchain!");
      await load();
      await loadResults();
      setActiveTab("results");
    } catch (err) {
      toast.error(err.response?.data?.error || "Vote failed");
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <span>Loading election...</span>
      </div>
    );
  }

  if (!election) return null;

  const status = getElectionStatus(election);
  const isActive = status === "active";
  const isRegistered = voterStatus?.isRegistered;
  const hasVoted = voterStatus?.hasVoted;
  const totalVotes = results?.totalVotes || 0;

  return (
    <div className="page-container" style={{ maxWidth: 900 }}>
      {/* Back */}
      <button className="btn btn-ghost btn-sm" onClick={() => navigate("/elections")} style={{ marginBottom: 20 }}>
        ← Back to Elections
      </button>

      {/* Header Card */}
      <div className="card mb-24" style={{ borderTop: "2px solid var(--accent-cyan)" }}>
        <div className="card-body">
          <div className="flex-between" style={{ marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <span className={statusBadgeClass(status)}>
              {status === "active" && <span className="badge-dot" />}
              {statusLabel(status)}
            </span>
            {election.blockchainId && (
              <span className="font-mono text-cyan" style={{ fontSize: 12 }}>
                ⛓ On-chain #{election.blockchainId}
              </span>
            )}
          </div>

          <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
            {election.title}
          </h1>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 20 }}>
            {election.description}
          </p>

          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 13, color: "var(--text-muted)" }}>
            <span>📅 Start: {formatDate(election.startTime)}</span>
            <span>🏁 End: {formatDate(election.endTime)}</span>
            <span>👤 {election.voterCount || election.registeredVoters?.length || 0} registered voters</span>
            <span>🗳 {totalVotes} votes cast</span>
          </div>

          {(isActive || status === "pending") && (
            <div style={{ marginTop: 20 }}>
              <Countdown startTime={election.startTime} endTime={election.endTime} />
            </div>
          )}

          {/* Action buttons */}
          {isAuthenticated && (
            <div className="flex gap-12 mt-16" style={{ flexWrap: "wrap" }}>
              {!isRegistered && isActive && (
                <button className="btn btn-secondary" onClick={handleRegister} disabled={registering}>
                  {registering ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Registering...</> : "Register to Vote"}
                </button>
              )}
              {isRegistered && !hasVoted && isActive && (
                <button className="btn btn-primary" onClick={() => setShowVoteModal(true)}>
                  🗳 Cast Your Vote
                </button>
              )}
              {hasVoted && (
                <div style={{
                  background: "var(--accent-green-dim)", border: "1px solid rgba(16,185,129,0.2)",
                  borderRadius: "var(--radius-md)", padding: "10px 16px", fontSize: 13,
                  color: "var(--accent-green)", display: "flex", alignItems: "center", gap: 8
                }}>
                  ✓ You have voted in this election
                  {voterStatus?.vote?.txHash && (
                    <span className="tx-hash" onClick={() => { copyToClipboard(voterStatus.vote.txHash); toast.success("Copied!"); }}>
                      {truncateTxHash(voterStatus.vote.txHash)}
                    </span>
                  )}
                </div>
              )}
              {isRegistered && !isActive && !hasVoted && (
                <div style={{ fontSize: 13, color: "var(--text-muted)", padding: "10px 16px", background: "var(--bg-elevated)", borderRadius: "var(--radius-md)" }}>
                  ✓ Registered — Election not active
                </div>
              )}
            </div>
          )}

          {!isAuthenticated && (
            <button className="btn btn-primary mt-16" onClick={() => navigate("/login")}>
              Sign In to Vote →
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 mb-24">
        {["vote", "results"].map((tab) => (
          <button
            key={tab}
            className={`btn btn-sm ${activeTab === tab ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveTab(tab)}
            style={{ textTransform: "capitalize" }}
          >
            {tab === "vote" ? "Candidates" : "Live Results"}
          </button>
        ))}
      </div>

      {/* Candidates Tab */}
      {activeTab === "vote" && (
        <div>
          <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            Candidates ({election.candidates?.length || 0})
          </h2>
          {election.candidates?.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>
              No candidates added yet.
            </div>
          ) : (
            election.candidates.map((c) => {
              const voteCount = results?.results?.find((r) => r.blockchainId === c.blockchainId)?.voteCount || 0;
              const pct = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : "0.0";
              const isWinner = results?.winner?.blockchainId === c.blockchainId;

              return (
                <div
                  key={c._id || c.blockchainId}
                  className={`candidate-option ${selectedCandidate?.blockchainId === c.blockchainId ? "selected" : ""}`}
                  onClick={() => !hasVoted && isActive && setSelectedCandidate(c)}
                  style={{ position: "relative" }}
                >
                  {isWinner && (
                    <div style={{
                      position: "absolute", top: 12, right: 16,
                      background: "var(--accent-amber-dim)", border: "1px solid rgba(245,158,11,0.3)",
                      borderRadius: "var(--radius-sm)", padding: "2px 8px",
                      fontSize: 11, color: "var(--accent-amber)", fontWeight: 700
                    }}>
                      🏆 Winner
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%",
                      background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: 18, flexShrink: 0, color: "white"
                    }}>
                      {c.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="candidate-name">{c.name}</div>
                      <div className="candidate-party">{c.party}</div>
                      {c.description && (
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>
                          {c.description}
                        </div>
                      )}

                      {(status === "ended" || status === "finalized" || hasVoted) && (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                            <span className="text-secondary">{voteCount} votes</span>
                            <span className="text-cyan font-mono">{pct}%</span>
                          </div>
                          <div className="progress-bar-wrap">
                            <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedCandidate?.blockchainId === c.blockchainId && (
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%",
                        background: "var(--accent-cyan)", display: "flex",
                        alignItems: "center", justifyContent: "center", flexShrink: 0
                      }}>
                        <span style={{ fontSize: 12, color: "#060810", fontWeight: 700 }}>✓</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {selectedCandidate && isActive && !hasVoted && (
            <div style={{ marginTop: 16, textAlign: "right" }}>
              <button className="btn btn-primary btn-lg" onClick={() => setShowVoteModal(true)}>
                Vote for {selectedCandidate.name} →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results Tab */}
      {activeTab === "results" && results && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>
              Live Results
            </h2>
            <span className="text-muted" style={{ fontSize: 13 }}>{totalVotes} total votes</span>
          </div>

          {results.winner && (
            <div style={{
              background: "var(--accent-amber-dim)", border: "1px solid rgba(245,158,11,0.2)",
              borderRadius: "var(--radius-lg)", padding: 20, marginBottom: 20,
              display: "flex", alignItems: "center", gap: 14
            }}>
              <span style={{ fontSize: 32 }}>🏆</span>
              <div>
                <div style={{ fontSize: 11, color: "var(--accent-amber)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
                  {status === "finalized" ? "Winner" : "Currently Leading"}
                </div>
                <div className="font-display" style={{ fontSize: 20, fontWeight: 700 }}>{results.winner.name}</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {results.winner.party} · {results.winner.voteCount} votes ({results.winner.percentage}%)
                </div>
              </div>
            </div>
          )}

          {results.results?.map((c, i) => (
            <div key={c._id || `${c.blockchainId}-${i}`} style={{
              background: "var(--bg-elevated)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)", padding: 16, marginBottom: 10
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <span className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)", width: 20 }}>#{i + 1}</span>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${i === 0 ? "var(--accent-cyan), var(--accent-purple)" : "var(--bg-card), var(--border)"})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, color: i === 0 ? "white" : "var(--text-muted)", flexShrink: 0
                }}>
                  {c.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{c.party}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="font-mono text-cyan" style={{ fontSize: 16, fontWeight: 700 }}>{c.percentage}%</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.voteCount} votes</div>
                </div>
              </div>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width: `${c.percentage}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* One-time Election Wallet Modal */}
      {issuedWallet && (
        <div className="modal-overlay" onClick={() => {}}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Your Election Wallet</h2>
            <div style={{
              background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)",
              borderRadius: "var(--radius-md)", padding: "12px 14px",
              fontSize: 13, color: "var(--text-secondary)", marginBottom: 16
            }}>
              ⚠️ A fresh wallet was generated just for this election. Save the private key now —
              you will need it to cast your vote and it will <strong>not be shown again</strong>.
            </div>

            <div className="form-group">
              <label className="form-label">Wallet Address (this election)</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <code className="font-mono" style={{
                  fontSize: 12, color: "var(--accent-cyan)", wordBreak: "break-all", flex: 1
                }}>{issuedWallet.address}</code>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => { copyToClipboard(issuedWallet.address); toast.success("Address copied!"); }}
                >Copy</button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Private Key (save it!)</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <code className="font-mono" style={{
                  fontSize: 12, color: "var(--accent-amber)", wordBreak: "break-all", flex: 1
                }}>{issuedWallet.privateKey}</code>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => { copyToClipboard(issuedWallet.privateKey); toast.success("Private key copied!"); }}
                >Copy</button>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setIssuedWallet(null)}
              style={{ width: "100%" }}
            >
              I've saved my key — continue
            </button>
          </div>
        </div>
      )}

      {/* Vote Modal */}
      {showVoteModal && (
        <div className="modal-overlay" onClick={() => !voting && setShowVoteModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Confirm Your Vote</h2>

            {selectedCandidate && (
              <div style={{
                background: "var(--accent-cyan-dim)", border: "1px solid rgba(0,212,255,0.2)",
                borderRadius: "var(--radius-lg)", padding: 16, marginBottom: 20
              }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Voting for</div>
                <div className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>{selectedCandidate.name}</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{selectedCandidate.party}</div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Election Private Key</label>
              <input
                type="password"
                className="form-input font-mono"
                placeholder="0x..."
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                style={{ fontSize: 13 }}
              />
              <div className="form-hint">
                Paste the private key that was generated for you when you registered
                for <strong>this</strong> election. Each election has its own wallet.
              </div>
              {voterStatus?.electionWalletAddress && (
                <div className="form-hint font-mono" style={{ marginTop: 6, fontSize: 11 }}>
                  Wallet address: {voterStatus.electionWalletAddress}
                </div>
              )}
            </div>

            <div style={{
              background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
              borderRadius: "var(--radius-md)", padding: "10px 14px",
              fontSize: 12, color: "var(--text-secondary)", marginBottom: 20
            }}>
              ⚠️ This action is <strong>irreversible</strong>. Your vote will be permanently recorded on the blockchain.
            </div>

            <div className="flex gap-12">
              <button
                className="btn btn-secondary"
                onClick={() => { setShowVoteModal(false); setPrivateKey(""); }}
                disabled={voting}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleVote}
                disabled={voting || !privateKey.trim()}
                style={{ flex: 1 }}
              >
                {voting ? (
                  <><div className="spinner" style={{ width: 14, height: 14 }} /> Submitting...</>
                ) : "Submit Vote →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
