import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")

    // In production, verify Stripe signature with STRIPE_WEBHOOK_SECRET
    // const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)

    // For demo, parse the JSON
    const event = JSON.parse(body)

    console.log("[v0] Stripe webhook received:", event.type)

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        // Insert into billing_events (status='success')
        // Update user_billing.plan_id
        console.log("[v0] Checkout completed for user:", event.data.object.customer)
        break
      }

      case "invoice.payment_succeeded": {
        // Insert into billing_events (status='success')
        console.log("[v0] Payment succeeded:", event.data.object.id)
        break
      }

      case "invoice.payment_failed": {
        // Insert into billing_events (status='failed')
        console.log("[v0] Payment failed:", event.data.object.id)
        break
      }

      case "customer.subscription.updated": {
        // Sync plan, next renewal date
        console.log("[v0] Subscription updated:", event.data.object.id)
        break
      }

      default:
        console.log("[v0] Unhandled event type:", event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 400 })
  }
}
