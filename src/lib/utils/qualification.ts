import type { Event } from '../types';
import { parseTime } from './time-parser';
import { parseDistance } from './distance-parser';

export type QualStatus = 'automatic' | 'provisional' | 'dnq';

/**
 * Determines qualification status based on event type, gender, and thresholds.
 *
 * Time events: lower is better (rawValue <= autoQualify = automatic)
 * Distance/height events: higher is better (rawValue >= autoQualify = automatic)
 *
 * Uses gender-specific thresholds when available, falls back to gender-neutral.
 */
export function determineQualification(
  rawValue: number,
  event: Pick<Event, 'type' | 'auto_qualify' | 'prov_qualify' | 'auto_qualify_m' | 'prov_qualify_m' | 'auto_qualify_f' | 'prov_qualify_f'>,
  gender?: 'M' | 'F'
): QualStatus {
  const { type } = event;

  // Pick gender-specific thresholds, falling back to gender-neutral
  let auto_qualify: number | null;
  let prov_qualify: number | null;
  if (gender === 'M') {
    auto_qualify = event.auto_qualify_m ?? event.auto_qualify;
    prov_qualify = event.prov_qualify_m ?? event.prov_qualify;
  } else if (gender === 'F') {
    auto_qualify = event.auto_qualify_f ?? event.auto_qualify;
    prov_qualify = event.prov_qualify_f ?? event.prov_qualify;
  } else {
    auto_qualify = event.auto_qualify;
    prov_qualify = event.prov_qualify;
  }

  // No standards set
  if (auto_qualify === null && prov_qualify === null) {
    return 'dnq';
  }

  if (type === 'time') {
    // Lower is better
    if (auto_qualify !== null && rawValue <= auto_qualify) {
      return 'automatic';
    }
    if (prov_qualify !== null && rawValue <= prov_qualify) {
      return 'provisional';
    }
    return 'dnq';
  } else {
    // Distance/height: higher is better
    if (auto_qualify !== null && rawValue >= auto_qualify) {
      return 'automatic';
    }
    if (prov_qualify !== null && rawValue >= prov_qualify) {
      return 'provisional';
    }
    return 'dnq';
  }
}

/**
 * Parse a performance value based on event type.
 */
export function parsePerformanceValue(
  input: string,
  eventType: 'time' | 'distance' | 'height'
): { raw: number; display: string } | null {
  if (eventType === 'time') {
    return parseTime(input);
  } else {
    return parseDistance(input);
  }
}
