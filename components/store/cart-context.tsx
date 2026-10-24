'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  productId: number;
  name: string;
  code: string;
  price: number;
  imageUrl?: string | null;
  quantity: number;
  availableQuantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (
    product: { id: number; name: string; code: string; price: number; imageUrl?: string | null; availableQuantity: number },
    quantity?: number
  ) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  totalCount: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children, storeSlug }: { children: React.ReactNode; storeSlug: string }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const storageKey = `gns_cart_${storeSlug}`;

  // Cargar carrito desde localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Error reading cart from localStorage', e);
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey]);

  // Persistir en localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (e) {
      console.warn('Error saving cart to localStorage', e);
    }
  }, [items, isLoaded, storageKey]);

  const addItem = (
    prod: { id: number; name: string; code: string; price: number; imageUrl?: string | null; availableQuantity: number },
    quantityToAdd = 1
  ) => {
    if (quantityToAdd <= 0) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === prod.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantityToAdd, prod.availableQuantity);
        return prev.map((i) => (i.productId === prod.id ? { ...i, quantity: newQty } : i));
      }
      return [
        ...prev,
        {
          productId: prod.id,
          name: prod.name,
          code: prod.code,
          price: prod.price,
          imageUrl: prod.imageUrl,
          quantity: Math.min(quantityToAdd, prod.availableQuantity),
          availableQuantity: prod.availableQuantity,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.productId === productId) {
          const clamped = Math.min(quantity, i.availableQuantity);
          return { ...i, quantity: clamped };
        }
        return i;
      })
    );
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        totalCount,
        subtotal,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
}
