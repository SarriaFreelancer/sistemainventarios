import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../../lib/prisma';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Datos inválidos' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.json({ message: 'El correo ya está registrado' }, { status: 409 });
  }

  const password = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.create({ data: { name: parsed.data.name, email: parsed.data.email, password, role: { connect: { name: 'ADMIN' } } } });

  return NextResponse.json({ ok: true });
}
