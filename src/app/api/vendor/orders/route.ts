import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')

    const where: any = { vendorId: vendorProfile.id }
    if (status) {
      where.shippingStatus = status
    }

    const [orders, total] = await Promise.all([
      prisma.orderItem.findMany({
        where,
        include: {
          order: {
            select: {
              orderNumber: true,
              createdAt: true,
              customer: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.orderItem.count({ where }),
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
    console.error('Vendor orders fetch error:', error)
    return NextResponse.json(
      { error: '주문 조회 실패' },
      { status: 500 }
    )
  }
}
