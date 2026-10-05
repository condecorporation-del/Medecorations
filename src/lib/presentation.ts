import type { Product } from "./catalog";

export const categoryNames: Record<string, string> = { flores: "Flowers", globos: "Balloons", celebraciones: "Celebrations" };
export const copy: Record<string, { name: string; description: string; includes: string[]; variants?: string[] }> = {
  "rosas-24": { name: "24 Rose Bouquet", description: "A little romance, beautifully wrapped. Choose your favorite rose color, paper and ribbon.", includes: ["24 roses", "Your choice of color", "Your choice of paper and ribbon"] },
  "rosas-48": { name: "48 Rose Bouquet", description: "A generous gesture for someone unforgettable. Finished in your choice of colors.", includes: ["48 roses", "Your choice of color", "Your choice of paper and ribbon"] },
  "rosas-100": { name: "100 Rose Bouquet", description: "One hundred roses. One extraordinary moment. A statement bouquet made to surprise.", includes: ["100 roses", "Your choice of color", "Your choice of paper and ribbon"] },
  petalos: { name: "Rose Petals", description: "The finishing touch for a romantic celebration. A bag of rose petals to set the scene.", includes: ["One bag of rose petals"] },
  "temporada-mediano": { name: "Seasonal Flower Bouquet", description: "A medium bouquet with a mix of flowers in season. Naturally different, always thoughtful.", includes: ["Seasonal flower mix", "Medium bouquet"] },
  "girasoles-mediano": { name: "Sunflower Bouquet", description: "A little sunshine, delivered. A cheerful medium bouquet of sunflowers.", includes: ["Sunflowers", "Medium bouquet"] },
  "premium-mediano": { name: "Premium Flower Bouquet", description: "A considered mix of premium blooms, gathered into a beautiful medium bouquet.", includes: ["Premium flower mix", "Medium bouquet"] },
  "premium-caja": { name: "Premium Flower Box", description: "Premium flowers in a gift box, ready to make their day.", includes: ["Premium flower mix", "Gift box"] },
  "premium-arreglo-250": { name: "Premium Vase Arrangement", description: "Roses, premium seasonal blooms and greenery, artfully arranged in a vase.", includes: ["Roses", "Premium seasonal flowers", "Greenery", "Vase"] },
  "premium-arreglo-310": { name: "Grand Floral Arrangement", description: "A large vase arrangement with a generous mix of premium flowers. An unforgettable centerpiece.", includes: ["Large floral arrangement", "Premium flower mix", "Vase"] },
  "corazones-metalicos": { name: "Heart Balloon Bouquet", description: "Twelve metallic hearts, in a single color or a playful mix. A celebration in the air.", includes: ["12 metallic heart balloons", "One color or a mix"] },
  aniversario: { name: "Anniversary Celebration", description: "Celebrate another chapter together with a Happy Anniversary banner and metallic hearts.", includes: ["Happy Anniversary banner", "6 metallic heart balloons"] },
  "numeros-esfera": { name: "Birthday Balloon Bouquet", description: "Make the milestone personal with number balloons and a customized metallic orb.", includes: ["2 number balloons", "1 personalized metallic orb", "3 latex balloons"] },
  cumpleanos: { name: "The Birthday Setup", description: "Set the scene for a birthday to remember, from floating balloons to the finishing sign.", includes: ["2 metallic jumbo balloons, floor or helium", "30 helium latex balloons", "20 floor balloons", "Happy Birthday balloon or paper sign"] },
  "bride-to-be": { name: "Bride To Be Celebration", description: "A special setting for the bride-to-be, with two beautiful styles to choose from.", includes: ["30 helium latex balloons", "20 floor balloons", "Your choice of the two decoration styles below"], variants: ["Bride To Be banner + metallic ring", "Jumbo Bride letters + pearl garland"] },
};
export const present = (product: Product) => copy[product.id] || { name: product.nameEn || product.name, description: product.description, includes: product.includes };
export const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, "");
