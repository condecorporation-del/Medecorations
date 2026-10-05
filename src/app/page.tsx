import Catalog from "@/components/Catalog";
import { categories, policies, products } from "@/lib/catalog";

export default function Home() {
  return <Catalog categories={categories} products={products} policies={policies} />;
}
