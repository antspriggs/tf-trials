import { NextResponse } from 'next/server';
import { getResults } from '@/lib/queries/performances';
import { getAllEvents, seedDefaultEvents } from '@/lib/queries/events';
import { DEFAULT_EVENTS } from '@/lib/constants';

export function GET() {
  seedDefaultEvents(DEFAULT_EVENTS);
  const results = getResults();
  const events = getAllEvents();
  return NextResponse.json({ results, events });
}
