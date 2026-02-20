import { NextRequest, NextResponse } from 'next/server';
import { getPerformanceById, updatePerformance, deletePerformance } from '@/lib/queries/performances';
import { getEventById } from '@/lib/queries/events';
import { parsePerformanceValue } from '@/lib/utils/qualification';

export function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return Promise.all([request.json(), params]).then(([body, { id }]) => {
    const perfId = parseInt(id);
    const perf = getPerformanceById(perfId);
    if (!perf) {
      return NextResponse.json({ error: 'Performance not found' }, { status: 404 });
    }

    const event = getEventById(perf.event_id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const parsed = parsePerformanceValue(String(body.value), event.type);
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid value format' }, { status: 400 });
    }

    const updated = updatePerformance(perfId, {
      raw_value: parsed.raw,
      display_value: parsed.display,
    });

    return NextResponse.json(updated);
  });
}

export function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return params.then(({ id }) => {
    const deleted = deletePerformance(parseInt(id));
    if (!deleted) {
      return NextResponse.json({ error: 'Performance not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  });
}
