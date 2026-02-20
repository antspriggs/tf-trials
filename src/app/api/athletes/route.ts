import { NextRequest, NextResponse } from 'next/server';
import { getAllAthletes, registerAthlete, searchAthletes } from '@/lib/queries/athletes';
import { seedDefaultEvents } from '@/lib/queries/events';
import { DEFAULT_EVENTS } from '@/lib/constants';

export function GET(request: NextRequest) {
  seedDefaultEvents(DEFAULT_EVENTS);
  const query = request.nextUrl.searchParams.get('q');
  const athletes = query ? searchAthletes(query) : getAllAthletes();
  return NextResponse.json(athletes);
}

export function POST(request: NextRequest) {
  return request.json().then(body => {
    const { student_id, first_name, last_name, grade, gender } = body;

    if (!student_id || !first_name || !last_name || !grade || !gender) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['M', 'F'].includes(gender)) {
      return NextResponse.json({ error: 'Gender must be M or F' }, { status: 400 });
    }

    try {
      const athlete = registerAthlete({
        student_id,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        grade: parseInt(grade),
        gender,
      });
      return NextResponse.json(athlete, { status: 201 });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      if (message.includes('UNIQUE constraint failed')) {
        return NextResponse.json({ error: 'Student ID already registered' }, { status: 409 });
      }
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
