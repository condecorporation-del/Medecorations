import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { orderInput, priceItems } from "@/lib/order-input";
import { DELIVERY_LOCATION } from "@/lib/booking";

export async function POST(request: Request) {
  const parsed = orderInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check your first name, last name, email, event date and selections." }, { status: 400 });
  let items;
  try { items = priceItems(parsed.data.items); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid bag." }, { status: 400 }); }
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Online payments will be available soon. You can request availability by email." }, { status: 503 });
  const { firstName, lastName, email, eventDate, notes } = parsed.data;
  const site = new URL(process.env.NEXT_PUBLIC_SITE_URL || request.url).origin;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment", customer_email: email, locale: "en", payment_method_types: ["card"],
      line_items: items.map(item => ({ quantity: item.quantity, price_data: { currency: "usd", unit_amount: item.unitAmount, product_data: { name: item.name, metadata: { productId: item.productId, variant: item.variant } } } })),
      // Stripe metadata values are limited to 500 characters. Items live in line_items.
      metadata: { firstName, lastName, eventDate, location: DELIVERY_LOCATION, notes1: notes.slice(0, 500), notes2: notes.slice(500) },
      success_url: `${site}/confirmacion?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/?checkout=cancelled#catalog`,
    });
    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "We could not open secure checkout. Your bag is saved; please try again." }, { status: 502 });
  }
}
