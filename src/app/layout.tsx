import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Home App — Recipes",
  description: "Personal home management app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} font-sans antialiased bg-zinc-50 text-zinc-900`}>
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-xl font-semibold tracking-tight">
                Home App
              </Link>
              <Link
                href="/import"
                className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                + Import recipe
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
