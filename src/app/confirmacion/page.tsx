import Link from "next/link";
import { Check, Clock3 } from "lucide-react";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  let paid = false;
  try {
    const stripe = getStripe();
    if (stripe && session_id && /^cs_[a-zA-Z0-9_]+$/.test(session_id)) {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      paid = session.payment_status === "paid";
    }
  } catch { /* A failed lookup must never be shown as a successful payment. */ }

  return <main className="confirmation"><div className="confirmation-mark">{paid ? <Check size={27}/> : <Clock3 size={27}/>}</div><span className="eyebrow">ME CABO · THE CELEBRATION COLLECTION</span><h1>{paid ? "A little magic is on its way." : "Your payment is not confirmed yet."}</h1><p>{paid ? "Your payment is confirmed. Our team will follow up with availability and the details of your celebration." : "We could not confirm a completed payment. If you just paid, allow a moment and refresh this page before trying again."}</p><Link href="/" className="button button-dark">Back to the collection</Link></main>;
}
