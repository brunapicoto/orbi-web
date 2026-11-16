/** The host is always anonymous: at most, how many friends you share with them. */
export function hostLine(n: number | null | undefined) {
  if (!n) return "someone is hosting";
  return `someone with ${n} ${n === 1 ? "mutual" : "mutuals"} is hosting`;
}
