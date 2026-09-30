// lib/deadline.js
import { DEADLINE_HOURS } from "./rules";

export function getDeadlineInfo(createdAtStr, priority, nowMs = Date.now()) {
  const hours = DEADLINE_HOURS[priority] ?? 72;
  const totalMs = hours * 60 * 60 * 1000;
  const createdAtMs = new Date(createdAtStr).getTime();
  
  if (isNaN(createdAtMs)) {
    return {
      status: "on_track",
      remainingMs: totalMs,
      countdown: "--:--",
      percentLeft: 100,
    };
  }

  const deadlineMs = createdAtMs + totalMs;
  const remainingMs = deadlineMs - nowMs;
  const percentLeft = Math.max(0, (remainingMs / totalMs) * 100);

  let status = "on_track";
  if (remainingMs <= 0) {
    status = "late";
  } else if (remainingMs / totalMs < 0.2) {
    status = "at_risk";
  }

  const absSec = Math.abs(Math.floor(remainingMs / 1000));
  const h = Math.floor(absSec / 3600);
  const m = Math.floor((absSec % 3600) / 60);
  const s = absSec % 60;

  const pad = (n) => String(n).padStart(2, "0");
  const prefix = remainingMs < 0 ? "-" : "";

  let countdown = "";
  if (h > 24) {
    const days = Math.floor(h / 24);
    const remH = h % 24;
    countdown = `${prefix}${days}d ${remH}h`;
  } else if (h > 0) {
    countdown = `${prefix}${h}h ${pad(m)}m ${pad(s)}s`;
  } else {
    countdown = `${prefix}${pad(m)}m ${pad(s)}s`;
  }

  return {
    status,
    remainingMs,
    percentLeft,
    countdown,
  };
}
