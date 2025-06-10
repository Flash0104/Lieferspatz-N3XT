import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import CartSidebar from './components/CartSidebar';
import Header from './components/Header';
import "./globals.css";
import { Providers } from './providers';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lieferspatz - Order Food Online",
  description: "Find your favorite restaurants and order delicious food in just a few clicks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100`}
        suppressHydrationWarning={true}
      >
        <Providers>
          <Header />
          {children}
          <CartSidebar />
        </Providers>
      </body>
    </html>
  );
}
