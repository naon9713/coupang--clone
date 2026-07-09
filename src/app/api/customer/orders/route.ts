import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const orderSchema = z.object({
  cartItemIds: z.array(z.string()),
  shippingAddress: z.object({
    label: z.string(),
    recipient: z.string(),
    phone: z.string(),
    address: z.string(),
    detail: z.string().optional(),
    postalCode: z.string(),
  }),
  shippingMethod: z.string(),
  customerNote: z.string().optional(),
})

// GET /api/customer/orders - 주문 목록 조회
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { customerId: session.user.id },
        include: {
          items: {
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
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({
        where: { customerId: session.user.id },
      }),
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json(
      { error: '주문 조회 실패' },
      { status: 500 }
    )
  }
}

// POST /api/customer/orders - 주문 생성
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
    const { cartItemIds, shippingAddress, shippingMethod, customerNote } = 
      orderSchema.parse(body)

    // 장바구니 아이템 조회
    const cartItems = await prisma.cartItem.findMany({
      where: {
        id: { in: cartItemIds },
        userId: session.user.id,
      },
      include: {
        product: {
          include: {
            vendor: true,
          },
        },
      },
    })

    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: '장바구니 아이템을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 재고 확인
    for (const cartItem of cartItems) {
      if (cartItem.product.stock < cartItem.quantity) {
        return NextResponse.json(
          { error: `${cartItem.product.name}의 재고가 부족합니다` },
          { status: 400 }
        )
      }
    }

    // 주문 번호 생성
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // 배송비 계산 (단순화: 3000원)
    const shippingFee = 3000

    // 상품 총액 계산
    const subtotal = cartItems.reduce((sum, item) => {
      const price = item.product.salePrice || item.product.basePrice
      return sum + Number(price) * item.quantity
    }, 0)

    // 총액 계산
    const totalAmount = subtotal + shippingFee

    // 주문 생성 (트랜잭션)
    const order = await prisma.$transaction(async (tx) => {
      // 주문 생성
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: session.user.id,
          shippingAddress,
          shippingMethod,
          shippingFee,
          paymentMethod: 'CARD',
          subtotal,
          totalAmount,
          customerNote,
          status: 'PENDING',
          paymentStatus: 'PENDING',
        },
      })

      // 주문 아이템 생성 (벤더별로 그룹화)
      const vendorGroups = new Map<string, typeof cartItems>()
      
      cartItems.forEach((cartItem) => {
        const vendorId = cartItem.product.vendorId
        if (!vendorGroups.has(vendorId)) {
          vendorGroups.set(vendorId, [])
        }
        vendorGroups.get(vendorId)!.push(cartItem)
      })

      const orderItems = []

      for (const [vendorId, items] of vendorGroups) {
        const vendor = await tx.vendorProfile.findUnique({
          where: { id: vendorId },
        })

        if (!vendor) continue

        for (const cartItem of items) {
          const price = cartItem.product.salePrice || cartItem.product.basePrice
          const totalPrice = Number(price) * cartItem.quantity
          const commissionAmount = totalPrice * Number(vendor.commissionRate)
          const vendorAmount = totalPrice - commissionAmount

          const orderItem = await tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              vendorId,
              productId: cartItem.productId,
              productName: cartItem.product.name,
              productImage: cartItem.product.images[0] || '',
              productSku: cartItem.product.sku,
              quantity: cartItem.quantity,
              unitPrice: price,
              totalPrice,
              commissionRate: vendor.commissionRate,
              commissionAmount,
              vendorAmount,
              shippingStatus: 'PENDING',
            },
          })

          orderItems.push(orderItem)

          // 재고 감소
          await tx.product.update({
            where: { id: cartItem.productId },
            data: {
              stock: { decrement: cartItem.quantity },
              soldCount: { increment: cartItem.quantity },
            },
          })
        }
      }

      // 장바구니 아이템 삭제
      await tx.cartItem.deleteMany({
        where: {
          id: { in: cartItemIds },
        },
      })

      return newOrder
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: '주문 생성 실패' },
      { status: 500 }
    )
  }
}
