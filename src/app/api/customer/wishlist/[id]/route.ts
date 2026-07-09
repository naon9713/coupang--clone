import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// DELETE /api/customer/wishlist/[id] - 위시리스트 아이템 삭제
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

    const wishlistItem = await prisma.wishlistItem.findUnique({
      where: { id: params.id },
    })

    if (!wishlistItem) {
      return NextResponse.json(
        { error: '위시리스트 아이템을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (wishlistItem.userId !== session.user.id) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    await prisma.wishlistItem.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: '위시리스트 아이템 삭제 성공' })
  } catch (error) {
    console.error('Wishlist deletion error:', error)
    return NextResponse.json(
      { error: '위시리스트 삭제 실패' },
      { status: 500 }
    )
  }
}
