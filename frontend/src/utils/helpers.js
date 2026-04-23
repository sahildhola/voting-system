import { formatDistanceToNow, format, isAfter, isBefore } from "date-fns";

export const formatDate = (date) =>
  format(new Date(date), "MMM d, yyyy · h:mm a");

export const formatRelative = (date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true });

export const getElectionStatus = (election) => {
  if (election.status === "finalized") return "finalized";
  const now = new Date();
  const start = new Date(election.startTime);
  const end = new Date(election.endTime);
  if (isBefore(now, start)) return "pending";
  if (isAfter(now, end)) return "ended";
  return "active";
};

export const truncateAddress = (address, chars = 6) => {
  if (!address) return "";
  return `${address.slice(0, chars)}...${address.slice(-4)}`;
};

export const truncateTxHash = (hash, chars = 8) => {
  if (!hash) return "";
  return `${hash.slice(0, chars)}...${hash.slice(-6)}`;
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export const getTimeRemaining = (endTime) => {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end - now;

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, ended: false };
};

export const statusBadgeClass = (status) => {
  const map = {
    active: "badge-active",
    pending: "badge-pending",
    ended: "badge-ended",
    finalized: "badge-finalized",
  };
  return `badge ${map[status] || "badge-ended"}`;
};

export const statusLabel = (status) => {
  const map = {
    active: "● Live",
    pending: "Upcoming",
    ended: "Ended",
    finalized: "Finalized",
  };
  return map[status] || status;
};
