'use client';

import { SessionProvider } from 'next-auth/react';
import { BalanceProvider } from './context/BalanceContext';
import { CartProvider } from './context/CartContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <BalanceProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </BalanceProvider>
    </SessionProvider>
  );
} 