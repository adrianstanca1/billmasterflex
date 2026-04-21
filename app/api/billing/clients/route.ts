import type { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { client } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(client)
    .where(eq(client.userId, session.user.id));

  return Response.json(rows);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, email, phone, address } = body;

  if (!name) {
    return Response.json({ error: 'name is required' }, { status: 400 });
  }

  const [row] = await db
    .insert(client)
    .values({ userId: session.user.id, name, email, phone, address })
    .returning();

  return Response.json(row, { status: 201 });
}
