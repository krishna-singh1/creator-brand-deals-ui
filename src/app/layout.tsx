import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

import { PRODUCT } from "@/lib/product";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${PRODUCT.name}: curated brand partnerships for India's finest creators`,
  description:
    "An invitation-quality marketplace where India's D2C brands meet verified micro-creators. Fair pricing, refined collaborations, every deal tracked end to end.",
};

export const viewport: Viewport = {
  themeColor: "#faf7f2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-ivory text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
