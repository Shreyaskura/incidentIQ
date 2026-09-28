/**
 * Format a date as a relative time string (e.g. "12 min ago", "2 hr ago")
 * Works without any external dependency.
 */
export function formatDistanceToNow(date) {
  if (!date || isNaN(date)) return 'Unknown';
  const now = Date.now();
  const diffMs = now - date.getTime();
  if (diffMs < 0) return 'Just now';
  const secs = Math.floor(diffMs / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/**
 * Format a date as HH:MM string.
 */
export function formatTime(date) {
  if (!date || isNaN(date)) return '';
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Format a date as "Sep 28, 2026 10:42"
 */
export function formatDateTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d)) return isoString;
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}
