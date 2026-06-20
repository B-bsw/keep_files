import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Keep Files - Modern Cloud Storage",
  description: "Secure, fast, and beautiful cloud file storage.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Keep Files",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

import { Toast } from "@heroui/react";
import { Providers } from "./providers";
import { PWARegister } from "@/components/pwa-register";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="theme-color" content="#0FBFA0" />
      </head>
      <body className="min-h-full flex flex-col bg-[#F5FEFD] dark:bg-[#050505] text-gray-900 dark:text-white selection:bg-black/10 dark:selection:bg-white/30 transition-colors duration-300">
        <Providers>
          <Toast.Provider />
          <PWARegister />
          {children}
        </Providers>
      </body>
    </html>
  );
}
