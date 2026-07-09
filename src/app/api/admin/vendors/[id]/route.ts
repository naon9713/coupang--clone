import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const approveVendorSchema = z.object({
  action: z.enum(['approve', 'reject', 'suspend']),
  rejectionReason: z.string().optional(),
})

// PUT /api/admin/vendors/[id] - 벤더 승인/거절/정지
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: params.id },
    })

    if (!vendor) {
      return NextResponse.json(
        { error: '벤더를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { action, rejectionReason } = approveVendorSchema.parse(body)

    let updateData: any = {}

    switch (action) {
      case 'approve':
        updateData = {
          status: 'APPROVED',
          approvedAt: new Date(),
        }
        break
      case 'reject':
        updateData = {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectionReason,
        }
        break
      case 'suspend':
        updateData = {
          status: 'SUSPENDED',
        }
        break
    }

    const updatedVendor = await prisma.vendorProfile.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(updatedVendor)
  } catch (error) {
    console.error('Vendor update error:', error)
    return NextResponse.json(
      { error: '벤더 업데이트 실패' },
      { status: 500 }
    )
  }
}
