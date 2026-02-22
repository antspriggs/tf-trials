/**
 * Parses distance/height strings into a numeric value (feet).
 * Supports formats: "5'10\"", "5'10", "5' 10\"", plain numbers, meters
 */
export function parseDistance(input: string): { raw: number; display: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Feet-inches: 18-6, 18-6.5
  const dashMatch = trimmed.match(/^(\d+)-(\d+(?:\.\d+)?)$/);
  if (dashMatch) {
    const feet = parseInt(dashMatch[1], 10);
    const inches = parseFloat(dashMatch[2]);
    const totalFeet = feet + inches / 12;
    return { raw: totalFeet, display: trimmed };
  }

  // Feet and inches: 5'10", 5'10, 5' 10"
  const feetInchMatch = trimmed.match(/^(\d+)['']\s*(\d+(?:\.\d+)?)["""]?\s*$/);
  if (feetInchMatch) {
    const feet = parseInt(feetInchMatch[1], 10);
    const inches = parseFloat(feetInchMatch[2]);
    const totalFeet = feet + inches / 12;
    return { raw: totalFeet, display: trimmed };
  }

  // Feet only: 5'
  const feetOnlyMatch = trimmed.match(/^(\d+(?:\.\d+)?)['']\s*$/);
  if (feetOnlyMatch) {
    const feet = parseFloat(feetOnlyMatch[1]);
    return { raw: feet, display: trimmed };
  }

  // Meters: 1.5m
  const meterMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*m$/i);
  if (meterMatch) {
    const meters = parseFloat(meterMatch[1]);
    const feet = meters * 3.28084;
    return { raw: feet, display: trimmed };
  }

  // Plain number (assumed to be in the event's unit - feet)
  const num = parseFloat(trimmed);
  if (!isNaN(num) && num >= 0) {
    return { raw: num, display: trimmed };
  }

  return null;
}

/**
 * Formats a numeric feet value to display string.
 */
export function formatDistance(feet: number): string {
  const wholeFeet = Math.floor(feet);
  const inches = (feet - wholeFeet) * 12;
  if (inches < 0.05) {
    return `${wholeFeet}'`;
  }
  return `${wholeFeet}' ${parseFloat(inches.toFixed(1))}"`;
}
