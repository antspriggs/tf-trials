import { NextRequest, NextResponse } from 'next/server';
import { deleteBib } from '@/lib/queries/bibs';
import { initSchema } from '@/lib/db';

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ bib_number: string }> }) {
  await initSchema();
  const { bib_number } = await params;
  const bibNum = parseInt(bib_number);
  if (isNaN(bibNum)) {
    return NextResponse.json({ error: 'Invalid bib number' }, { status: 400 });
  }
  const deleted = await deleteBib(bibNum);
  if (!deleted) {
    return NextResponse.json({ error: 'Bib not found or is assigned' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
