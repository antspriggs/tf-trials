import { NextRequest, NextResponse } from 'next/server';
import { getAllPerformances, createPerformance } from '@/lib/queries/performances';
import { getAthleteById } from '@/lib/queries/athletes';
import { getEventById } from '@/lib/queries/events';
import { parsePerformanceValue } from '@/lib/utils/qualification';

export function GET() {
  return NextResponse.json(getAllPerformances());
}

export function POST(request: NextRequest) {
  return request.json().then(body => {
    const { athlete_id, event_id, value } = body;

    if (!athlete_id || !event_id || value === undefined || value === '') {
      return NextResponse.json({ error: 'athlete_id, event_id, and value required' }, { status: 400 });
    }

    const athlete = getAthleteById(parseInt(athlete_id));
    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    const event = getEventById(parseInt(event_id));
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const parsed = parsePerformanceValue(String(value), event.type);
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid value format' }, { status: 400 });
    }

    try {
      const performance = createPerformance({
        athlete_id: parseInt(athlete_id),
        event_id: parseInt(event_id),
        raw_value: parsed.raw,
        display_value: parsed.display,
      });
      return NextResponse.json(performance, { status: 201 });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create performance';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
