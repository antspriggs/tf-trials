import { NextRequest, NextResponse } from 'next/server';
import { getAllEvents, createEvent, seedDefaultEvents } from '@/lib/queries/events';
import { initSchema } from '@/lib/db';
import { DEFAULT_EVENTS } from '@/lib/constants';

export async function GET() {
  await initSchema();
  await seedDefaultEvents(DEFAULT_EVENTS);
  return NextResponse.json(await getAllEvents());
}

export async function POST(request: NextRequest) {
  await initSchema();
  const body = await request.json();
  const { name, type, unit, auto_qualify, prov_qualify, sort_order } = body;

  if (!name || !type) {
    return NextResponse.json({ error: 'Name and type required' }, { status: 400 });
  }

  if (!['time', 'distance', 'height'].includes(type)) {
    return NextResponse.json({ error: 'Type must be time, distance, or height' }, { status: 400 });
  }

  const event = await createEvent({
    name,
    type,
    unit: unit || (type === 'time' ? 'seconds' : 'feet'),
    auto_qualify: auto_qualify !== undefined && auto_qualify !== '' ? parseFloat(auto_qualify) : null,
    prov_qualify: prov_qualify !== undefined && prov_qualify !== '' ? parseFloat(prov_qualify) : null,
    auto_qualify_m: null,
    prov_qualify_m: null,
    auto_qualify_f: null,
    prov_qualify_f: null,
    sort_order: sort_order || 99,
  });
  return NextResponse.json(event, { status: 201 });
}
