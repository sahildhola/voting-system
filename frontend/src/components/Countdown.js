import React, { useEffect, useState } from "react";
import { getTimeRemaining } from "../utils/helpers";

export default function Countdown({ endTime, startTime }) {
  const targetTime = new Date() < new Date(startTime) ? startTime : endTime;
  const [time, setTime] = useState(getTimeRemaining(targetTime));
  const label = new Date() < new Date(startTime) ? "Starts in" : "Ends in";

  useEffect(() => {
    setTime(getTimeRemaining(targetTime));
    const interval = setInterval(() => {
      setTime(getTimeRemaining(targetTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  if (time.ended) return <span className="text-muted font-mono" style={{ fontSize: 13 }}>Ended</span>;

  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>{label}</div>
      <div className="countdown">
        {time.days > 0 && (
          <div className="countdown-unit">
            <span className="countdown-value">{String(time.days).padStart(2, "0")}</span>
            <span className="countdown-label">Days</span>
          </div>
        )}
        <div className="countdown-unit">
          <span className="countdown-value">{String(time.hours).padStart(2, "0")}</span>
          <span className="countdown-label">Hrs</span>
        </div>
        <div className="countdown-unit">
          <span className="countdown-value">{String(time.minutes).padStart(2, "0")}</span>
          <span className="countdown-label">Min</span>
        </div>
        <div className="countdown-unit">
          <span className="countdown-value">{String(time.seconds).padStart(2, "0")}</span>
          <span className="countdown-label">Sec</span>
        </div>
      </div>
    </div>
  );
}
