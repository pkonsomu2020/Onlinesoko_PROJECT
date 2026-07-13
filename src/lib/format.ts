export function ksh(n: number | string) {
  const v = typeof n === "string" ? Number(n) : n;
  return "KSh " + v.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function pct(n: number) {
  return Math.round(n * 100) + "%";
}

export function timeLeft(deadline: string): string {
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return "Ended";
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
