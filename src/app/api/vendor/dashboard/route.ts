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

    // 기본 통계
    const [
      totalProducts,
      totalOrders,
      totalSales,
      pendingOrders,
      recentOrders,
    ] = await Promise.all([
      prisma.product.count({
        where: { vendorId: vendorProfile.id },
      }),
      prisma.orderItem.count({
        where: { vendorId: vendorProfile.id },
      }),
      prisma.orderItem.aggregate({
        where: { vendorId: vendorProfile.id },
        _sum: { vendorAmount: true },
      }),
      prisma.orderItem.count({
        where: {
          vendorId: vendorProfile.id,
          shippingStatus: 'PENDING',
        },
      }),
      prisma.orderItem.findMany({
        where: { vendorId: vendorProfile.id },
        include: {
          order: {
            select: {
              orderNumber: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ])

    return NextResponse.json({
      stats: {
        totalProducts,
        totalOrders,
        totalSales: totalSales._sum.vendorAmount || 0,
        pendingOrders,
        rating: vendorProfile.rating,
        reviewCount: vendorProfile.reviewCount,
      },
      recentOrders,
    })
  } catch (error) {
    console.error('Dashboard fetch error:', error)
    return NextResponse.json(
      { error: '대시보드 조회 실패' },
      { status: 500 }
    )
  }
}
