import { NextRequest, NextResponse } from 'next/server';
import { getPerformanceById, updatePerformance, deletePerformance } from '@/lib/queries/performances';
import { getEventById } from '@/lib/queries/events';
import { parsePerformanceValue } from '@/lib/utils/qualification';
import { initSchema } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await initSchema();
  const [body, { id }] = await Promise.all([request.json(), params]);
  const perfId = parseInt(id);
  const perf = await getPerformanceById(perfId);
  if (!perf) {
    return NextResponse.json({ error: 'Performance not found' }, { status: 404 });
  }

  const event = await getEventById(perf.event_id);
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const parsed = parsePerformanceValue(String(body.value), event.type);
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid value format' }, { status: 400 });
  }

  const updated = await updatePerformance(perfId, {
    raw_value: parsed.raw,
    display_value: parsed.display,
  });

  if (!updated) {
    return NextResponse.json({ error: 'Performance not found' }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await initSchema();
  const { id } = await params;
  const deleted = await deletePerformance(parseInt(id));
  if (!deleted) {
    return NextResponse.json({ error: 'Performance not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
