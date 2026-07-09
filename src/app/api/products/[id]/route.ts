import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const productUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  basePrice: z.string().transform((val) => parseFloat(val)).optional(),
  salePrice: z.string().transform((val) => parseFloat(val)).optional(),
  costPrice: z.string().transform((val) => parseFloat(val)).optional(),
  stock: z.number().int().min(0).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED']).optional(),
  weight: z.string().transform((val) => parseFloat(val)).optional(),
  dimensions: z.any().optional(),
  tags: z.array(z.string()).optional(),
  attributes: z.any().optional(),
})

// GET /api/products/[id] - 상품 상세 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            rating: true,
            reviewCount: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        variants: true,
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: '상품을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 조회수 증가
    await prisma.product.update({
      where: { id: params.id },
      data: { viewCount: { increment: 1 } },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Product fetch error:', error)
    return NextResponse.json(
      { error: '상품 조회 실패' },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - 상품 수정 (판매자 또는 관리자)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role !== 'VENDOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
    })

    if (!product) {
      return NextResponse.json(
        { error: '상품을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 판매자인 경우 자신의 상품만 수정 가능
    if (session.user.role === 'VENDOR') {
      const vendorProfile = await prisma.vendorProfile.findUnique({
        where: { userId: session.user.id },
      })

      if (!vendorProfile || vendorProfile.id !== product.vendorId) {
        return NextResponse.json(
          { error: '권한이 없습니다' },
          { status: 403 }
        )
      }
    }

    const body = await req.json()
    const data = productUpdateSchema.parse(body)

    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
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

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('Product update error:', error)
    return NextResponse.json(
      { error: '상품 수정 실패' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - 상품 삭제 (판매자 또는 관리자)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role !== 'VENDOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
    })

    if (!product) {
      return NextResponse.json(
        { error: '상품을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 판매자인 경우 자신의 상품만 삭제 가능
    if (session.user.role === 'VENDOR') {
      const vendorProfile = await prisma.vendorProfile.findUnique({
        where: { userId: session.user.id },
      })

      if (!vendorProfile || vendorProfile.id !== product.vendorId) {
        return NextResponse.json(
          { error: '권한이 없습니다' },
          { status: 403 }
        )
      }
    }

    await prisma.product.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: '상품 삭제 성공' })
  } catch (error) {
    console.error('Product deletion error:', error)
    return NextResponse.json(
      { error: '상품 삭제 실패' },
      { status: 500 }
    )
  }
}
