import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { ThemeProvider } from "@/components/theme-provider"
import { Analytics } from "@vercel/analytics/react"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "U.S. Civics Test Practice",
  description: "Practice for the U.S. citizenship test with official USCIS questions. Features both multiple choice and written answer modes.",
  keywords: ["US citizenship test", "civics test", "USCIS", "naturalization", "citizenship practice"],
  authors: [{ name: "@asisbot" }],
  openGraph: {
    title: "U.S. Civics Test Practice",
    description: "Free practice platform for the U.S. citizenship test",
    type: "website",
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || '',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col">
            <Header />
            <Suspense>
              {children}
            </Suspense>
            <Footer />
          </div>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
