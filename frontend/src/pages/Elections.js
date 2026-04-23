import React, { useEffect, useState } from "react";
import api from "../utils/api";
import ElectionCard from "../components/ElectionCard";
import toast from "react-hot-toast";

const FILTERS = ["all", "active", "pending", "ended", "finalized"];

export default function Elections() {
  const [elections, setElections] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = filter !== "all" ? `?status=${filter}` : "";
        const res = await api.get(`/elections${params}`);
        setElections(res.data.elections);
      } catch {
        toast.error("Failed to load elections");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filter]);

  const filtered = elections.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Elections</h1>
        <p className="page-subtitle">Browse and participate in blockchain-secured elections</p>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-12 mb-24" style={{ flexWrap: "wrap" }}>
        <input
          className="form-input"
          placeholder="Search elections..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <div className="flex gap-8">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilter(f)}
              style={{ textTransform: "capitalize" }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="page-loader">
          <div className="spinner" />
          <span>Loading elections...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text-muted)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🗳</div>
          <div>No elections found.</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
            {filtered.length} election{filtered.length !== 1 ? "s" : ""} found
          </div>
          <div className="election-grid">
            {filtered.map((e) => (
              <ElectionCard key={e._id} election={e} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
