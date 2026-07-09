import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['CUSTOMER', 'VENDOR']).default('CUSTOMER'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name, role } = registerSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 존재하는 이메일입니다' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
    })

    if (role === 'CUSTOMER') {
      await prisma.customerProfile.create({
        data: {
          userId: user.id,
        },
      })
    }

    return NextResponse.json(
      { message: '회원가입 성공', userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: '회원가입 실패' },
      { status: 500 }
    )
  }
}
