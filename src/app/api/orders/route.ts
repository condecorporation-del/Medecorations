import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendOrderEmails } from "@/lib/email";
import { orderInput, priceItems } from "@/lib/order-input";
import { DELIVERY_LOCATION } from "@/lib/booking";

export async function POST(request: Request) {
  const parsed = orderInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check your first name, last name, email, event date and selections." }, { status: 400 });
  let items;
  try { items = priceItems(parsed.data.items); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid bag." }, { status: 400 }); }
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Email reservations will be available soon. Your bag is saved for later." }, { status: 503 });
  const { firstName, lastName, email, eventDate, notes } = parsed.data;
  const location = DELIVERY_LOCATION;
  const groupId = randomUUID();
  const rows = items.map(item => ({ order_group_id: groupId, product_id: item.productId, product_name: item.name, variant: item.variant, quantity: item.quantity, unit_price_cents: item.unitAmount, total_cents: item.unitAmount * item.quantity, customer_first_name: firstName, customer_last_name: lastName, customer_email: email, event_date: eventDate, location, notes, status: "requested", payment_status: "unpaid" }));
  const { error } = await supabase.from("orders").insert(rows);
  if (error) return NextResponse.json({ error: "We could not save your request. Please try again." }, { status: 500 });
  let emailSent = false;
  try {
    const result = await sendOrderEmails({ customer_first_name: firstName, customer_last_name: lastName, customer_email: email, product_name: items.map(item => `${item.quantity} × ${item.name}`).join("; "), event_date: eventDate, location, notes, total_cents: rows.reduce((sum, row) => sum + row.total_cents, 0), idempotencyKey: groupId });
    emailSent = result.sent;
  } catch { /* The saved request is still available to the team. */ }
  return NextResponse.json({ orderId: groupId, emailSent }, { status: 201 });
}
