import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

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
    const { paymentIntentId } = body

    // Payment Intent 확인
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: '결제가 완료되지 않았습니다' },
        { status: 400 }
      )
    }

    const orderId = paymentIntent.metadata.orderId

    // 주문 업데이트 (트랜잭션)
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      })

      if (!order) {
        throw new Error('주문을 찾을 수 없습니다')
      }

      if (order.customerId !== session.user.id) {
        throw new Error('권한이 없습니다')
      }

      // 결제 정보 저장
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          stripePaymentIntentId: paymentIntentId,
          amount: Number(paymentIntent.amount) / 100,
          currency: paymentIntent.currency,
          method: 'card',
          status: 'COMPLETED',
        },
      })

      // 주문 상태 업데이트
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'COMPLETED',
          status: 'CONFIRMED',
          paymentId: payment.id,
          paidAt: new Date(),
        },
      })

      return updatedOrder
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Payment confirmation error:', error)
    return NextResponse.json(
      { error: '결제 확인 실패' },
      { status: 500 }
    )
  }
}
