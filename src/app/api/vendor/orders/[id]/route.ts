import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const shipOrderSchema = z.object({
  trackingNumber: z.string().min(1),
})

// PUT /api/vendor/orders/[id]/ship - 배송 처리
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'VENDOR') {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    const vendorProfile = await prisma.vendorProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!vendorProfile) {
      return NextResponse.json(
        { error: '판매자 프로필을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    const orderItem = await prisma.orderItem.findUnique({
      where: { id: params.id },
    })

    if (!orderItem) {
      return NextResponse.json(
        { error: '주문 아이템을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (orderItem.vendorId !== vendorProfile.id) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    if (orderItem.shippingStatus !== 'PENDING' && orderItem.shippingStatus !== 'PREPARING') {
      return NextResponse.json(
        { error: '이미 배송이 처리되었습니다' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { trackingNumber } = shipOrderSchema.parse(body)

    const updatedOrderItem = await prisma.orderItem.update({
      where: { id: params.id },
      data: {
        shippingStatus: 'SHIPPED',
        trackingNumber,
        shippedAt: new Date(),
      },
    })

    return NextResponse.json(updatedOrderItem)
  } catch (error) {
    console.error('Order shipping error:', error)
    return NextResponse.json(
      { error: '배송 처리 실패' },
      { status: 500 }
    )
  }
}
