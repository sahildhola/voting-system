import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { truncateAddress } from "../utils/helpers";

export default function BlockchainBar() {
  const [stats, setStats] = useState(null);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/blockchain/stats");
        setStats(res.data.stats);
        setOnline(true);
      } catch {
        setOnline(false);
      }
    };
    fetch();
    const interval = setInterval(fetch, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="blockchain-bar">
      <div className="blockchain-bar-item">
        <span className={online ? "dot-live" : "dot-offline"} />
        <span>{online ? "Hardhat Local" : "Blockchain Offline"}</span>
      </div>
      {stats && (
        <>
          <div className="blockchain-bar-item">
            <span>Block #{stats.blockNumber}</span>
          </div>
          <div className="blockchain-bar-item">
            <span>Chain {stats.chainId}</span>
          </div>
          <div className="blockchain-bar-item">
            <span>{truncateAddress(stats.contractAddress)}</span>
          </div>
          <div className="blockchain-bar-item">
            <span>{stats.electionCount} elections · {stats.candidateCount} candidates</span>
          </div>
        </>
      )}
    </div>
  );
}
