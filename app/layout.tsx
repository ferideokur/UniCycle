import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 🚀 Görünmez Ping Motorumuzu İçe Aktarıyoruz
import GlobalPing from "./GlobalPing";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UniCycle",
  description: "Campus Marketplace Platform",
  icons: {
    icon: "/logo.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        {/* 🚀 Motoru buraya koyduk. Tasarıma etkisi SIFIR, işlevi YÜZ! */}
        <GlobalPing />
        {children}
      </body>
    </html>
  );
}
