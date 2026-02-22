import { NextRequest, NextResponse } from 'next/server';
import { getAllPerformances, createPerformance } from '@/lib/queries/performances';
import { getAthleteById } from '@/lib/queries/athletes';
import { getEventById } from '@/lib/queries/events';
import { parsePerformanceValue } from '@/lib/utils/qualification';
import { initSchema } from '@/lib/db';

export async function GET() {
  await initSchema();
  return NextResponse.json(await getAllPerformances());
}

export async function POST(request: NextRequest) {
  await initSchema();
  const body = await request.json();
  const { athlete_id, event_id, value } = body;

  if (!athlete_id || !event_id || value === undefined || value === '') {
    return NextResponse.json({ error: 'athlete_id, event_id, and value required' }, { status: 400 });
  }

  const athlete = await getAthleteById(parseInt(athlete_id));
  if (!athlete) {
    return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
  }

  const event = await getEventById(parseInt(event_id));
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const parsed = parsePerformanceValue(String(value), event.type);
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid value format' }, { status: 400 });
  }

  try {
    const performance = await createPerformance({
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
}
