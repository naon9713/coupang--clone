import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    // 기본 통계
    const [
      totalUsers,
      totalVendors,
      totalProducts,
      totalOrders,
      totalSales,
      pendingVendors,
      recentOrders,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.vendorProfile.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
      }),
      prisma.vendorProfile.count({
        where: { status: 'PENDING' },
      }),
      prisma.order.findMany({
        include: {
          customer: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])

    return NextResponse.json({
      stats: {
        totalUsers,
        totalVendors,
        totalProducts,
        totalOrders,
        totalSales: totalSales._sum.totalAmount || 0,
        pendingVendors,
      },
      recentOrders,
    })
  } catch (error) {
    console.error('Admin dashboard fetch error:', error)
    return NextResponse.json(
      { error: '대시보드 조회 실패' },
      { status: 500 }
    )
  }
}
