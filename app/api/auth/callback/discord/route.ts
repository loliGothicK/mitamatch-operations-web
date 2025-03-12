'use server';

import { type NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const json = await req.json();
  console.log(json);
  return NextResponse.redirect(`${origin}?token=${json}`);
}
