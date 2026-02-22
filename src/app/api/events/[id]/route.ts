import { NextRequest, NextResponse } from 'next/server';
import { getEventById, updateEvent, deleteEvent } from '@/lib/queries/events';
import { recalculateQualifications } from '@/lib/queries/performances';
import { parseTime } from '@/lib/utils/time-parser';
import { parseDistance } from '@/lib/utils/distance-parser';
import { initSchema } from '@/lib/db';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await initSchema();
  const { id } = await params;
  const event = await getEventById(parseInt(id));
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }
  return NextResponse.json(event);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await initSchema();
  const [body, { id }] = await Promise.all([request.json(), params]);
  const eventId = parseInt(id);
  const existing = await getEventById(eventId);
  if (!existing) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const eventType = body.type ?? existing.type;
  const parseStandard = (val: unknown): number | null => {
    if (val === undefined || val === '' || val === null) return null;
    const str = String(val);
    if (eventType === 'time') {
      const parsed = parseTime(str);
      return parsed ? parsed.raw : null;
    }
    if (eventType === 'distance' || eventType === 'height') {
      const parsed = parseDistance(str);
      return parsed ? parsed.raw : null;
    }
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  };

  const updates: Record<string, unknown> = {};

  if (body.name !== undefined) updates.name = body.name;
  if (body.type !== undefined) updates.type = body.type;
  if (body.unit !== undefined) updates.unit = body.unit;
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
  updates.auto_qualify = parseStandard(body.auto_qualify);
  updates.prov_qualify = parseStandard(body.prov_qualify);
  updates.auto_qualify_m = parseStandard(body.auto_qualify_m);
  updates.prov_qualify_m = parseStandard(body.prov_qualify_m);
  updates.auto_qualify_f = parseStandard(body.auto_qualify_f);
  updates.prov_qualify_f = parseStandard(body.prov_qualify_f);

  const event = await updateEvent(eventId, updates);
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  await recalculateQualifications(eventId);

  return NextResponse.json(event);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await initSchema();
  const { id } = await params;
  const deleted = await deleteEvent(parseInt(id));
  if (!deleted) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
