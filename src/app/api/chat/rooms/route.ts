import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const createRoomSchema = z.object({
  type: z.enum(['DIRECT', 'GROUP']).default('DIRECT'),
  participantIds: z.array(z.string()),
})

// GET /api/chat/rooms - 채팅방 목록 조회
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const chatRooms = await prisma.chatRoom.findMany({
      where: {
        users: {
          some: {
            id: session.user.id,
          },
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        users: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ chatRooms })
  } catch (error) {
    console.error('Chat rooms fetch error:', error)
    return NextResponse.json(
      { error: '채팅방 조회 실패' },
      { status: 500 }
    )
  }
}

// POST /api/chat/rooms - 채팅방 생성
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { type, participantIds } = createRoomSchema.parse(body)

    // 참여자에 현재 사용자 추가
    const allParticipantIds = [...new Set([session.user.id, ...participantIds])]

    const chatRoom = await prisma.chatRoom.create({
      data: {
        type,
        participants: allParticipantIds.map((id) => ({
          userId: id,
          role: 'MEMBER',
          readAt: new Date(),
        })),
        users: {
          connect: allParticipantIds.map((id) => ({ id })),
        },
      },
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

    return NextResponse.json(chatRoom, { status: 201 })
  } catch (error) {
    console.error('Chat room creation error:', error)
    return NextResponse.json(
      { error: '채팅방 생성 실패' },
      { status: 500 }
    )
  }
}
