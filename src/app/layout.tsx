import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ME Cabo | The Celebration Collection",
  description: "Flowers, balloons and thoughtful details for your celebration in Los Cabos. Discover the collection and make it yours.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://me-cabo.example"),
};

export const viewport: Viewport = { themeColor: "#f6f1eb", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
