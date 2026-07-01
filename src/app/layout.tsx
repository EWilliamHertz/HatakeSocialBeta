import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ChatWidget from "@/components/ChatWidget";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Hatake Social (Beta)",
  description: "Uniting the European TCG Scene",
  manifest: "/manifest.json",
};

import HaloNav from "@/components/HaloNav";
import Footer from "@/components/Footer";
import GlobalNotifications from "@/components/GlobalNotifications";
import VerifyBanner from "@/components/VerifyBanner";

import { I18nProvider } from "@/lib/i18nContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased pb-32 bg-slate-950 text-slate-200`}
      >
        <I18nProvider>
          <div className="min-h-screen flex flex-col">
            <VerifyBanner />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
          <ChatWidget />
          <HaloNav />
          <GlobalNotifications />
        </I18nProvider>
      </body>
    </html>
  );
}
