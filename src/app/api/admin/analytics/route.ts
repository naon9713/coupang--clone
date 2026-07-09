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

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '7d' // 7d, 30d, 90d

    const startDate = new Date()
    const endDate = new Date()

    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
    }

    // 기간별 통계
    const [
      orders,
      sales,
      newUsers,
      newVendors,
      topProducts,
      topVendors,
    ] = await Promise.all([
      prisma.order.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { totalAmount: true },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.vendorProfile.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.product.findMany({
        orderBy: { soldCount: 'desc' },
        take: 10,
        include: {
          vendor: {
            select: {
              businessName: true,
            },
          },
        },
      }),
      prisma.vendorProfile.findMany({
        orderBy: { totalSales: 'desc' },
        take: 10,
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      }),
    ])

    return NextResponse.json({
      period,
      dateRange: {
        startDate,
        endDate,
      },
      stats: {
        orders,
        sales: sales._sum.totalAmount || 0,
        newUsers,
        newVendors,
      },
      topProducts,
      topVendors,
    })
  } catch (error) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json(
      { error: '분석 데이터 조회 실패' },
      { status: 500 }
    )
  }
}
