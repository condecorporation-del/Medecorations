import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendOrderEmails } from "@/lib/email";
import { DELIVERY_LOCATION } from "@/lib/booking";

export async function POST(request: Request) {
  const stripe = getStripe(); const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(await request.text(), signature, secret); } catch { return NextResponse.json({ error: "Invalid signature." }, { status: 400 }); }
  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") return NextResponse.json({ received: true });
  const session = event.data.object;
  if (session.payment_status !== "paid") return NextResponse.json({ received: true });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Order storage is unavailable." }, { status: 503 });
  const email = session.customer_details?.email || session.customer_email;
  if (!email) return NextResponse.json({ error: "Missing customer email." }, { status: 400 });
  try {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100, expand: ["data.price.product"] });
    if (!lineItems.data.length || lineItems.has_more) throw new Error("Incomplete line items");
    const eventDate = session.metadata?.eventDate || "";
    const location = DELIVERY_LOCATION;
    const firstName = session.metadata?.firstName || "";
    const lastName = session.metadata?.lastName || "";
    const notes = (session.metadata?.notes1 || "") + (session.metadata?.notes2 || "");
    const rows = lineItems.data.map(line => {
      const product = line.price?.product as Stripe.Product | undefined;
      if (!product?.metadata?.productId || !line.quantity || line.price?.unit_amount == null) throw new Error("Invalid line item");
      return { product_id: product.metadata.productId, product_name: line.description, variant: product.metadata.variant || "", quantity: line.quantity, unit_price_cents: line.price.unit_amount, total_cents: line.amount_total, customer_first_name: firstName, customer_last_name: lastName, customer_email: email, event_date: eventDate || null, location, notes, status: "paid", payment_status: "paid", stripe_session_id: session.id, stripe_line_item_id: line.id };
    });
    const { error } = await supabase.from("orders").upsert(rows, { onConflict: "stripe_session_id,stripe_line_item_id" });
    if (error) throw error;
    const sent = await sendOrderEmails({ customer_first_name: firstName, customer_last_name: lastName, customer_email: email, product_name: rows.map(row => `${row.quantity} × ${row.product_name}`).join("; "), event_date: eventDate, location, notes, total_cents: session.amount_total || 0, paid: true, idempotencyKey: session.id });
    if (!sent.sent) throw new Error("Email pending");
    return NextResponse.json({ received: true });
  } catch {
    // Non-2xx allows Stripe to retry failed persistence/notification attempts.
    return NextResponse.json({ error: "Order processing is pending. Please retry." }, { status: 500 });
  }
}
