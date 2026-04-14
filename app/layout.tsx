import type { Metadata } from "next";
import { Inter } from "next/font/google";

// @ts-ignore: VS Code'un gereksiz CSS uyarısını susturuyoruz, gerçek bir hata değil.
import "./globals.css";

// 🚀 Global Motorlarımızı İçe Aktarıyoruz
import GlobalPing from "./GlobalPing";
import ChatBox from "@/components/ChatBox"; // <-- İŞTE GERÇEK VE TEK MESAJ KUTUMUZ BURADA!

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
        {/* 🚀 Arka plan ping motoru */}
        <GlobalPing />
        
        {/* 💬 Bütün sayfalarda çalışacak TEK ve AKILLI Sohbet Kutusu */}
        <ChatBox />

        {children}
      </body>
    </html>
  );
}