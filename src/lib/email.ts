import { Resend } from "resend";

export async function sendOrderEmails(order: { customer_first_name: string; customer_last_name: string; customer_email: string; product_name: string; event_date: string; location: string; total_cents: number; notes?: string | null; paid?: boolean; idempotencyKey: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const admin = process.env.ADMIN_EMAIL;
  if (!apiKey || !from || !admin) return { sent: false };
  const resend = new Resend(apiKey);
  const total = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(order.total_cents / 100);
  const subject = order.paid ? "ME Cabo · Payment received" : "ME Cabo · Your celebration request";
  const guestName = `${order.customer_first_name} ${order.customer_last_name}`.trim();
  const html = `<div style="font-family:Arial,sans-serif;color:#233d32;line-height:1.7"><h2>${order.paid ? "Thank you. Your payment is received." : "Your celebration starts here."}</h2><p>Our team will follow up to confirm event availability and the details of your celebration.</p>${guestName ? `<p><b>Guest:</b> ${escapeHtml(guestName)}</p>` : ""}<p><b>Your selection:</b> ${escapeHtml(order.product_name)}</p><p><b>Event date:</b> ${escapeHtml(order.event_date)}<br><b>Delivery hotel:</b> ${escapeHtml(order.location)}<br><b>${order.paid ? "Amount paid" : "Estimated total"}:</b> ${total} USD</p>${order.notes ? `<p><b>Your notes:</b> ${escapeHtml(order.notes)}</p>` : ""}</div>`;
  const results = await Promise.all([
    resend.emails.send({ from, to: order.customer_email, subject, html }, { idempotencyKey: `${order.idempotencyKey}-customer` }),
    resend.emails.send({ from, to: admin, subject, html: `${html}<p>Customer: ${escapeHtml(order.customer_email)}</p>` }, { idempotencyKey: `${order.idempotencyKey}-admin` }),
  ]);
  return { sent: results.every(result => !result.error) };
}
function escapeHtml(input: string) {
  return input.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}
