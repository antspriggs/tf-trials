import { NextResponse } from 'next/server';
import { getResults } from '@/lib/queries/performances';
import { getAllEvents, seedDefaultEvents } from '@/lib/queries/events';
import { initSchema } from '@/lib/db';
import { DEFAULT_EVENTS } from '@/lib/constants';

export async function GET() {
  await initSchema();
  await seedDefaultEvents(DEFAULT_EVENTS);
  const results = await getResults();
  const events = await getAllEvents();
  return NextResponse.json({ results, events });
}
