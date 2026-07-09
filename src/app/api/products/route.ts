import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const productSchema = z.object({
  vendorId: z.string(),
  categoryId: z.string(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  images: z.array(z.string()),
  basePrice: z.string().transform((val) => parseFloat(val)),
  salePrice: z.string().transform((val) => parseFloat(val)).optional(),
  costPrice: z.string().transform((val) => parseFloat(val)).optional(),
  sku: z.string().min(1),
  stock: z.number().int().min(0),
  weight: z.string().transform((val) => parseFloat(val)).optional(),
  dimensions: z.any().optional(),
  tags: z.array(z.string()).optional(),
  attributes: z.any().optional(),
})

// GET /api/products - 상품 목록 조회
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const vendorId = searchParams.get('vendorId')

    const where: any = {
      status: 'ACTIVE',
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (vendorId) {
      where.vendorId = vendorId
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              rating: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Products fetch error:', error)
    return NextResponse.json(
      { error: '상품 조회 실패' },
      { status: 500 }
    )
  }
}

// POST /api/products - 상품 생성 (판매자만)
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role !== 'VENDOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const data = productSchema.parse(body)

    // 판매자인 경우 자신의 vendorId만 사용 가능
    if (session.user.role === 'VENDOR') {
      const vendorProfile = await prisma.vendorProfile.findUnique({
        where: { userId: session.user.id },
      })

      if (!vendorProfile || vendorProfile.id !== data.vendorId) {
        return NextResponse.json(
          { error: '권한이 없습니다' },
          { status: 403 }
        )
      }
    }

    const product = await prisma.product.create({
      data,
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json(
      { error: '상품 생성 실패' },
      { status: 500 }
    )
  }
}
