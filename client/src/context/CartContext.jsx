import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { cartService } from '../services/cartService.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [cart, setCart] = useState({
    items: [],
    itemCount: 0,
    totalItems: 0,
    subtotal: 0,
    currency: 'INR',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Fetch cart from backend whenever authenticated state changes
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart({ items: [], itemCount: 0, totalItems: 0, subtotal: 0, currency: 'INR' });
      return;
    }
    setIsLoading(true);
    try {
      const res = await cartService.getCart();
      if (res.data) {
        setCart(res.data);
      }
    } catch (err) {
      console.warn('Failed to load cart:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // Add item to cart
  const addItem = async (productId, quantity = 1, options = { openDrawer: true }) => {
    if (!isAuthenticated) {
      showToast('Please log in to add items to your cart.', 'error');
      return { success: false, requireAuth: true };
    }

    setIsMutating(true);
    try {
      const res = await cartService.addItem(productId, quantity);
      setCart(res.data);
      showToast('Item added to cart!', 'success');
      if (options.openDrawer) {
        setIsCartOpen(true);
      }
      return { success: true, cart: res.data };
    } catch (err) {
      showToast(err.message || 'Unable to add item to cart.', 'error');
      return { success: false, error: err.message };
    } finally {
      setIsMutating(false);
    }
  };

  // Update quantity of an item
  const updateQuantity = async (productId, quantity) => {
    if (!isAuthenticated) return { success: false };

    setIsMutating(true);
    try {
      const res = await cartService.updateQuantity(productId, quantity);
      setCart(res.data);
      return { success: true, cart: res.data };
    } catch (err) {
      showToast(err.message || 'Unable to update item quantity.', 'error');
      return { success: false, error: err.message };
    } finally {
      setIsMutating(false);
    }
  };

  // Remove item from cart
  const removeItem = async (productId) => {
    if (!isAuthenticated) return { success: false };

    setIsMutating(true);
    try {
      const res = await cartService.removeItem(productId);
      setCart(res.data);
      showToast('Item removed from cart.', 'info');
      return { success: true, cart: res.data };
    } catch (err) {
      showToast(err.message || 'Unable to remove item.', 'error');
      return { success: false, error: err.message };
    } finally {
      setIsMutating(false);
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    if (!isAuthenticated) return { success: false };

    setIsMutating(true);
    try {
      const res = await cartService.clearCart();
      setCart(res.data);
      showToast('Cart cleared.', 'info');
      return { success: true, cart: res.data };
    } catch (err) {
      showToast(err.message || 'Unable to clear cart.', 'error');
      return { success: false, error: err.message };
    } finally {
      setIsMutating(false);
    }
  };

  const value = {
    cart,
    items: cart.items,
    itemCount: cart.itemCount,
    totalItems: cart.totalItems,
    subtotal: cart.subtotal,
    isLoading,
    isMutating,
    isCartOpen,
    openCart,
    closeCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart: fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};
