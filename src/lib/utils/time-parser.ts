/**
 * Parses time strings into total seconds.
 * Supports formats: "mm:ss.xx", "ss.xx", "ss"
 */
export function parseTime(input: string): { raw: number; display: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // mm:ss.xx or m:ss.xx
  const mmssMatch = trimmed.match(/^(\d+):(\d{1,2}(?:\.\d+)?)$/);
  if (mmssMatch) {
    const minutes = parseInt(mmssMatch[1], 10);
    const seconds = parseFloat(mmssMatch[2]);
    if (seconds >= 60) return null;
    const totalSeconds = minutes * 60 + seconds;
    return { raw: totalSeconds, display: trimmed };
  }

  // ss.xx or ss (plain number)
  const num = parseFloat(trimmed);
  if (!isNaN(num) && num >= 0) {
    return { raw: num, display: trimmed };
  }

  return null;
}

/**
 * Formats total seconds back to display string.
 */
export function formatTime(totalSeconds: number): string {
  if (totalSeconds >= 60) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds - minutes * 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${parseFloat(seconds.toFixed(2))}`;
  }
  return `${parseFloat(totalSeconds.toFixed(2))}`;
}
