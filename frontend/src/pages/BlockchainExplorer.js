import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { truncateAddress, formatDate } from "../utils/helpers";
import toast from "react-hot-toast";

export default function BlockchainExplorer() {
  const [stats, setStats] = useState(null);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);
  const [blockNum, setBlockNum] = useState(null);

  const loadAll = async () => {
    try {
      const [statsRes, electionsRes] = await Promise.all([
        api.get("/blockchain/stats"),
        api.get("/elections?limit=50"),
      ]);
      setStats(statsRes.data.stats);
      setBlockNum(statsRes.data.stats?.blockNumber);
      setElections(electionsRes.data.elections);
      setOnline(true);
    } catch {
      setOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    const interval = setInterval(() => {
      api.get("/blockchain/stats").then((r) => {
        setStats(r.data.stats);
        setBlockNum(r.data.stats?.blockNumber);
        setOnline(true);
      }).catch(() => setOnline(false));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  if (loading) return <div className="page-loader"><div className="spinner" /><span>Connecting to blockchain...</span></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Blockchain Explorer</h1>
        <p className="page-subtitle">Live view of your local Hardhat blockchain</p>
      </div>

      {/* Network Status */}
      <div className="card mb-24" style={{ borderLeft: `3px solid ${online ? "var(--accent-green)" : "var(--accent-red)"}` }}>
        <div className="card-body">
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className={online ? "dot-live" : "dot-offline"} />
              <span className="font-display" style={{ fontWeight: 700, fontSize: 18 }}>
                {online ? "Network Online" : "Network Offline"}
              </span>
            </div>
            {!online && (
              <span className="text-secondary" style={{ fontSize: 13 }}>
                Start Hardhat node: <code className="font-mono" style={{ color: "var(--accent-cyan)", background: "var(--bg-elevated)", padding: "2px 8px", borderRadius: 4 }}>npx hardhat node</code>
              </span>
            )}
          </div>

          {stats && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginTop: 20 }}>
              {[
                { label: "Network", value: "Hardhat Local" },
                { label: "Chain ID", value: stats.chainId },
                { label: "Block Number", value: `#${blockNum ?? stats.blockNumber}`, highlight: true },
                { label: "Elections", value: stats.electionCount },
                { label: "Candidates", value: stats.candidateCount },
                { label: "RPC Endpoint", value: stats.rpcUrl },
              ].map((item) => (
                <div key={item.label} style={{
                  background: "var(--bg-elevated)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)", padding: "12px 14px"
                }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                    {item.label}
                  </div>
                  <div className="font-mono" style={{ fontSize: 13, color: item.highlight ? "var(--accent-cyan)" : "var(--text-primary)" }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contract Info */}
      {stats?.contractAddress && (
        <div className="card mb-24">
          <div className="card-header">
            <span className="font-display" style={{ fontWeight: 700 }}>Smart Contract</span>
            <span className="badge badge-active"><span className="badge-dot" />Deployed</span>
          </div>
          <div className="card-body">
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                  Contract Address
                </div>
                <code className="font-mono text-cyan" style={{ fontSize: 14 }}>{stats.contractAddress}</code>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => copy(stats.contractAddress)}>
                Copy Address
              </button>
            </div>

            <div style={{
              marginTop: 16, padding: "12px 16px",
              background: "var(--bg-elevated)", borderRadius: "var(--radius-md)",
              fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.8
            }}>
              <strong style={{ color: "var(--text-primary)" }}>VotingSystem.sol</strong>
              <div>Functions: createElection · addCandidate · registerVoter · castVote · finalizeElection</div>
              <div>Events: ElectionCreated · CandidateAdded · VoterRegistered · VoteCast · ElectionFinalized</div>
            </div>
          </div>
        </div>
      )}

      {/* Elections on chain */}
      <div className="card">
        <div className="card-header">
          <span className="font-display" style={{ fontWeight: 700 }}>Elections in Database</span>
          <span className="text-muted font-mono" style={{ fontSize: 12 }}>{elections.length} total</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Chain ID</th>
                <th>Title</th>
                <th>Candidates</th>
                <th>Votes</th>
                <th>Start</th>
                <th>End</th>
                <th>Chain Status</th>
              </tr>
            </thead>
            <tbody>
              {elections.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>
                    No elections found. Create one from the admin dashboard.
                  </td>
                </tr>
              ) : elections.map((e) => (
                <tr key={e._id}>
                  <td>
                    {e.blockchainId ? (
                      <span className="font-mono text-cyan" style={{ fontSize: 13 }}>#{e.blockchainId}</span>
                    ) : (
                      <span className="text-muted" style={{ fontSize: 12 }}>off-chain</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>{e.title}</td>
                  <td className="font-mono" style={{ fontSize: 13 }}>{e.candidates?.length || 0}</td>
                  <td className="font-mono text-cyan" style={{ fontSize: 13 }}>{e.totalVotes ?? 0}</td>
                  <td className="text-secondary" style={{ fontSize: 12 }}>{formatDate(e.startTime)}</td>
                  <td className="text-secondary" style={{ fontSize: 12 }}>{formatDate(e.endTime)}</td>
                  <td>
                    {e.blockchainId ? (
                      <span className="badge badge-active">On-chain</span>
                    ) : (
                      <span className="badge badge-ended">DB only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hardhat accounts reference */}
      <div className="card mt-16">
        <div className="card-header">
          <span className="font-display" style={{ fontWeight: 700 }}>Hardhat Test Accounts</span>
          <span className="text-muted" style={{ fontSize: 12 }}>Use these for local testing</span>
        </div>
        <div className="card-body">
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>
            Each account is pre-funded with 10,000 ETH on the local Hardhat node.
          </div>
          <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", padding: 16, fontFamily: "var(--font-mono)", fontSize: 11, lineHeight: 2, overflowX: "auto" }}>
            {[
              ["Account #0 (Admin)", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"],
              ["Account #1 (Voter)", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"],
              ["Account #2 (Voter)", "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"],
              ["Account #3 (Voter)", "0x90F79bf6EB2c4f870365E785982E1f101E93b906", "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"],
            ].map(([label, addr, key]) => (
              <div key={addr} style={{ display: "flex", gap: 16, alignItems: "flex-start", borderBottom: "1px solid var(--border)", paddingBottom: 6, marginBottom: 6 }}>
                <span style={{ color: "var(--text-muted)", minWidth: 140 }}>{label}</span>
                <div>
                  <span className="text-cyan" style={{ cursor: "pointer" }} onClick={() => copy(addr)}>{addr}</span>
                  <div style={{ color: "var(--accent-amber)", fontSize: 10, cursor: "pointer" }} onClick={() => copy(key)}>
                    PK: {key.slice(0, 20)}...
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="form-hint mt-8">Click any address or key to copy.</div>
        </div>
      </div>
    </div>
  );
}
