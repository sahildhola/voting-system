import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";

const emptyCandidate = { name: "", party: "", description: "", imageUrl: "" };

export default function AdminCreateElection() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
  });
  const [candidates, setCandidates] = useState([{ ...emptyCandidate }, { ...emptyCandidate }]);
  const [loading, setLoading] = useState(false);

  const updateField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const updateCandidate = (i, k, v) => {
    setCandidates((cs) => cs.map((c, idx) => (idx === i ? { ...c, [k]: v } : c)));
  };

  const addCandidate = () => setCandidates((cs) => [...cs, { ...emptyCandidate }]);
  const removeCandidate = (i) => {
    if (candidates.length <= 2) { toast.error("Minimum 2 candidates required"); return; }
    setCandidates((cs) => cs.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validCandidates = candidates.filter((c) => c.name.trim() && c.party.trim());
    if (validCandidates.length < 2) {
      toast.error("At least 2 candidates with name and party are required");
      return;
    }

    const start = new Date(form.startTime);
    const end = new Date(form.endTime);
    if (end <= start) {
      toast.error("End time must be after start time");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/elections", {
        ...form,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        candidates: validCandidates,
      });
      toast.success("Election created on the blockchain!");
      navigate(`/elections/${res.data.election._id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create election");
    } finally {
      setLoading(false);
    }
  };

  // Default start/end times helpers
  const setQuickTime = (hoursFromNow, durationHours) => {
    const start = new Date(Date.now() + hoursFromNow * 3600000);
    const end = new Date(start.getTime() + durationHours * 3600000);
    const toLocal = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    updateField("startTime", toLocal(start));
    updateField("endTime", toLocal(end));
  };

  return (
    <div className="page-container" style={{ maxWidth: 760 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate("/admin")} style={{ marginBottom: 20 }}>
        ← Back to Dashboard
      </button>

      <div className="page-header">
        <h1 className="page-title">Create New Election</h1>
        <p className="page-subtitle">Election details will be recorded on the Hardhat blockchain</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div className="card mb-24">
          <div className="card-header">
            <span className="font-display" style={{ fontWeight: 700 }}>Election Details</span>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Election Title *</label>
              <input
                className="form-input"
                placeholder="e.g. 2024 City Council Election"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                placeholder="Describe the purpose and scope of this election..."
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={3}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Start Date & Time *</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={form.startTime}
                  onChange={(e) => updateField("startTime", e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Date & Time *</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={form.endTime}
                  onChange={(e) => updateField("endTime", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex gap-8">
              <span className="form-hint">Quick set:</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setQuickTime(0.1, 1)}>Starts now (1h)</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setQuickTime(1, 24)}>In 1h (24h)</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setQuickTime(24, 72)}>Tomorrow (3d)</button>
            </div>
          </div>
        </div>

        {/* Candidates */}
        <div className="card mb-24">
          <div className="card-header">
            <span className="font-display" style={{ fontWeight: 700 }}>Candidates</span>
            <span className="text-muted" style={{ fontSize: 13 }}>{candidates.filter(c => c.name).length} added</span>
          </div>
          <div className="card-body">
            {candidates.map((c, i) => (
              <div key={i} style={{
                background: "var(--bg-elevated)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)", padding: 20, marginBottom: 16, position: "relative"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <span className="font-mono text-cyan" style={{ fontSize: 12 }}>Candidate #{i + 1}</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-red"
                    onClick={() => removeCandidate(i)}
                    style={{ fontSize: 18, padding: "2px 8px" }}
                  >
                    ×
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Full Name *</label>
                    <input
                      className="form-input"
                      placeholder="Candidate name"
                      value={c.name}
                      onChange={(e) => updateCandidate(i, "name", e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Party / Affiliation *</label>
                    <input
                      className="form-input"
                      placeholder="Political party or group"
                      value={c.party}
                      onChange={(e) => updateCandidate(i, "party", e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: 12, marginBottom: 0 }}>
                  <label className="form-label">Brief Description</label>
                  <input
                    className="form-input"
                    placeholder="Short candidate bio or platform summary"
                    value={c.description}
                    onChange={(e) => updateCandidate(i, "description", e.target.value)}
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              className="btn btn-secondary btn-full"
              onClick={addCandidate}
              style={{ borderStyle: "dashed" }}
            >
              + Add Another Candidate
            </button>
          </div>
        </div>

        {/* Blockchain Info */}
        <div style={{
          background: "var(--accent-cyan-dim)", border: "1px solid rgba(0,212,255,0.15)",
          borderRadius: "var(--radius-lg)", padding: 16, marginBottom: 24, fontSize: 13,
          color: "var(--text-secondary)", lineHeight: 1.7
        }}>
          <div style={{ fontWeight: 600, color: "var(--accent-cyan)", marginBottom: 4 }}>⛓ Blockchain Recording</div>
          This election and all its candidates will be recorded as immutable transactions on your local Hardhat blockchain.
          Each action generates a transaction hash you can verify independently.
        </div>

        <div className="flex gap-12" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate("/admin")}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? (
              <><div className="spinner" style={{ width: 16, height: 16 }} /> Creating on Blockchain...</>
            ) : "⛓ Create Election →"}
          </button>
        </div>
      </form>
    </div>
  );
}
