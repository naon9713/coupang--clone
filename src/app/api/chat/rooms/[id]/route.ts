import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/chat/rooms/[id] - 채팅방 상세 조회
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

    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: params.id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            avatar: true,
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

    return NextResponse.json(chatRoom)
  } catch (error) {
    console.error('Chat room fetch error:', error)
    return NextResponse.json(
      { error: '채팅방 조회 실패' },
      { status: 500 }
    )
  }
}
