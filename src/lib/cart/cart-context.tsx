"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { CartItem } from "@/types/cms";
import { getClientTenantId } from "@/lib/tenant/client";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function getStorageKey(tenantId: string | null) {
  return tenantId ? `cart_${tenantId}` : "cart_default";
}

function loadCart(key: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function saveCart(key: string, items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(items));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [storageKey, setStorageKey] = useState("cart_default");
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    getClientTenantId().then((tenantId) => {
      const key = getStorageKey(tenantId);
      setStorageKey(key);
      setItems(loadCart(key));
    });
  }, []);

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    saveCart(storageKey, next);
  }, [storageKey]);

  const addItem = useCallback((incoming: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setItems((prev) => {
      const qty = incoming.quantity ?? 1;
      const existing = prev.find((i) => i.id === incoming.id);
      const next = existing
        ? prev.map((i) => i.id === incoming.id ? { ...i, quantity: i.quantity + qty } : i)
        : [...prev, { ...incoming, quantity: qty }];
      saveCart(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      saveCart(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty < 1) return;
    setItems((prev) => {
      const next = prev.map((i) => i.id === id ? { ...i, quantity: qty } : i);
      saveCart(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const clearCart = useCallback(() => {
    persist([]);
  }, [persist]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, itemCount, subtotal, addItem, removeItem, updateQty, clearCart, isOpen, openCart, closeCart }}>
      {children}
    </CartContext.Provider>
  );
}

const NOOP_CART: CartContextValue = {
  items: [],
  itemCount: 0,
  subtotal: 0,
  addItem: () => {},
  removeItem: () => {},
  updateQty: () => {},
  clearCart: () => {},
  isOpen: false,
  openCart: () => {},
  closeCart: () => {},
};

export function useCart() {
  return useContext(CartContext) ?? NOOP_CART;
}
