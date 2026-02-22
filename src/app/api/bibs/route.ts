import { NextRequest, NextResponse } from 'next/server';
import { getAllBibs, addBibRange, addBibList, getBibStats } from '@/lib/queries/bibs';
import { initSchema } from '@/lib/db';

export async function GET(request: NextRequest) {
  await initSchema();
  const statsOnly = request.nextUrl.searchParams.get('stats');
  if (statsOnly === '1') {
    return NextResponse.json(await getBibStats());
  }
  return NextResponse.json(await getAllBibs());
}

export async function POST(request: NextRequest) {
  await initSchema();
  const body = await request.json();
  const { range_start, range_end, bibs } = body;

  if (range_start !== undefined && range_end !== undefined) {
    const start = parseInt(range_start);
    const end = parseInt(range_end);
    if (isNaN(start) || isNaN(end) || start < 1 || end < start || end > 9999) {
      return NextResponse.json({ error: 'Invalid range' }, { status: 400 });
    }
    const count = await addBibRange(start, end);
    return NextResponse.json({ added: count });
  }

  if (Array.isArray(bibs)) {
    const numbers = bibs.map(Number).filter(n => !isNaN(n) && n > 0);
    if (numbers.length === 0) {
      return NextResponse.json({ error: 'No valid bib numbers' }, { status: 400 });
    }
    const count = await addBibList(numbers);
    return NextResponse.json({ added: count });
  }

  return NextResponse.json({ error: 'Provide range_start/range_end or bibs array' }, { status: 400 });
}
