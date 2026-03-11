import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// --- FONT CONFIGURATION ---
// Configures the Inter font to be used throughout the application
const inter = Inter({ subsets: ["latin"] });

// --- METADATA CONFIGURATION ---
// This is where we define the professional appearance of the application in the browser tab.
// title: Sets the name that appears on the browser tab
// description: Defines the description for SEO and sharing
// icons: Specifies the path to your custom logo to be used as the tab icon (favicon)
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
      <body className={inter.className}>{children}</body>
    </html>
  );
}
