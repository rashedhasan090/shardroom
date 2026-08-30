import type { Metadata, Viewport } from "next";
import { Fraunces, Figtree } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const sans = Figtree({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Shardroom — a kiln for leftover compute",
  description:
    "Open a four-letter kiln. Seat phones and laptops you already have. The strongest shard writes; every screen recites the same tokens as they appear.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "Shardroom",
    description: "Browser mesh-inference rooms.",
    url: "https://shardroom.mdrashedulhasan.me",
    siteName: "Shardroom",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#100c0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
