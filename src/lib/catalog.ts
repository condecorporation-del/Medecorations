import catalog from "./catalog.json";

export type Product = (typeof catalog.products)[number] & { variants?: string[] };
export const categories = catalog.categories;
export const products = catalog.products as Product[];
export const policies = catalog.policies;
export const money = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
