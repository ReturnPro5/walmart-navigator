export function daysBetween(start?: string, end?: string): number | null {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
  return Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}
