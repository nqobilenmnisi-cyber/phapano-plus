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
  title: "Phapano+ — Your psychology journey, in one place",
  description:
    "Phapano+ helps psychology students in South Africa explore programmes, track Honours and Master's applications, find funding, and navigate every next step with verified, trusted information.",
  metadataBase: new URL("https://phapano.com"),
  openGraph: {
    title: "Phapano+ — Your psychology journey, in one place",
    description:
      "Explore programmes, track Honours and Master's applications, find funding, and plan your next steps with verified guidance.",
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
