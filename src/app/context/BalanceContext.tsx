'use client';

import { useSession } from 'next-auth/react';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface BalanceContextType {
  balance: number | null;
  updateBalance: (newBalance: number) => void;
  refreshBalance: () => Promise<void>;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export function BalanceProvider({ children }: { children: ReactNode }) {
  const { data: session, update } = useSession();
  const [balance, setBalance] = useState<number | null>(null);

  // Fetch balance from database
  const fetchBalanceFromDB = async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch('/api/user/balance');
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance);
        console.log('💰 Fetched fresh balance from database:', data.balance);
      }
    } catch (error) {
      console.error('Error fetching balance from database:', error);
      // Fallback to session balance
      if (session?.user?.balance !== undefined) {
        setBalance(session.user.balance);
      }
    }
  };

  // Initialize balance from database, fallback to session
  useEffect(() => {
    if (session?.user?.id) {
      console.log('🔍 Session balance:', session.user.balance, 'Fetching fresh balance from database...');
      fetchBalanceFromDB();
    } else if (session?.user?.balance !== undefined) {
      setBalance(session.user.balance);
    }
  }, [session?.user?.id, session?.user?.balance]);

  const updateBalance = (newBalance: number) => {
    setBalance(newBalance);
  };

  const refreshBalance = async () => {
    try {
      await fetchBalanceFromDB();
      await update(); // Also refresh session
    } catch (error) {
      console.error('Error refreshing balance:', error);
    }
  };

  return (
    <BalanceContext.Provider value={{ balance, updateBalance, refreshBalance }}>
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalance() {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return context;
} 