import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Opalite — Creative Workspace for Brand Designers",
  description: "A calm, intuitive workspace for building and exploring brand identities.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-paper text-ink selection:bg-[#E8E8E2]" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
