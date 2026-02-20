import { NextRequest, NextResponse } from 'next/server';
import { getAthleteById, updateAthlete, deleteAthlete } from '@/lib/queries/athletes';

export function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return params.then(({ id }) => {
    const athlete = getAthleteById(parseInt(id));
    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }
    return NextResponse.json(athlete);
  });
}

export function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return Promise.all([request.json(), params]).then(([body, { id }]) => {
    const athlete = updateAthlete(parseInt(id), body);
    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }
    return NextResponse.json(athlete);
  });
}

export function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return params.then(({ id }) => {
    const deleted = deleteAthlete(parseInt(id));
    if (!deleted) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  });
}
