import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { truncateAddress, formatDate } from "../utils/helpers";
import toast from "react-hot-toast";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [regModal, setRegModal] = useState(null); // { user }
  const [selectedElection, setSelectedElection] = useState("");
  const [registering, setRegistering] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (search) params.set("search", search);

      const [usersRes, elRes] = await Promise.all([
        api.get(`/admin/users?${params}`),
        api.get("/elections?limit=50"),
      ]);
      setUsers(usersRes.data.users);
      setPagination(usersRes.data.pagination);
      setElections(elRes.data.elections);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [roleFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  const toggleUser = async (id) => {
    try {
      const res = await api.patch(`/admin/users/${id}/toggle`);
      toast.success(res.data.message);
      setUsers((us) => us.map((u) => u._id === id ? { ...u, isActive: !u.isActive } : u));
    } catch {
      toast.error("Failed to update user");
    }
  };

  const registerVoter = async () => {
    if (!selectedElection) { toast.error("Select an election"); return; }
    setRegistering(true);
    try {
      await api.post("/admin/register-voter", {
        userId: regModal.user._id,
        electionId: selectedElection,
      });
      toast.success(`${regModal.user.name} registered for election!`);
      setRegModal(null);
      setSelectedElection("");
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <p className="page-subtitle">{pagination.total} total users</p>
      </div>

      {/* Search & Filter */}
      <form onSubmit={handleSearch} className="flex gap-12 mb-24" style={{ flexWrap: "wrap" }}>
        <input
          className="form-input"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <div className="flex gap-8">
          {["all", "voter", "admin"].map((r) => (
            <button
              key={r}
              type="button"
              className={`btn btn-sm ${roleFilter === r ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setRoleFilter(r)}
              style={{ textTransform: "capitalize" }}
            >
              {r}
            </button>
          ))}
        </div>
        <button type="submit" className="btn btn-secondary btn-sm">Search</button>
      </form>

      <div className="card">
        {loading ? (
          <div className="page-loader" style={{ minHeight: 200 }}>
            <div className="spinner" />
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Wallet</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>No users found</td></tr>
                ) : users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: "50%",
                          background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 700, fontSize: 13, color: "white", flexShrink: 0
                        }}>
                          {u.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.role === "admin" ? "badge-admin" : "badge-voter"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.walletAddress ? (
                        <span
                          className="tx-hash"
                          onClick={() => { navigator.clipboard.writeText(u.walletAddress); toast.success("Copied!"); }}
                        >
                          {truncateAddress(u.walletAddress)}
                        </span>
                      ) : <span className="text-muted" style={{ fontSize: 12 }}>—</span>}
                    </td>
                    <td className="text-secondary" style={{ fontSize: 12 }}>{formatDate(u.createdAt)}</td>
                    <td>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 12, fontWeight: 600,
                        color: u.isActive ? "var(--accent-green)" : "var(--accent-red)"
                      }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: u.isActive ? "var(--accent-green)" : "var(--accent-red)"
                        }} />
                        {u.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-8">
                        {u.role === "voter" && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => { setRegModal({ user: u }); setSelectedElection(""); }}
                          >
                            Register
                          </button>
                        )}
                        <button
                          className={`btn btn-sm ${u.isActive ? "btn-danger" : "btn-secondary"}`}
                          onClick={() => toggleUser(u._id)}
                        >
                          {u.isActive ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex-center gap-8 mt-16">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`btn btn-sm ${pagination.page === p ? "btn-primary" : "btn-secondary"}`}
              onClick={() => load(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Register Voter Modal */}
      {regModal && (
        <div className="modal-overlay" onClick={() => setRegModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Register Voter for Election</h2>
            <div style={{
              background: "var(--bg-elevated)", borderRadius: "var(--radius-md)",
              padding: "12px 16px", marginBottom: 20, fontSize: 13
            }}>
              <span className="text-secondary">Voter: </span>
              <strong>{regModal.user.name}</strong>
              <span className="text-muted" style={{ marginLeft: 8 }}>({regModal.user.email})</span>
            </div>

            <div className="form-group">
              <label className="form-label">Select Election *</label>
              <select
                className="form-input"
                value={selectedElection}
                onChange={(e) => setSelectedElection(e.target.value)}
              >
                <option value="">— Choose an election —</option>
                {elections.map((e) => (
                  <option key={e._id} value={e._id}>{e.title}</option>
                ))}
              </select>
            </div>

            <div className="form-hint" style={{ marginBottom: 20 }}>
              This will register the voter's wallet address on the blockchain, allowing them to cast a vote.
            </div>

            <div className="flex gap-12">
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setRegModal(null)}>Cancel</button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={registerVoter}
                disabled={registering || !selectedElection}
              >
                {registering ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Registering...</> : "Register on Blockchain"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
