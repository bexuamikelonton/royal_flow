import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RoyaltyFlow - Digital Royalty Revenue Distribution",
  description: "Transparent royalty distribution platform for co-creators & derivative works",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
