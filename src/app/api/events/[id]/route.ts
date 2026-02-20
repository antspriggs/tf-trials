import { NextRequest, NextResponse } from 'next/server';
import { getEventById, updateEvent, deleteEvent } from '@/lib/queries/events';
import { recalculateQualifications } from '@/lib/queries/performances';

export function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return params.then(({ id }) => {
    const event = getEventById(parseInt(id));
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json(event);
  });
}

export function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return Promise.all([request.json(), params]).then(([body, { id }]) => {
    const eventId = parseInt(id);
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.type !== undefined) updates.type = body.type;
    if (body.unit !== undefined) updates.unit = body.unit;
    if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
    updates.auto_qualify = body.auto_qualify !== undefined && body.auto_qualify !== '' ? parseFloat(body.auto_qualify) : null;
    updates.prov_qualify = body.prov_qualify !== undefined && body.prov_qualify !== '' ? parseFloat(body.prov_qualify) : null;
    updates.auto_qualify_m = body.auto_qualify_m !== undefined && body.auto_qualify_m !== '' ? parseFloat(body.auto_qualify_m) : null;
    updates.prov_qualify_m = body.prov_qualify_m !== undefined && body.prov_qualify_m !== '' ? parseFloat(body.prov_qualify_m) : null;
    updates.auto_qualify_f = body.auto_qualify_f !== undefined && body.auto_qualify_f !== '' ? parseFloat(body.auto_qualify_f) : null;
    updates.prov_qualify_f = body.prov_qualify_f !== undefined && body.prov_qualify_f !== '' ? parseFloat(body.prov_qualify_f) : null;

    const event = updateEvent(eventId, updates);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Recalculate qualifications when standards change
    recalculateQualifications(eventId);

    return NextResponse.json(event);
  });
}

export function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return params.then(({ id }) => {
    const deleted = deleteEvent(parseInt(id));
    if (!deleted) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  });
}
