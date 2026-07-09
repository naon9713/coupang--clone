import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const orderId = paymentIntent.metadata.orderId

        if (orderId) {
          await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
              where: { id: orderId },
            })

            if (order && order.paymentStatus !== 'COMPLETED') {
              const payment = await tx.payment.create({
                data: {
                  orderId: order.id,
                  stripePaymentIntentId: paymentIntent.id,
                  amount: Number(paymentIntent.amount) / 100,
                  currency: paymentIntent.currency,
                  method: 'card',
                  status: 'COMPLETED',
                },
              })

              await tx.order.update({
                where: { id: orderId },
                data: {
                  paymentStatus: 'COMPLETED',
                  status: 'CONFIRMED',
                  paymentId: payment.id,
                  paidAt: new Date(),
                },
              })
            }
          })
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const orderId = paymentIntent.metadata.orderId

        if (orderId) {
          await prisma.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: 'FAILED',
              status: 'CANCELLED',
            },
          })
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId = charge.payment_intent as string

        const payment = await prisma.payment.findUnique({
          where: { stripePaymentIntentId: paymentIntentId },
        })

        if (payment) {
          await prisma.$transaction(async (tx) => {
            await tx.payment.update({
              where: { id: payment.id },
              data: {
                refundedAmount: Number(charge.amount_refunded) / 100,
                refundedAt: new Date(),
                status: 'REFUNDED',
              },
            })

            await tx.order.update({
              where: { id: payment.orderId },
              data: {
                paymentStatus: 'REFUNDED',
                status: 'REFUNDED',
              },
            })
          })
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook 처리 실패' },
      { status: 500 }
    )
  }
}
