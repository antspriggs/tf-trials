import { NextRequest, NextResponse } from 'next/server';
import { getAllBibs, addBibRange, addBibList, getBibStats } from '@/lib/queries/bibs';

export function GET(request: NextRequest) {
  const statsOnly = request.nextUrl.searchParams.get('stats');
  if (statsOnly === '1') {
    return NextResponse.json(getBibStats());
  }
  return NextResponse.json(getAllBibs());
}

export function POST(request: NextRequest) {
  return request.json().then(body => {
    const { range_start, range_end, bibs } = body;

    if (range_start !== undefined && range_end !== undefined) {
      const start = parseInt(range_start);
      const end = parseInt(range_end);
      if (isNaN(start) || isNaN(end) || start < 1 || end < start || end > 9999) {
        return NextResponse.json({ error: 'Invalid range' }, { status: 400 });
      }
      const count = addBibRange(start, end);
      return NextResponse.json({ added: count });
    }

    if (Array.isArray(bibs)) {
      const numbers = bibs.map(Number).filter(n => !isNaN(n) && n > 0);
      if (numbers.length === 0) {
        return NextResponse.json({ error: 'No valid bib numbers' }, { status: 400 });
      }
      const count = addBibList(numbers);
      return NextResponse.json({ added: count });
    }

    return NextResponse.json({ error: 'Provide range_start/range_end or bibs array' }, { status: 400 });
  });
}
