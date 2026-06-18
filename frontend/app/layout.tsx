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
};

import { Toast } from "@heroui/react";
import { Providers } from "./providers";

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
      <body className="min-h-full flex flex-col bg-[#F5FEFD] dark:bg-[#050505] text-gray-900 dark:text-white selection:bg-black/10 dark:selection:bg-white/30 transition-colors duration-300">
        <Providers>
          <Toast.Provider />
          {children}
        </Providers>
      </body>
    </html>
  );
}
