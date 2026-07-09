import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const cartUpdateSchema = z.object({
  quantity: z.number().int().min(1),
})

// PUT /api/customer/cart/[id] - 장바구니 아이템 수량 수정
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: params.id },
      include: { product: true },
    })

    if (!cartItem) {
      return NextResponse.json(
        { error: '장바구니 아이템을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (cartItem.userId !== session.user.id) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { quantity } = cartUpdateSchema.parse(body)

    if (cartItem.product.stock < quantity) {
      return NextResponse.json(
        { error: '재고가 부족합니다' },
        { status: 400 }
      )
    }

    const updatedCartItem = await prisma.cartItem.update({
      where: { id: params.id },
      data: { quantity },
      include: { product: true },
    })

    return NextResponse.json(updatedCartItem)
  } catch (error) {
    console.error('Cart update error:', error)
    return NextResponse.json(
      { error: '장바구니 수정 실패' },
      { status: 500 }
    )
  }
}

// DELETE /api/customer/cart/[id] - 장바구니 아이템 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: params.id },
    })

    if (!cartItem) {
      return NextResponse.json(
        { error: '장바구니 아이템을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (cartItem.userId !== session.user.id) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    await prisma.cartItem.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: '장바구니 아이템 삭제 성공' })
  } catch (error) {
    console.error('Cart deletion error:', error)
    return NextResponse.json(
      { error: '장바구니 삭제 실패' },
      { status: 500 }
    )
  }
}
