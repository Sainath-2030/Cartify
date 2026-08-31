import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { wishlistService } from '../services/wishlistService.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { useCart } from '../hooks/useCart.js';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { refreshCart } = useCart();

  const [wishlist, setWishlist] = useState({
    items: [],
    totalItems: 0,
  });
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  // Fetch wishlist and fast ID set from backend
  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlist({ items: [], totalItems: 0 });
      setWishlistIds(new Set());
      return;
    }
    setIsLoading(true);
    try {
      const [resList, resIds] = await Promise.all([
        wishlistService.getWishlist(),
        wishlistService.getWishlistIds(),
      ]);
      if (resList.data) setWishlist(resList.data);
      if (resIds.data) setWishlistIds(new Set(resIds.data.map(Number)));
    } catch (err) {
      console.warn('Failed to load wishlist:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // Fast O(1) check
  const isWishlisted = (productId) => {
    return wishlistIds.has(Number(productId));
  };

  // Toggle wishlist state
  const toggleWishlist = async (productId) => {
    if (!isAuthenticated) {
      showToast('Please log in to save items to your wishlist.', 'error');
      return { success: false, requireAuth: true };
    }

    const numId = Number(productId);
    const currentlyInWishlist = wishlistIds.has(numId);
    setIsMutating(true);

    try {
      if (currentlyInWishlist) {
        const res = await wishlistService.removeItem(numId);
        setWishlist(res.data);
        setWishlistIds((prev) => {
          const next = new Set(prev);
          next.delete(numId);
          return next;
        });
        showToast('Removed from wishlist.', 'info');
      } else {
        const res = await wishlistService.addItem(numId);
        setWishlist(res.data);
        setWishlistIds((prev) => new Set(prev).add(numId));
        showToast('Added to your wishlist!', 'success');
      }
      return { success: true, inWishlist: !currentlyInWishlist };
    } catch (err) {
      showToast(err.message || 'Unable to update wishlist.', 'error');
      return { success: false, error: err.message };
    } finally {
      setIsMutating(false);
    }
  };

  // Remove single item
  const removeItem = async (productId) => {
    if (!isAuthenticated) return { success: false };
    const numId = Number(productId);
    setIsMutating(true);
    try {
      const res = await wishlistService.removeItem(numId);
      setWishlist(res.data);
      setWishlistIds((prev) => {
        const next = new Set(prev);
        next.delete(numId);
        return next;
      });
      showToast('Item removed from wishlist.', 'info');
      return { success: true };
    } catch (err) {
      showToast(err.message || 'Failed to remove item.', 'error');
      return { success: false, error: err.message };
    } finally {
      setIsMutating(false);
    }
  };

  // Move item to cart
  const moveToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) return { success: false };
    const numId = Number(productId);
    setIsMutating(true);
    try {
      const res = await wishlistService.moveToCart(numId, quantity);
      setWishlist(res.data.wishlist);
      setWishlistIds((prev) => {
        const next = new Set(prev);
        next.delete(numId);
        return next;
      });
      await refreshCart();
      showToast('Item moved to your cart!', 'success');
      return { success: true };
    } catch (err) {
      showToast(err.message || 'Unable to move item to cart.', 'error');
      return { success: false, error: err.message };
    } finally {
      setIsMutating(false);
    }
  };

  // Clear entire wishlist
  const clearWishlist = async () => {
    if (!isAuthenticated) return { success: false };
    setIsMutating(true);
    try {
      const res = await wishlistService.clearWishlist();
      setWishlist(res.data);
      setWishlistIds(new Set());
      showToast('Wishlist cleared.', 'info');
      return { success: true };
    } catch (err) {
      showToast(err.message || 'Unable to clear wishlist.', 'error');
      return { success: false, error: err.message };
    } finally {
      setIsMutating(false);
    }
  };

  const value = {
    wishlist,
    items: wishlist.items,
    totalItems: wishlist.totalItems,
    wishlistIds,
    isLoading,
    isMutating,
    isWishlisted,
    toggleWishlist,
    removeItem,
    moveToCart,
    clearWishlist,
    refreshWishlist: fetchWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
};
