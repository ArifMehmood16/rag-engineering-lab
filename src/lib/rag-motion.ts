/** Each recorded packet finishes its own path once; offsets delay departure. */
export function theatreProgress(seconds: number, delay = 0): number {
  return Math.max(0, Math.min(1, seconds / 10 - delay));
}
