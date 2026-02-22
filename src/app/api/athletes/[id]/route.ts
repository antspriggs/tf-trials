import { NextRequest, NextResponse } from 'next/server';
import { getAthleteById, updateAthlete, deleteAthlete } from '@/lib/queries/athletes';
import { initSchema } from '@/lib/db';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await initSchema();
  const { id } = await params;
  const athlete = await getAthleteById(parseInt(id));
  if (!athlete) {
    return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
  }
  return NextResponse.json(athlete);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await initSchema();
  const [body, { id }] = await Promise.all([request.json(), params]);
  const athlete = await updateAthlete(parseInt(id), body);
  if (!athlete) {
    return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
  }
  return NextResponse.json(athlete);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await initSchema();
  const { id } = await params;
  const deleted = await deleteAthlete(parseInt(id));
  if (!deleted) {
    return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
