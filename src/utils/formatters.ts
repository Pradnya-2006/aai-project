export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return "0";
  return num.toLocaleString();
}

export function formatPercent(num: number | undefined | null): string {
  if (num === undefined || num === null) return "0%";
  return `${num}%`;
}

export function formatPad(num: number, digits = 2): string {
  return String(num).padStart(digits, "0");
}
