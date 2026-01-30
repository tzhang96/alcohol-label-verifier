import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alcohol Label Verification Tool",
  description: "AI-powered label verification for TTB compliance agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
