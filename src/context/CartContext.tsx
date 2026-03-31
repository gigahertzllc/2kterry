import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { SkinPack } from '../types';

interface CartContextType {
  items: SkinPack[];
  isOpen: boolean;
  addItem: (item: SkinPack) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  totalPrice: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SkinPack[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = useCallback((item: SkinPack) => {
    setItems(prev => {
      // One of each only
      if (prev.find(i => i.id === item.id)) return prev;
      return [...prev, item];
    });
    setIsOpen(true); // Open drawer when adding
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const isInCart = useCallback((id: string) => {
    return items.some(i => i.id === id);
  }, [items]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen(prev => !prev), []);

  const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
  const itemCount = items.length;

  return (
    <CartContext.Provider value={{
      items, isOpen, addItem, removeItem, clearCart,
      isInCart, openCart, closeCart, toggleCart, totalPrice, itemCount,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
