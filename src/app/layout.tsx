import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import CartSidebar from './components/CartSidebar';
import Header from './components/Header';
import ThemeInitializer from './components/ThemeInitializer';
import { ThemeProvider } from './context/ThemeContext';
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
    <html lang="en" style={{ height: '100%', margin: 0, padding: 0 }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100`}
        suppressHydrationWarning={true}
        style={{ height: '100%', margin: 0, padding: 0 }}
      >
        <Providers>
          <ThemeProvider>
            <div style={{ 
              minHeight: '100vh', 
              height: '100%',
              display: 'flex', 
              flexDirection: 'column',
              margin: 0,
              padding: 0
            }}>
              <ThemeInitializer />
              <Header />
              <main style={{ flex: 1 }}>
                {children}
              </main>
              <footer style={{ 
                padding: '1.5rem 0',
                borderTop: '1px solid rgba(148, 163, 184, 0.2)',
                backgroundColor: 'var(--card, #1e293b)', 
                color: 'var(--foreground, #f1f5f9)',
                marginTop: 'auto',
                margin: 0,
                opacity: 0.9
              }}>
                <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1.5rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.875rem', margin: 0, opacity: 0.8 }}>&copy; 2024 Lieferspatz. All rights reserved.</p>
                </div>
              </footer>
            </div>
            <CartSidebar />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
