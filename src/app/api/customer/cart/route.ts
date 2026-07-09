import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const cartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1),
})

// GET /api/customer/cart - 장바구니 조회
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          include: {
            vendor: {
              select: {
                id: true,
                businessName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // 총액 계산
    const totalAmount = cartItems.reduce((sum, item) => {
      const price = item.product.salePrice || item.product.basePrice
      return sum + Number(price) * item.quantity
    }, 0)

    return NextResponse.json({
      items: cartItems,
      totalAmount,
      itemCount: cartItems.length,
    })
  } catch (error) {
    console.error('Cart fetch error:', error)
    return NextResponse.json(
      { error: '장바구니 조회 실패' },
      { status: 500 }
    )
  }
}

// POST /api/customer/cart - 장바구니에 상품 추가
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { productId, quantity } = cartItemSchema.parse(body)

    // 상품 존재 확인
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json(
        { error: '상품을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (product.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: '구매할 수 없는 상품입니다' },
        { status: 400 }
      )
    }

    if (product.stock < quantity) {
      return NextResponse.json(
        { error: '재고가 부족합니다' },
        { status: 400 }
      )
    }

    // 이미 장바구니에 있는지 확인
    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    })

    let cartItem

    if (existingCartItem) {
      // 수량 업데이트
      cartItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: existingCartItem.quantity + quantity,
        },
        include: {
          product: true,
        },
      })
    } else {
      // 새로 추가
      cartItem = await prisma.cartItem.create({
        data: {
          userId: session.user.id,
          productId,
          quantity,
        },
        include: {
          product: true,
        },
      })
    }

    return NextResponse.json(cartItem, { status: 201 })
  } catch (error) {
    console.error('Cart add error:', error)
    return NextResponse.json(
      { error: '장바구니 추가 실패' },
      { status: 500 }
    )
  }
}
