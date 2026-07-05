import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/** Helper to generate JWT */
function generateJwt(payload: { userId: string; role: string }) {
  const secret = process.env.JWT_SECRET || 'default_secret';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

/** POST /api/auth/login */
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });
    if (!user) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    // Generate JWT
    const token = generateJwt({ userId: user.id, role: user.role?.name ?? 'USER' });

    // Return token and basic user info
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role?.name ?? 'USER',
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
