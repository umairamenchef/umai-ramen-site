import { type NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Stub — full HMAC validation and revalidateTag wiring in Phase 3 (FOUND-07)
  return NextResponse.json(
    { message: 'Revalidation endpoint not yet configured. See Phase 3.' },
    { status: 501 }
  );
}
