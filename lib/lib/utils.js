export const DAILY_SECONDS = 36000;
export const HOURLY_RATE = 21;
export const SECONDS_PER_HOUR = 3600;

export function formatSeconds(seconds) {
  seconds = Number(seconds);
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}分${s}秒`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}小时${m}分${s}秒`;
}

export function secondsToHours(seconds) {
  return Math.round((seconds / SECONDS_PER_HOUR) * 10000) / 10000;
}

export function calculateDailyOutput(totalSeconds) {
  if (totalSeconds <= 0) return 0;
  return Math.round((DAILY_SECONDS / totalSeconds) * 100) / 100;
}

export function calculateLaborCost(totalSeconds) {
  const hours = totalSeconds / SECONDS_PER_HOUR;
  return Math.round(hours * HOURLY_RATE * 100) / 100;
}

export function parseTimeInput(input) {
  if (!input) return 0;
  input = String(input).trim();
  if (!input.includes(':')) {
    const n = parseInt(input, 10);
    return isNaN(n) ? 0 : n;
  }
  const parts = input.split(':').map((p) => parseInt(p, 10) || 0);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

export function formatTimeInput(seconds) {
  seconds = Number(seconds);
  if (seconds < 60) return String(seconds);
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
