import React from "react";
import { useNavigate } from "react-router-dom";
import { formatDate, getElectionStatus, statusBadgeClass, statusLabel } from "../utils/helpers";

export default function ElectionCard({ election }) {
  const navigate = useNavigate();
  const status = getElectionStatus(election);

  return (
    <div className="election-card" onClick={() => navigate(`/elections/${election._id}`)}>
      <div className="flex-between">
        <span className={statusBadgeClass(status)}>
          {status === "active" && <span className="badge-dot" />}
          {statusLabel(status)}
        </span>
        <span className="text-muted font-mono" style={{ fontSize: 11 }}>
          {election.candidates?.length || 0} candidates
        </span>
      </div>

      <div className="election-title">{election.title}</div>
      <div className="election-description">{election.description}</div>

      <div className="election-meta">
        <div className="election-meta-item">
          <span>📅</span>
          <span>{formatDate(election.startTime)}</span>
        </div>
        <div className="election-meta-item">
          <span>👤</span>
          <span>{election.voterCount || election.registeredVoters?.length || 0} voters</span>
        </div>
        {election.totalVotes > 0 && (
          <div className="election-meta-item">
            <span>🗳</span>
            <span>{election.totalVotes} votes cast</span>
          </div>
        )}
        {election.blockchainId && (
          <div className="election-meta-item">
            <span>⛓</span>
            <span className="text-cyan font-mono" style={{ fontSize: 11 }}>
              on-chain #{election.blockchainId}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
