import { z } from "zod";
import { products } from "./catalog";
import { present } from "./presentation";

export const orderInput = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
    const date = new Date(`${value}T12:00:00Z`);
    return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value && value >= new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mazatlan" }).format(new Date());
  }),
  notes: z.string().trim().max(1000).default(""),
  items: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1).max(20), variant: z.string().max(100).default("") })).min(1).max(20),
});

export function priceItems(items: z.infer<typeof orderInput>["items"]) {
  const seen = new Set<string>();
  return items.map(item => {
    const product = products.find(product => product.id === item.productId);
    if (!product) throw new Error("A selection is no longer available. Please update your bag.");
    const info = present(product);
    if (info.variants ? !info.variants.includes(item.variant) : Boolean(item.variant)) throw new Error("Please choose a valid decoration style.");
    const key = `${product.id}:${item.variant}`;
    if (seen.has(key)) throw new Error("Please combine duplicate selections in your bag.");
    seen.add(key);
    return { ...item, name: `${info.name}${item.variant ? ` (${item.variant})` : ""}`, unitAmount: Math.round(product.price * 100) };
  });
}
