import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/chat/rooms/[id]/messages - 메시지 내역 조회
export async function GET(
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

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: params.id },
      include: {
        users: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!chatRoom) {
      return NextResponse.json(
        { error: '채팅방을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 참여자 확인
    const isParticipant = chatRoom.users.some((user) => user.id === session.user.id)
    if (!isParticipant) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { chatRoomId: params.id },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.message.count({
        where: { chatRoomId: params.id },
      }),
    ])

    return NextResponse.json({
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Messages fetch error:', error)
    return NextResponse.json(
      { error: '메시지 조회 실패' },
      { status: 500 }
    )
  }
}
