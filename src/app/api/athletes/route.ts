import { NextRequest, NextResponse } from 'next/server';
import { getAllAthletes, registerAthlete, searchAthletes } from '@/lib/queries/athletes';
import { seedDefaultEvents } from '@/lib/queries/events';
import { initSchema } from '@/lib/db';
import { DEFAULT_EVENTS } from '@/lib/constants';

export async function GET(request: NextRequest) {
  await initSchema();
  await seedDefaultEvents(DEFAULT_EVENTS);
  const query = request.nextUrl.searchParams.get('q');
  const athletes = query ? await searchAthletes(query) : await getAllAthletes();
  return NextResponse.json(athletes);
}

export async function POST(request: NextRequest) {
  await initSchema();
  const body = await request.json();
  const { student_id, first_name, last_name, grade, gender } = body;

  if (!student_id || !first_name || !last_name || !grade || !gender) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!['M', 'F'].includes(gender)) {
    return NextResponse.json({ error: 'Gender must be M or F' }, { status: 400 });
  }

  try {
    const athlete = await registerAthlete({
      student_id,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      grade: parseInt(grade),
      gender,
    });
    return NextResponse.json(athlete, { status: 201 });
  } catch (err: unknown) {
    const isUniqueViolation = err && typeof err === 'object' && 'code' in err && err.code === '23505';
    if (isUniqueViolation) {
      return NextResponse.json({ error: 'Student ID already registered' }, { status: 409 });
    }
    const message = err instanceof Error ? err.message : 'Registration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
