import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

// Phapano+ uses Poppins throughout. We expose it under both the --font-sora
// and --font-manrope CSS variables so existing `font-sora` / `font-manrope`
// utility classes resolve to Poppins without touching every component.
const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Phapano+ | Psychology pathway support",
  description:
    "Phapano+ helps psychology students organise their pathway, explore programmes and funding, and participate in a focused community.",
  metadataBase: new URL("https://phapano.com"),
  openGraph: {
    title: "Phapano+ | Psychology pathway support",
    description:
      "Organise your psychology pathway, explore programmes and funding, and participate in a focused community.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>{children}</body>
    </html>
  );
}
